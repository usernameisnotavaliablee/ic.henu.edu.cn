// 历史设计检查：依赖已删除的暂停按钮；2026-10-12新版请用check-current-design.cjs。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.IC_TEST_MODULES, 'playwright'));
const checks = [];
const record = (name, ok) => { assert.ok(ok, name); checks.push(name); console.log('PASS ' + name); };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:8765' ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const home = async () => { await page.goto('http://127.0.0.1:8765/'); await page.locator('[data-active-slide]').waitFor(); };
    const settled = () => page.locator('[data-transition="idle"]').waitFor();
    await home();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(300);
    record('桌面鼠标离开轮播时两侧箭头隐藏', await page.locator('[data-next]').evaluate(el => getComputedStyle(el).opacity === '0'));
    await page.locator('[data-carousel]').hover();
    await page.waitForTimeout(300);
    record('悬停显示两侧大箭头', await page.locator('[data-next]').evaluate(el => getComputedStyle(el).opacity === '1' && el.clientWidth >= 64 && el.clientHeight >= 110));
    await page.locator('[data-pause]').click();
    await page.locator('[data-next]').click();
    await settled();
    record('侧边箭头仍能手动切图', await page.locator('[data-carousel]').getAttribute('data-active-slide') === '1');
    const img = page.locator('[data-slide]').nth(1).locator('.hero-image');
    const scaleBefore = await img.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11);
    await page.waitForTimeout(900);
    const scaleAfter = await img.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11);
    record('照片呼吸效果缓慢缩放且不超过4.5%', Math.abs(scaleAfter - scaleBefore) > .001 && scaleAfter >= 1 && scaleAfter <= 1.0451);
    await page.locator('[data-motion-toggle]').click();
    record('暂停动效同步暂停图片呼吸', await img.evaluate(el => getComputedStyle(el).animationPlayState === 'paused'));
    await page.locator('[data-motion-toggle]').click();
    await page.locator('[data-pause]').click();
    const indexBefore = await page.locator('[data-carousel]').getAttribute('data-active-slide');
    await page.waitForTimeout(3200);
    record('新增呼吸与侧边箭头后3秒自动轮播仍有效', await page.locator('[data-carousel]').getAttribute('data-active-slide') !== indexBefore);
    await page.locator('[data-pause]').click();
    await settled();
    const faculty = page.locator('.nav-item').filter({ has: page.locator('.nav-item-heading > a[href="faculty.html"]') });
    await faculty.hover();
    await page.waitForTimeout(300);
    record('师资悬停展开下拉菜单及真实链接', await faculty.locator('.subnav').isVisible() && await faculty.locator('.subnav-toggle').getAttribute('aria-expanded') === 'true' && await faculty.locator('.subnav a[href="teacher-zhang-jinlong.html"]').isVisible());
    await page.screenshot({ path: 'frontend/qa/navigation-desktop.png' });
    await faculty.locator('.subnav-toggle').focus();
    await page.keyboard.press('Escape');
    record('Escape关闭子菜单并保留按钮焦点', !(await faculty.locator('.subnav').isVisible()) && await faculty.locator('.subnav-toggle').evaluate(el => el === document.activeElement));
    await page.mouse.move(10, 10);
    await page.locator('.nav-item-heading > a[href="science-innovation.html"]').focus();
    record('键盘聚焦也能打开下拉菜单', await page.locator('#subnav-2').isVisible());
    await page.keyboard.press('Escape');
    await page.locator('body').click({ position: { x: 10, y: 20 } });
    record('桌面启用原生强制吸附', await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType.includes('mandatory')));
    await page.mouse.move(1200, 650);
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(1600);
    const snap = await page.evaluate(() => ({ y: scrollY, news: document.getElementById('home-news').offsetTop }));
    console.log('SNAP', snap);
    record('滚到中间后自动吸附到下一板块起点', snap.y > 100 && Math.abs(snap.y - snap.news) < 4);
    await page.waitForTimeout(1100);
    record('吸附后的板块内容已完整浮现', await page.locator('#home-news > .container').evaluate(el => getComputedStyle(el).opacity === '1'));
    await page.screenshot({ path: 'frontend/qa/news-section.png' });
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(1600);
    record('继续滚动吸附到通知板块', await page.evaluate(() => Math.abs(scrollY - document.getElementById('home-notices').offsetTop) < 4));
    // 超过视口的板块必须能读中间内容，不能强迫跳过。
    await page.locator('#home-notices').evaluate(el => { el.style.minHeight = '1800px'; });
    await page.evaluate(() => scrollTo(0, document.getElementById('home-notices').offsetTop + 300));
    await page.waitForTimeout(1000);
    record('超高板块允许停留在内部阅读位置', await page.evaluate(() => scrollY - document.getElementById('home-notices').offsetTop > 200));
    await home();
    await page.locator('[data-pause]').click();
    await page.locator('[data-dot]').nth(2).click();
    await settled();
    await page.screenshot({ path: 'frontend/qa/carousel-desktop.png' });

    for (const teacher of ['zhang-jinlong', 'zheng-haiwu', 'cheng-gang']) {
      await page.goto('http://127.0.0.1:8765/teacher-' + teacher + '.html');
      record(teacher + '已有简介、研究教学与来源资料', await page.locator('.profile-section').count() >= 4 && await page.locator('.profile-source a').count() === 1 && await page.locator('.teacher-profile img').evaluate(el => el.complete && el.naturalWidth > 0));
    }
    await page.screenshot({ path: 'frontend/qa/teacher-profile.png' });
    await page.goto('http://127.0.0.1:8765/site-map.html');
    record('网站导航列出九个一级入口', await page.locator('.site-map-grid > section').count() === 9);

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
    await mobileContext.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:8765' ? route.continue() : route.abort());
    const mobile = await mobileContext.newPage();
    mobile.on('pageerror', e => errors.push(e.message));
    await mobile.goto('http://127.0.0.1:8765/');
    await mobile.locator('[data-pause]').click();
    record('触屏保持自然滚动，箭头常显', await mobile.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType === 'none') && await mobile.locator('[data-next]').evaluate(el => getComputedStyle(el).opacity === '1'));
    await mobile.locator('[data-next]').click();
    await mobile.locator('[data-transition="idle"]').waitFor();
    await mobile.screenshot({ path: 'frontend/qa/carousel-mobile.png' });
    await mobile.locator('.nav-toggle').click();
    await mobile.locator('.subnav-toggle[aria-controls="subnav-4"]').click();
    record('手机点击师资展开按钮显示子栏目', await mobile.locator('#subnav-4').isVisible());
    await mobile.screenshot({ path: 'frontend/qa/navigation-mobile.png' });
    await mobile.locator('#subnav-4 a[href="teacher-zhang-jinlong.html"]').click();
    await mobile.waitForURL('**/teacher-zhang-jinlong.html');
    record('手机子菜单链接进入教师详情', await mobile.locator('.teacher-profile').isVisible());
    for (const width of [320, 390, 768]) {
      await mobile.setViewportSize({ width, height: 844 });
      record(width + 'px教师详情无横向溢出', await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await mobile.goto('http://127.0.0.1:8765/');
      record(width + 'px首页无横向溢出', await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await mobileContext.close();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await home();
    record('减少动态效果停用吸附和呼吸，正文可见', await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType === 'none') && await page.locator('.hero-image').first().evaluate(el => getComputedStyle(el).animationName === 'none') && await page.locator('#home-notices > .container').evaluate(el => getComputedStyle(el).opacity === '1'));
    await page.locator('#site-footer').scrollIntoViewIfNeeded();
    record('页脚保留校训、学院标识、公众号与备案', await page.locator('.footer-motto').count() === 1 && await page.locator('.wechat-panel').count() === 1 && await page.locator('.footer-support').getAttribute('href') === 'https://hdwzgzs.cn/' && await page.locator('.footer-filing').count() === 1 && await page.locator('.footer-brand img').evaluate(el => el.complete && el.naturalWidth > 0));
    await page.screenshot({ path: 'frontend/qa/footer.png' });
    record('本轮页面无JavaScript运行错误', errors.length === 0);
    fs.writeFileSync('frontend/qa/navigation-scroll-check.json', JSON.stringify({ date: new Date().toISOString(), scope: '呼吸、下拉菜单、侧边箭头、桌面滚动吸附、教师资料、页脚和触屏模拟；非手机真机验收', checks, errors }, null, 2) + '\n');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

