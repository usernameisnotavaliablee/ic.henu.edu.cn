// 本地静态预览回归：菜单当前项、资讯分类、子板块背景及手机布局。
const { chromium } = require(require('node:path').join(process.env.IC_TEST_MODULES, 'playwright'));
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const output = path.resolve(process.env.IC_TEST_OUTPUT || 'sandbox/frontend-checks');
fs.mkdirSync(output, { recursive: true });
const base = process.argv[2] || 'http://127.0.0.1:8766';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    for (const file of ['news.html', 'notices.html', 'media.html', 'media-section-1.html']) {
      await page.goto(base + '/' + file);
      assert.deepEqual(await page.locator('.list-tabs a').allTextContents(), ['学院新闻', '通知公告', '媒体掠影']);
    }
    await page.goto(base + '/news.html');
    await page.locator('.main-nav > ul > li > .nav-item-heading > a[href="news.html"]').hover();
    await page.waitForTimeout(650);
    const link = page.locator('.main-nav .subnav a[href="news.html"]');
    // 动态页面会给同地址的子菜单加当前页标记，复现原截图中的状态。
    await link.evaluate(e => e.setAttribute('aria-current', 'page'));
    await page.waitForTimeout(300);
    assert.equal(await link.evaluate(e => getComputedStyle(e).color), 'rgb(18, 62, 112)');
    await link.hover();
    await page.waitForTimeout(300);
    assert.equal(await link.evaluate(e => getComputedStyle(e).color), 'rgb(18, 62, 112)');
    await page.goto(base + '/talent-cultivation.html');
    const backgrounds = await page.locator('.collection-preview').evaluateAll(es => es.map(e => getComputedStyle(e).backgroundColor));
    assert.equal(new Set(backgrounds).size, 2);
    const sections = require('../src/data/columns').nodes.find(n=>n.id==='education').sections;
    assert.deepEqual(backgrounds, sections.map((_,i)=>i%2?'rgb(243, 246, 250)':'rgb(255, 255, 255)'));
    assert.equal(await page.locator('.overview-sections .section-watermark').count(), sections.length);
    assert.equal(await page.locator('.research-topics').count(), 0);
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
    await page.screenshot({ path: path.join(output, 'overview-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('.footer-support').getAttribute('href'), 'https://hdwzgzs.cn/');
    await page.screenshot({ path: path.join(output, 'overview-mobile.png') });
    for (const file of ['science-innovation', 'admissions', 'community', 'management', 'party-building', 'ic-world', 'research-platforms', 'research-groups', 'careers']) {
      await page.goto(base + '/' + file + '.html');
      assert(await page.locator('[data-overview-section]').count());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), file);
    }
    await page.goto(base + '/science-innovation.html');
    assert.deepEqual(await page.locator('.overview-sections .editorial-heading h2').allTextContents(), ['研究方向','课题组','研究进展','学术交流']);
    const group = page.locator('#research-groups[data-collection="research-groups.section-1"]');
    assert.equal(await group.locator('.editorial-heading a').getAttribute('href'), 'research-groups-section-1.html');
    assert.equal(await page.locator('.overview-related a[href="research-groups.html"]').count(), 0);
    for(const width of [1440,768,390]) {
      await page.setViewportSize({width,height:900});
      await group.scrollIntoViewIfNeeded();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `research groups at ${width}`);
      await group.screenshot({path:path.join(output,`research-groups-${width}.png`)});
    }
    await group.locator('.editorial-heading a').click();
    await page.waitForURL('**/research-groups-section-1.html');
    await page.goto(base + '/admissions-section-3.html');
    assert.equal(await page.locator('[data-overview-section]').count(), 0);
    await page.goto(base + '/media-section-1.html');
    assert.equal(await page.locator('.collection-sidebar').count(), 0);
    console.log('PASS: four news tab pages, current submenu before/after hover, alternating sections, mobile overflow, studio URL');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
