// 窄屏汉堡按钮：DOM 归属、触发区尺寸、无导航带、收缩后浮到右上角、桌面端隐藏。
const { chromium } = require(require('node:path').join(process.env.IC_TEST_MODULES, 'playwright'));
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:8766';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    // 本地静态服务偶发中断会让 main.js 没跑起来；就绪前重载一次，避免把环境抖动当回归。
    const ready = () => page.waitForFunction(() => document.querySelector('.main-nav')?.classList.contains('is-enhanced'), null, { timeout: 8000 }).then(() => true, () => false);
    await page.goto(base + '/');
    if (!(await ready())) { await page.reload(); assert(await ready(), '页面脚本未就绪：main.js 未增强导航'); }
    const toggle = page.locator('.nav-toggle');
    assert.equal(await toggle.count(), 1);
    assert(await toggle.isVisible(), '窄屏按钮应可见');
    assert((await toggle.evaluate(e => e.parentElement.className)).includes('header-main'), '按钮 DOM 应在 container header-main 内');
    const box = () => toggle.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const bandH = () => page.evaluate(() => document.querySelector('.navigation-band').getBoundingClientRect().height);
    // 触发区 = 图标矩形（30x22）+ 各边 5px，无额外伪元素放大。
    const expanded = await box();
    assert(Math.abs(expanded.w - 40) < 2 && Math.abs(expanded.h - 32) < 2, `触发区应为 40x32，实测 ${expanded.w}x${expanded.h}`);
    assert(Math.abs(expanded.y - 34) < 4, `展开态应居中于 100px 品牌行，实测 top ${expanded.y}`);
    assert(Math.abs(expanded.x + expanded.w - 379) < 3, `图标右缘应对齐 container 槽，实测 ${expanded.x + expanded.w}`);
    // 关闭态不许有导航带：高度 0，底色无从绘制。
    assert(await bandH() < 1, `展开态不应有导航带，实测 ${await bandH()}px`);
    await toggle.click();
    assert.equal(await page.locator('.main-nav.open').count(), 1, '菜单应能打开');
    assert(await bandH() > 100, '菜单展开时带应长出来当面板');
    await toggle.click();
    assert.equal(await page.locator('.main-nav.open').count(), 0, '再点应关闭菜单');
    assert(await bandH() < 1, '菜单收起后带应消失');
    // 展开高度须与预留一致，否则首屏跳动。
    const home = await page.evaluate(() => ({ hdr: document.querySelector('.site-header').getBoundingClientRect().height, min: parseFloat(getComputedStyle(document.querySelector('.header-shell')).minHeight) }));
    assert(Math.abs(home.hdr - home.min) < 1.5, `首页页头高度应与预留一致，实测 ${home.hdr} vs ${home.min}`);
    // 上滑收缩：按钮脱离品牌行，独立浮在右上角。
    await page.evaluate(() => scrollTo(0, 500));
    // 无头浏览器 rAF 被节流，900ms 动画实际更久，等足。
    await page.waitForTimeout(2600);
    assert(await page.evaluate(() => document.querySelector('.site-header').classList.contains('is-compact')), '上滑后页头应收缩');
    const compact = await box();
    assert(Math.abs(compact.y - 11) < 2.5, `收缩态应浮到右上角，实测 top ${compact.y}`);
    assert(Math.abs(compact.w - 40) < 2 && Math.abs(compact.h - 32) < 2, '收缩态触发区不应变化');
    assert(await bandH() < 1, `收缩态也不应有导航带，实测 ${await bandH()}px`);
    const skin = await toggle.evaluate(el => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, color: cs.color }; });
    assert(skin.bg === 'rgba(0, 0, 0, 0)', `收缩态按钮不得有任何底色，实测 ${skin.bg}`);
    // color-mix 会序列化成 color(srgb r g b)，取值再比。
    const rgb = skin.color.match(/[\d.]+/g).slice(-3).map(Number);
    const to255 = v => Math.round(v <= 1 ? v * 255 : v);
    assert(rgb.length === 3 && Math.abs(to255(rgb[0]) - 18) < 2 && Math.abs(to255(rgb[1]) - 62) < 2 && Math.abs(to255(rgb[2]) - 112) < 2, `收缩态三条杠应为品牌蓝 #123e70，实测 ${skin.color}`);
    // inert 只能落在品牌行：落到 .header-main 会把按钮一起禁掉。
    const inerts = await page.evaluate(() => ({ brand: document.querySelector('.brand').inert, toggle: document.querySelector('.nav-toggle').inert }));
    assert(inerts.brand === true && inerts.toggle === false, `收缩态应只禁用品牌行，实测 ${JSON.stringify(inerts)}`);
    // 收缩态展开菜单：面板要给浮着的按钮让位，不压住首个卡片。
    await toggle.click();
    assert.equal(await page.locator('.main-nav.open').count(), 1, '收缩态按钮仍可点');
    await page.waitForTimeout(500);
    const clash = await page.evaluate(() => {
      const r = document.querySelector('.nav-toggle').getBoundingClientRect();
      const card = document.querySelector('.main-nav > ul > .nav-item').getBoundingClientRect();
      return { btnBottom: r.bottom, cardTop: card.top, bandTop: document.querySelector('.navigation-band').getBoundingClientRect().top };
    });
    assert(clash.cardTop >= clash.btnBottom, `展开的面板不应压住按钮，实测卡片顶 ${clash.cardTop} vs 按钮底 ${clash.btnBottom}`);
    assert(clash.bandTop < 1, `收缩态面板应从视口顶端落下，实测 ${clash.bandTop}`);
    // 菜单展开时按钮背后是深色面板，三条杠必须转回白色才看得见。
    const openColor = await toggle.evaluate(el => getComputedStyle(el).color);
    assert(openColor === 'rgb(255, 255, 255)', `菜单展开时三条杠应转白，实测 ${openColor}`);
    await toggle.click();
    await page.waitForTimeout(400);
    const closedColor = await toggle.evaluate(el => getComputedStyle(el).color);
    assert(closedColor !== 'rgb(255, 255, 255)', `菜单收起后三条杠应转回品牌蓝，实测 ${closedColor}`);
    // 桌面端：带与按钮都保持原样。
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + '/');
    await page.waitForTimeout(600);
    assert(!(await toggle.isVisible()), '桌面端按钮应隐藏');
    assert(await bandH() > 40, `桌面端导航带应保留，实测 ${await bandH()}px`);
    console.log('PASS: 按钮在 header-main 内、触发区 40x32、窄屏无导航带、收缩后浮右上角、面板让位、桌面端保留带');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
