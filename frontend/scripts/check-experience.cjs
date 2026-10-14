// 历史设计检查：依赖已删除的暂停按钮；2026-10-12新版请用check-current-design.cjs。
// 本地真实浏览器交互回归；使用已有 Playwright / Edge，不安装依赖。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.IC_TEST_MODULES, 'playwright'));
const output = path.resolve(__dirname, '../qa');
const origin = 'http://127.0.0.1:8765';
const checks = [], errors = [];
const check = (name, result) => { assert.ok(result, name); checks.push(name); console.log('PASS ' + name); };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const home = async () => { await page.goto(origin); await page.locator('[data-active-slide]').waitFor(); };
    const waitScroll = async () => { await page.waitForTimeout(500); await page.waitForFunction(() => document.documentElement.dataset.scrollState !== 'settling'); };
    const sectionPosition = selector => page.locator(selector).evaluate(el => el.getBoundingClientRect().top);
    await home();
    check('首页首屏保留完整标识和导航、删除顶部学校官网入口', await page.locator('.site-header').evaluate(el => el.offsetHeight === 184 && !el.querySelector('a[href="https://www.henu.edu.cn/"]')));
    await page.mouse.move(5, 5);
    await page.waitForTimeout(600);
    check('轮播两侧点击区与图等高、离开时淡化且使用线条图标', await page.locator('[data-next]').evaluate(el => el.offsetHeight === el.closest('.hero').offsetHeight && Number(getComputedStyle(el).opacity) <= .15 && !!el.querySelector('svg')));
    await page.locator('.hero').hover();
    await page.waitForTimeout(650);
    check('悬停柔和显示两侧控件', await page.locator('[data-next]').evaluate(el => Number(getComputedStyle(el).opacity) >= .6));
    await page.locator('[data-pause]').click();
    await page.locator('[data-next]').click();
    await page.locator('[data-transition="idle"]').waitFor();
    check('通高按钮可切图', await page.locator('.hero').getAttribute('data-active-slide') === '1');
    const image = page.locator('[data-slide]').nth(1).locator('img');
    const scale1 = await image.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11);
    await page.waitForTimeout(900);
    const scale2 = await image.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11);
    check('轮播照片缓慢呼吸，幅度不超过4.5%', scale2 !== scale1 && scale2 >= 1 && scale2 < 1.046);
    await page.locator('[data-motion-toggle]').click();
    const pausedScale = await image.evaluate(el => getComputedStyle(el).transform);
    await page.waitForTimeout(200);
    check('暂停动效冻结呼吸', pausedScale === await image.evaluate(el => getComputedStyle(el).transform));
    await page.locator('[data-motion-toggle]').click();
    await page.screenshot({ path: path.join(output, 'experience-hero.png') });
    const item = page.locator('.nav-item').filter({ has: page.locator('.nav-item-heading > a[href="faculty.html"]') });
    await item.locator('.nav-item-heading > a').hover();
    await page.waitForTimeout(110);
    const menuOpacity = await item.locator('.subnav').evaluate(el => Number(getComputedStyle(el).opacity));
    check('下拉菜单以渐显过渡展开，无三角装饰', menuOpacity > 0 && menuOpacity < 1 && await item.locator('.subnav').evaluate(el => getComputedStyle(el, '::before').content === 'none'));
    await page.waitForTimeout(550);
    check('桌面隐藏展开符号，子栏目可点击', await item.locator('.subnav-toggle').evaluate(el => el.offsetWidth === 0) && await item.locator('.subnav').evaluate(el => !el.inert));
    await page.screenshot({ path: path.join(output, 'experience-dropdown.png') });
    await item.locator('.subnav-toggle').focus();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    check('Escape关闭菜单并保留键盘焦点', await item.locator('.subnav').evaluate(el => el.inert && getComputedStyle(el).visibility === 'hidden'));
    await page.locator('.brand').focus();
    await page.mouse.move(1350, 700);
    await page.mouse.wheel(0, 180);
    await page.waitForTimeout(600);
    const mid = await page.evaluate(() => ({ y: scrollY, state: document.documentElement.dataset.scrollState }));
    check('慢滚结束后仍在柔和移动，未瞬间跳页', mid.state === 'settling' && mid.y > 180 && mid.y < 888);
    await waitScroll();
    check('小幅滚动自动对齐新闻板块并避开固定导航', Math.abs(await sectionPosition('#home-news') - 112) < 3);
    check('滚动后导航变矮且保持顶部，版面不因收缩跳动', await page.locator('.site-header').evaluate(el => el.offsetHeight === 112 && el.getBoundingClientRect().top === 0) && await page.locator('.header-shell').evaluate(el => el.offsetHeight === 184));
    await page.waitForTimeout(1700);
    check('浮现后内容完整可见', await page.locator('#home-news > .container').evaluate(el => getComputedStyle(el).opacity === '1'));
    await page.screenshot({ path: path.join(output, 'experience-compact.png') });
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(450);
    await page.mouse.wheel(0, -120);
    await waitScroll();
    check('反向滚轮即时取消原吸附，不被锁住', Math.abs(await sectionPosition('#home-news') - 112) < 3);
    await home();
    await page.mouse.move(1350, 650);
    for (let i = 0; i < 7; i++) { await page.mouse.wheel(0, 1100); await page.waitForTimeout(45); }
    await waitScroll();
    check('快速连续滚动可以跨过所有板块直达页脚', await page.evaluate(() => scrollY > document.querySelector('#home-faculty').offsetTop && Math.abs(scrollY - (document.documentElement.scrollHeight - innerHeight)) < 4));
    await page.screenshot({ path: path.join(output, 'experience-footer.png') });
    await page.locator('#home-education').evaluate(el => scrollTo(0, el.offsetTop));
    await page.reload();
    await page.waitForTimeout(300);
    check('无锚点首页刷新回到首屏', await page.evaluate(() => scrollY === 0));
    await page.goto(origin + '/#home-education');
    await page.waitForTimeout(800);
    check('带锚点直达仍保留人才培养位置', Math.abs(await sectionPosition('#home-education') - 130) < 4);
    await page.locator('#home-notices').evaluate(el => { el.style.minHeight = '1900px'; scrollTo(0, el.offsetTop + 200); });
    await page.mouse.move(1350, 650);
    await page.mouse.wheel(0, 130);
    await waitScroll();
    check('长板块允许停在中间阅读，不跳过正文', await page.locator('#home-notices').evaluate(el => scrollY > el.offsetTop + 200 && scrollY < el.offsetTop + 500));
    await page.goto(origin + '/news.html');
    check('内页直接使用精简导航', await page.locator('.site-header').evaluate(el => el.offsetHeight === 112));
    for (const teacher of ['zhang-jinlong', 'zheng-haiwu', 'cheng-gang']) {
      await page.goto(origin + '/teacher-' + teacher + '.html');
      check(teacher + '展示真实照片、简历、科研教学与来源', await page.locator('.profile-section').count() >= 4 && await page.locator('.profile-source a').count() === 1 && await page.locator('.teacher-profile img').evaluate(el => el.naturalWidth > 0));
    }
    await page.screenshot({ path: path.join(output, 'experience-teacher.png'), fullPage: true });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await home();
      check(width + 'px首页无横向溢出', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (width === 390) {
        await page.locator('[data-pause]').click();
        await page.screenshot({ path: path.join(output, 'experience-mobile.png') });
        await page.locator('.nav-toggle').click();
        await page.locator('[aria-controls="subnav-4"]').click();
        check('手机展开子栏目并能访问教师详情', await page.locator('#subnav-4').isVisible());
        await page.locator('#subnav-4 a[href="teacher-zhang-jinlong.html"]').click();
        await page.waitForURL('**/teacher-zhang-jinlong.html');
        check('手机教师详情无横向溢出', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await home();
    check('减少动态效果时正文直接可读、呼吸关闭', await page.locator('#home-faculty > .container').evaluate(el => getComputedStyle(el).opacity === '1') && await page.locator('.hero-image').first().evaluate(el => getComputedStyle(el).animationName === 'none'));
    await page.mouse.move(1350, 650);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1800);
    check('减少动态效果时不做强制吸附', await page.evaluate(() => scrollY > 190 && scrollY < 210));
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await nojs.newPage();
    await fallback.goto(origin);
    check('无JavaScript正文可见、导航仍可用', await fallback.locator('[data-home-section] > .container').evaluateAll(nodes => nodes.every(el => getComputedStyle(el).opacity === '1')));
    await nojs.close();
    check('交互页面无JavaScript异常', errors.length === 0);
  } finally {
    fs.writeFileSync(path.join(output, 'experience-check.json'), JSON.stringify({ date: '2026-10-12', scope: '现有Edge桌面及尺寸模拟；未做手机真机或学校发布验收', checks, errors }, null, 2) + '\n');
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
