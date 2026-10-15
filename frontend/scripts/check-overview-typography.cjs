// 检查真实渲染字体、学院概况、英文、动效中间帧与减少动态效果。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.IC_TEST_MODULES, 'playwright'));
const base = process.argv[2] || 'http://127.0.0.1:8766';
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.IC_TEST_OUTPUT || 'sandbox/frontend-checks');
fs.mkdirSync(output, { recursive: true });
// 标题字体必须是自托管子集，且体积受控；防止误把 18MB 母版或未子集化文件发上线。
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'licenses/zhuangsong-manifest.txt'), 'utf8'));
const fontAssets = Object.keys(manifest.files).filter(f => f.startsWith('src/assets/'));
assert.equal(fontAssets.length, 1, `标题字体资产应恰好一个：${fontAssets}`);
const fontBytes = fs.statSync(path.join(root, fontAssets[0])).size;
assert(fontBytes <= 150 * 1024, `标题字体子集过大：${fontBytes} 字节`);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { scope: 'Edge desktop and emulated viewport; no physical-device or production check', fontStrategy: 'self-hosted ZhuangSong subset, no local font dependency', fontBytes, pages: [], fonts: [], motion: {}, widths: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const titleSelector = '.editorial-heading h2, .feature-intro, .footer-motto';
    const platformFonts = async () => {
      const dom = await cdp.send('DOM.getDocument');
      const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: dom.root.nodeId, selector: titleSelector });
      const out = [];
      for (const nodeId of nodeIds) out.push((await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts);
      return out;
    };
    for (const file of fs.readdirSync(path.join(root, 'preview')).filter(f => f.endsWith('.html'))) {
      await page.goto(`${base}/${file}`);
      // 先把已声明的字面都 load 完，再量。只等 fonts.ready 不够：@font-face 还没被请求时它就已经 resolve。
      // 这不会掩盖 CSS 没引用自托管字体的情况——下面量的是实际渲染字体。
      await page.evaluate(async () => {
        await Promise.all([...document.fonts].map(f => f.load().catch(() => {})));
        await document.fonts.ready;
      });
      // 量实际渲染字体。若下面报错里字体面状态是 `|error`，那是字体文件请求失败
      // （本地 `python3 -m http.server` 在多路并发抓站时会 ERR_CONNECTION_RESET），不是 CSS 或子集的问题；
      // 单人跑一次即可复现干净结果。状态是 `|loaded` 却仍报回退，才是真问题。
      const fonts = await platformFonts();
      const faceStatus = await page.evaluate(() => [...document.fonts].map(f => `${f.family}|${f.status}`).join(', '));
      fonts.forEach(f => {
        assert(f.length && f.every(x => x.isCustomFont), `${file}: 标题区域出现回退字体 ${JSON.stringify(f)}；字体面状态 ${faceStatus}`);
        report.fonts.push({ file, fonts: f });
      });
      const styles = await page.locator('.editorial-heading h2').evaluateAll(es => es.map(e => ({ family: getComputedStyle(e).fontFamily, weight: getComputedStyle(e).fontWeight })));
      assert(styles.every(s => s.family.replace(/["']/g, '').startsWith('IC ZhuangSong') && s.weight === '400'), `${file}: ${JSON.stringify(styles)}`);
      assert(!(await page.locator('body').evaluate(e => getComputedStyle(e).fontFamily)).includes('IC ZhuangSong'));
      report.pages.push(file);
    }
    await page.goto(base + '/about.html');
    assert.equal(await page.locator('[data-overview-section]').count(), 2);
    assert.deepEqual(await page.locator('.editorial-heading h2').allTextContents(), ['学院简介', '管理机构']);
    // 吸附落点 = 元素顶 - 该元素自己的 scroll-margin-top（CSS 里绑 --header-compact-height）。读计算值，别再写死 91。
    const stop = await page.locator('[data-overview-section]').first().evaluate(e => e.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(e).scrollMarginTop));
    await page.evaluate(y => scrollTo(0, y - 110), stop);
    await page.mouse.move(900, 700);
    await page.mouse.wheel(0, 40);
    // 等状态机自己进入 settling，别用固定 sleep 赌它还在（固定 500ms 会偶发采到 idle，被误读成"时序不稳定"）。
    await page.waitForFunction(() => document.documentElement.dataset.scrollState === 'settling', null, { timeout: 3000 });
    const midway = await page.evaluate(() => ({ y: scrollY, state: document.documentElement.dataset.scrollState }));
    assert.equal(midway.state, 'settling');
    assert(midway.y < stop);
    await page.waitForFunction(() => document.documentElement.dataset.scrollState !== 'settling', null, { timeout: 5000 });
    assert(Math.abs(await page.evaluate(() => scrollY) - stop) < 3);
    report.motion.snap = { stop, midway, end: await page.evaluate(() => scrollY) };
    const mark = page.locator('.overview-section > .section-watermark').first();
    assert.equal(await mark.evaluate(e => getComputedStyle(e).animationPlayState), 'running');
    const before = await mark.evaluate(e => Number(getComputedStyle(e).opacity));
    await page.waitForTimeout(400);
    const after = await mark.evaluate(e => Number(getComputedStyle(e).opacity));
    assert(Math.abs(after - before) > .001, 'breathing must actually advance over time');
    report.motion.liveOpacity = { before, after };
    // 固定动画时间核对渐隐、渐显端点和中间帧，避免截图时间碰巧处于透明帧。
    report.motion.opacity = await mark.evaluate(e => {
      const animation = e.getAnimations()[0];
      animation.pause();
      return [0, 2000, 4000, 6000, 8000].map(t => { animation.currentTime = t; return Number(getComputedStyle(e).opacity); });
    });
    assert.equal(report.motion.opacity[0], 0);
    assert(report.motion.opacity[1] > 0 && report.motion.opacity[1] < 1);
    assert.equal(report.motion.opacity[2], 1);
    assert.equal(report.motion.opacity[4], 0);
    // 模拟自托管字体不可用（被拦截或尚未加载），确认尾部系统宋体兜底仍能正常排版。
    const fallbackStyle = await page.addStyleTag({ content: ':root { --font-display: "Songti SC", "SimSun", serif; }' });
    await page.evaluate(() => document.fonts.ready);
    const fallbackDom = await cdp.send('DOM.getDocument');
    const fallbackHeading = await cdp.send('DOM.querySelector', { nodeId: fallbackDom.root.nodeId, selector: '.editorial-heading h2' });
    report.fallbackFonts = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId: fallbackHeading.nodeId })).fonts;
    assert(report.fallbackFonts.length && report.fallbackFonts.every(f => !f.isCustomFont), JSON.stringify(report.fallbackFonts));
    assert.equal(await page.locator('.editorial-heading h2').first().textContent(), '学院简介');
    await fallbackStyle.evaluate(e => e.remove());
    await mark.evaluate(e => { e.getAnimations()[0].currentTime = 4000; });
    await page.screenshot({ path: path.join(output, 'about-desktop.png') });
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    assert.equal(await mark.evaluate(e => getComputedStyle(e).animationPlayState), 'paused');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await mark.evaluate(e => getComputedStyle(e).animationName), 'none');
    assert.equal(await mark.evaluate(e => getComputedStyle(e).opacity), '1');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const file of ['about', 'party-building', 'talent-cultivation']) {
        await page.goto(`${base}/${file}.html`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file} at ${width}`);
        report.widths.push({ file, width });
      }
    }
    await page.goto(base + '/party-building.html');
    assert.equal(await page.locator('.page-banner p').textContent(), 'PARTY BUILDING');
    assert.deepEqual(await page.locator('.editorial-heading span[lang="en"]').allTextContents(), ['PARTY', 'LEARNING']);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-overview-section]').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1100);
    await page.screenshot({ path: path.join(output, 'party-mobile.png') });
    await page.goto(base + '/index.html');
    assert(await page.locator('.home-section > .section-watermark').evaluateAll(es => es.every(e => getComputedStyle(e).animationName === 'none')));
    assert.deepEqual(errors, []);
    report.result = 'passed';
    fs.writeFileSync(path.join(output, 'overview-typography.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`PASS: ${report.pages.length} pages, ${report.fonts.length} rendered font regions, 15 responsive checks, about snap and breathing keyframes, reduced motion, unchanged home watermarks`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
