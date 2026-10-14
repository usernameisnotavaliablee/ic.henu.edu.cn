// 检查真实渲染字体、学院概况、英文、动效中间帧与减少动态效果。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.IC_TEST_MODULES, 'playwright'));
const base = process.argv[2] || 'http://127.0.0.1:8766';
const root = path.resolve(__dirname, '..');
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
    for (const file of fs.readdirSync(path.join(root, 'preview')).filter(f => f.endsWith('.html'))) {
      await page.goto(`${base}/${file}`);
      await page.evaluate(() => document.fonts.ready);
      const dom = await cdp.send('DOM.getDocument');
      const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: dom.root.nodeId, selector: '.brand-motto, .editorial-heading h2, .feature-intro, .footer-campus p' });
      for (const nodeId of nodeIds) {
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        assert(fonts.length && fonts.every(f => f.isCustomFont), `${file}: 标题区域出现回退字体 ${JSON.stringify(fonts)}`);
        report.fonts.push({ file, fonts });
      }
      const styles = await page.locator('.editorial-heading h2').evaluateAll(es => es.map(e => ({ family: getComputedStyle(e).fontFamily, weight: getComputedStyle(e).fontWeight })));
      assert(styles.every(s => s.family.replace(/["']/g, '').startsWith('IC ZhuangSong') && s.weight === '400'), `${file}: ${JSON.stringify(styles)}`);
      assert(!(await page.locator('body').evaluate(e => getComputedStyle(e).fontFamily)).includes('IC ZhuangSong'));
      report.pages.push(file);
    }
    await page.goto(base + '/about.html');
    assert.equal(await page.locator('[data-overview-section]').count(), 3);
    assert.deepEqual(await page.locator('.editorial-heading h2').allTextContents(), ['学院简介', '组织机构', '领导班子']);
    const stop = await page.locator('[data-overview-section]').first().evaluate(e => e.getBoundingClientRect().top + scrollY - 91);
    await page.evaluate(y => scrollTo(0, y - 110), stop);
    await page.mouse.move(900, 700);
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(500);
    const midway = await page.evaluate(() => ({ y: scrollY, state: document.documentElement.dataset.scrollState }));
    assert.equal(midway.state, 'settling');
    assert(midway.y < stop);
    await page.waitForTimeout(1700);
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
    await page.screenshot({ path: path.join(root, 'qa/about-desktop.png') });
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
    await page.screenshot({ path: path.join(root, 'qa/party-mobile.png') });
    await page.goto(base + '/index.html');
    assert(await page.locator('.home-section > .section-watermark').evaluateAll(es => es.every(e => getComputedStyle(e).animationName === 'none')));
    assert.deepEqual(errors, []);
    report.result = 'passed';
    fs.writeFileSync(path.join(root, 'qa/overview-typography.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`PASS: ${report.pages.length} pages, ${report.fonts.length} rendered font regions, 15 responsive checks, about snap and breathing keyframes, reduced motion, unchanged home watermarks`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
