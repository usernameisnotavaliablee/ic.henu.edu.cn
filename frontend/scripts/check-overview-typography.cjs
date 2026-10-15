// 检查真实渲染字体、全站概览标题位置、英文、动效中间帧与减少动态效果。
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
  const report = { scope: 'Edge desktop and emulated viewport; no physical-device or production check', fontStrategy: 'self-hosted ZhuangSong subset, no local font dependency', fontBytes, pages: [], fonts: [], headings: [], motion: {}, widths: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const overviewFiles = [];
    const checkHeadingPositions = async (file, width, selector = '[data-overview-section]') => {
      const headings = await page.locator(selector).evaluateAll(sections => sections.map(section => {
        const box = section.getBoundingClientRect(), heading = section.querySelector('.editorial-heading'), container = section.querySelector(':scope > .container');
        const row = heading.getBoundingClientRect(), content = container.getBoundingClientRect(), title = heading.querySelector('h2').getBoundingClientRect(), link = heading.querySelector(':scope > a')?.getBoundingClientRect();
        return {title:heading.querySelector('h2').textContent, topGap:row.top-box.top, bottomGap:box.bottom-content.bottom,
          linkBesideTitle: !link || (link.left >= title.right && link.top < title.bottom && link.bottom > title.top)};
      }));
      for (const heading of headings) {
        assert(heading.topGap >= 0 && heading.topGap <= 80, `${file} at ${width}: heading pushed into middle ${JSON.stringify(heading)}`);
        if (selector === '[data-overview-section]') assert(heading.bottomGap >= -1 && heading.bottomGap <= 80, `${file} at ${width}: forced empty section height ${JSON.stringify(heading)}`);
        assert(heading.linkBesideTitle, `${file} at ${width}: action detached from title ${JSON.stringify(heading)}`);
        report.headings.push({file,width,...heading});
      }
      return headings.length;
    };
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
      if (await checkHeadingPositions(file, 1440)) overviewFiles.push(file);
      report.pages.push(file);
    }
    await page.goto(base + '/about.html');
    assert.equal(await page.locator('[data-overview-section]').count(), 3);
    assert.deepEqual(await page.locator('.editorial-heading h2').allTextContents(), ['学院简介', '学术委员会', '管理机构']);
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
    // 紧凑空态不再撑满一屏；缩短视口，确保第一节确实离屏后再检查暂停。
    await page.setViewportSize({width:1440,height:600});
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(()=>document.querySelector('[data-overview-section]').getBoundingClientRect().bottom<=0);
    await page.waitForFunction(()=>!document.querySelector('[data-overview-section]').classList.contains('is-animating'));
    assert.equal(await mark.evaluate(e => getComputedStyle(e).animationPlayState), 'paused');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await mark.evaluate(e => getComputedStyle(e).animationName), 'none');
    assert.equal(await mark.evaluate(e => getComputedStyle(e).opacity), '1');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const file of overviewFiles.map(file => file.replace(/\.html$/, ''))) {
        await page.goto(`${base}/${file}.html`);
        await page.evaluate(() => document.fonts.ready);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file} at ${width}`);
        await checkHeadingPositions(file + '.html', width);
        if (file === 'about') {
          const layout = await page.locator('.overview-layout').first().evaluate(el => {
            const copy=el.querySelector('.overview-copy').getBoundingClientRect(),photo=el.querySelector('.overview-photo').getBoundingClientRect(),prose=el.querySelector('.overview-prose');
            return {copy:{top:copy.top,bottom:copy.bottom,right:copy.right},photo:{top:photo.top,left:photo.left},textLeft:prose.getBoundingClientRect().left+parseFloat(getComputedStyle(prose).paddingLeft)};
          });
          assert(width>=960 ? layout.photo.left>layout.copy.right && Math.abs(layout.photo.top-layout.copy.top)<2 : layout.photo.top>=layout.copy.bottom && Math.abs(layout.photo.left-layout.textLeft)<2, `about alignment ${width}: ${JSON.stringify(layout)}`);
          assert.equal(await page.locator('.about-section .management-entry a').count(),4);
          const management=page.locator('.about-section').filter({has:page.locator('.management-entry')});
          assert(await management.evaluate(el=>el.getBoundingClientRect().height<600), `management should fit its content at ${width}`);
          if([1440,390].includes(width)) {
            await page.locator('.overview-photo img').evaluate(img=>img.decode());
            await page.locator('.about-section').first().screenshot({path:path.join(output,`about-introduction-${width}.png`)});
            await management.screenshot({path:path.join(output,`about-management-${width}.png`)});
          }
        }
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
    // 无动画时量最终布局，避免把入场位移当作标题位置；首页整屏高度仍保留。
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await checkHeadingPositions('index.html', width, '[data-home-section]');
      if (width === 1440) assert(await page.locator('[data-home-section]').evaluateAll(sections => sections.every(section => section.offsetHeight >= innerHeight - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-compact-height')))), 'home keeps full-height sections');
    }
    assert.deepEqual(errors, []);
    report.result = 'passed';
    fs.writeFileSync(path.join(output, 'overview-typography.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`PASS: ${report.pages.length} pages, ${report.fonts.length} rendered font regions, ${report.widths.length} responsive checks, ${report.headings.length} heading positions, about snap and breathing keyframes, reduced motion, unchanged home watermarks`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
