// 窄屏汉堡按钮：DOM 归属、触发区尺寸、随页头收缩下落、桌面端隐藏。
const { chromium } = require(require('node:path').join(process.env.IC_TEST_MODULES, 'playwright'));
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:8766';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base + '/');
    await page.waitForTimeout(1200);
    const toggle = page.locator('.nav-toggle');
    assert.equal(await toggle.count(), 1);
    assert(await toggle.isVisible(), '窄屏按钮应可见');
    assert((await toggle.evaluate(e => e.parentElement.className)).includes('header-main'), '按钮 DOM 应在 container header-main 内');
    const hit = e => e.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    // 触发区 = 图标矩形（30x22）+ 各边 5px，无额外伪元素放大。
    const expanded = await hit(toggle);
    assert(Math.abs(expanded.w - 40) < 2 && Math.abs(expanded.h - 32) < 2, `触发区应为 40x32，实测 ${expanded.w}x${expanded.h}`);
    assert(Math.abs(expanded.y - 34) < 4, `展开态应居中于 100px 品牌行，实测 top ${expanded.y}`);
    assert(Math.abs(expanded.x + expanded.w - 379) < 3, `图标右缘应对齐 container 槽，实测 ${expanded.x + expanded.w}`);
    await toggle.click();
    assert.equal(await page.locator('.main-nav.open').count(), 1, '菜单应能打开');
    await toggle.click();
    await page.evaluate(() => scrollTo(0, 400));
    // 无头浏览器 rAF 被节流，900ms 动画实际更久，等足。
    await page.waitForTimeout(2600);
    assert(await page.evaluate(() => document.querySelector('.site-header').classList.contains('is-compact')), '上滑后页头应收缩');
    const compact = await hit(toggle);
    assert(Math.abs(compact.y - 5.5) < 2.5, `收缩态应落入 43px 导航带，实测 top ${compact.y}`);
    assert(Math.abs(compact.w - 40) < 2 && Math.abs(compact.h - 32) < 2, '收缩态触发区不应变化');
    const band = await page.evaluate(() => document.querySelector('.navigation-band').getBoundingClientRect().height);
    assert(Math.abs(band - 44) < 2, `收缩态导航带应长到 43px+1px 边线，实测 ${band}`);
    // inert 只能落在品牌行：落到 .header-main 会把按钮一起禁掉。
    const inerts = await page.evaluate(() => ({ brand: document.querySelector('.brand').inert, toggle: document.querySelector('.nav-toggle').inert }));
    assert(inerts.brand === true && inerts.toggle === false, `收缩态应只禁用品牌行，实测 ${JSON.stringify(inerts)}`);
    await toggle.click();
    assert.equal(await page.locator('.main-nav.open').count(), 1, '收缩态按钮仍可点');
    // 展开高度须与 --header-expanded-height 一致，否则首屏跳动。
    await toggle.click();
    assert.equal(await page.locator('.main-nav.open').count(), 0, '再点应关闭菜单');
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(2600);
    const home = await page.evaluate(() => ({ hdr: document.querySelector('.site-header').getBoundingClientRect().height, min: parseFloat(getComputedStyle(document.querySelector('.header-shell')).minHeight) }));
    assert(Math.abs(home.hdr - home.min) < 1.5, `首页页头高度应与预留一致，实测 ${home.hdr} vs ${home.min}`);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + '/');
    assert(!(await toggle.isVisible()), '桌面端按钮应隐藏');
    console.log('PASS: 按钮在 header-main 内、触发区 40x32、随收缩落入导航带、inert 只打品牌行、桌面端隐藏');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
