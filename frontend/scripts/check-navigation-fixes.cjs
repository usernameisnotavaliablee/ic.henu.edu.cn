// 本地静态预览回归：菜单当前项、资讯分类、子板块背景及手机布局。
const { chromium } = require(require('node:path').join(process.env.IC_TEST_MODULES, 'playwright'));
const assert = require('node:assert/strict');
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
    await page.locator('.collection-preview').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'frontend/qa/section-colors-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('.footer-support').getAttribute('href'), 'https://hdwzgzs.cn/');
    console.log('PASS: four news tab pages, current submenu before/after hover, alternating sections, mobile overflow, studio URL');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
