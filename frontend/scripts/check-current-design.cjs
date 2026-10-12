// 本轮浏览器验收入口：需已有 Playwright 和 Edge；不安装依赖，不写业务数据库。
// IC_TEST_MODULES=<已有node_modules> node frontend/scripts/check-current-design.cjs [预览URL]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.IC_TEST_MODULES, 'playwright'));
const base = (process.argv[2] || 'http://127.0.0.1:8765').replace(/\/$/, '');
const output = path.resolve(__dirname, '../qa');
const checks = [], errors = [];
const check = (name, ok) => { assert.ok(ok, name); checks.push(name); console.log('PASS ' + name); };
(async () => {
  const browser = await chromium.launch({ channel: process.env.IC_BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/index.html');
    check('原有九个导航均保留，师生园地归人才培养', await page.locator('.main-nav > ul > li > .nav-item-heading > a').allTextContents().then(labels => ['首页', '学院概况', '科学与创新', '人才培养', '师资队伍', '新闻通知', '公共服务', '人才招聘', '联系我们'].every(s => labels.includes(s))));
    check('删除两类暂停按钮', await page.locator('[data-pause], [data-motion-toggle]').count() === 0);
    check('开源楷体实际加载', await page.evaluate(async () => (await document.fonts.load('400 30px "IC WenKai"', '学院新闻')).length > 0));
    check('程老师首位', await page.locator('.faculty-card h3').first().textContent() === '程纲');
    check('技术支持链接正确', await page.getByRole('link', { name: '技术支持：河南大学网站工作室' }).getAttribute('href') === 'http://wz.henu.edu.cn/');
    const education = page.locator('.main-nav > ul > .nav-item').filter({ has: page.locator(':scope > .nav-item-heading > a[href="talent-cultivation.html"]') });
    await education.locator(':scope > .nav-item-heading > a').hover();
    const admissions = education.locator('.nav-item').filter({ has: page.locator(':scope > .nav-item-heading > a[href="admissions.html"]') });
    await admissions.locator(':scope > .nav-item-heading > a').hover();
    await admissions.getByRole('link', { name: '研究生招生', exact: true }).waitFor({ state: 'visible' });
    check('三级招生菜单展开且父菜单保留', await admissions.getByRole('link', { name: '研究生招生', exact: true }).isVisible());
    await admissions.locator(':scope > .nav-item-heading > .subnav-toggle').press('Escape');
    await admissions.getByRole('link', { name: '研究生招生', exact: true }).waitFor({ state: 'hidden' });
    check('Escape逐级关闭，父菜单仍可见', !await admissions.getByRole('link', { name: '研究生招生', exact: true }).isVisible() && await education.getByRole('link', { name: '招生就业', exact: true }).isVisible());
    await page.evaluate(() => { document.activeElement.blur(); scrollTo(0, 650); });
    await page.waitForTimeout(800);
    const header = await page.locator('.site-header').evaluate(el => {
      const uni = el.querySelector('.university-name').getBoundingClientRect();
      const college = el.querySelector('.college-name').getBoundingClientRect();
      return { height: el.offsetHeight, visible: el.querySelector('.brand-mark').getBoundingClientRect().height > 0, sameLine: Math.abs(uni.top - college.top) < 8, ink: getComputedStyle(el.querySelector('.college-name')).color, band: getComputedStyle(el.querySelector('.navigation-band')).backgroundColor, bg: getComputedStyle(el).backgroundColor };
    });
    check('收缩页头不超过94px、校徽保留、校名院名同行', header.height <= 94 && header.visible && header.sameLine);
    check('白字与双色蓝背景', header.ink === 'rgb(255, 255, 255)' && header.band !== header.bg);
    await page.screenshot({ path: path.join(output, 'current-compact.png') });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const file of ['index.html', 'faculty.html', 'research-platforms.html', 'research-groups.html', 'talent-cultivation.html', 'site-map.html']) {
        await page.goto(base + '/' + file);
        check(`${width}px ${file}无横向溢出`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
      await page.goto(base + '/index.html');
      await page.evaluate(() => scrollTo(0, 500));
      await page.waitForTimeout(800);
      check(`${width}px收缩标识完整可见`, await page.locator('.college-name').evaluate(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth && r.top >= 0; }));
      if (width < 960) {
        await page.locator('.nav-toggle').click();
        await education.locator(':scope > .nav-item-heading > .subnav-toggle').click();
        await admissions.locator(':scope > .nav-item-heading > .subnav-toggle').click();
        check(`${width}px移动端三级菜单可访问`, await admissions.getByRole('link', { name: '研究生招生', exact: true }).isVisible());
      }
      await page.screenshot({ path: path.join(output, `current-${width}.png`) });
    }
    await page.goto(base + '/teacher-cheng-gang.html');
    check('教师详情恢复完整资料', await page.locator('.profile-section').allTextContents().then(t => t.join(' ').includes('更多代表论文')));
    check('教师面包屑有师资父级', await page.locator('.breadcrumb').getByRole('link', { name: '师资队伍', exact: true }).count() === 1);
    // 暂挂一个真实图片请求，检查等待期间的反馈与恢复；不依赖外网测速。
    const slow = await context.newPage();
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await slow.route('**/assets/campus-gate.jpg', async route => { await held; await route.continue(); });
    await slow.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await slow.locator('[data-dot]').nth(1).click();
    const slide = slow.locator('[data-slide]').nth(1);
    check('弱网时有图片反馈，手动换图仍可用', await slide.locator('[data-media-status]').isVisible() && await slow.locator('[data-next]').isEnabled());
    await slow.screenshot({ path: path.join(output, 'current-slow-media.png') });
    release();
    await slide.locator('[data-media-status]').waitFor({ state: 'hidden' });
    check('图片完成后反馈消失', await slide.getAttribute('data-media-state') === 'ready');
    await slow.close();
    const broken = await context.newPage();
    await broken.route('**/assets/campus-gate.jpg', route => route.abort());
    await broken.goto(base + '/index.html');
    await broken.locator('[data-dot]').nth(1).click();
    check('图片失败后提示重试，正文不被阻塞', await broken.locator('[data-slide]').nth(1).getAttribute('data-media-state') === 'error');
    await broken.close();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(base + '/index.html');
    // 在同一浏览器调用内采样并反向，避免截图/跨进程往返耗时让动画提前结束。
    const samples = await page.evaluate(async () => {
      const el = document.querySelector('.header-main');
      const measure = () => ({ height: el.getBoundingClientRect().height, size: parseFloat(getComputedStyle(el.querySelector('.college-name')).fontSize) });
      const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
      const delay = async ms => { const start = performance.now(); while (performance.now() - start < ms) await frame(); };
      scrollTo(0, 0);
      await frame();
      while (document.querySelector('.site-header').dataset.headerAnimation !== 'idle') await frame();
      const expanded = measure();
      scrollTo(0, 650);
      await delay(180);
      const early = measure();
      await delay(300);
      const middle = measure();
      scrollTo(0, 0);
      await delay(150);
      return { expanded, early, middle, reverse: measure() };
    });
    const { expanded, early, middle, reverse } = samples;
    check('页头实际高度与字号都有连续中间帧', early.height < expanded.height && early.height > middle.height && middle.height > 46 && early.size > middle.size && middle.size > 20);
    check('动画中反向滚动从中间状态返回', reverse.height > middle.height && reverse.height < expanded.height);
    fs.writeFileSync(path.join(output, 'current-header-frame-samples.json'), JSON.stringify(samples, null, 2) + '\n');
    await page.waitForFunction(() => document.querySelector('.site-header').dataset.headerAnimation === 'idle');
    await page.goto(base + '/index.html');
    await page.waitForFunction(() => document.querySelector('[data-carousel]').dataset.activeSlide === '1', null, { timeout: 5000 });
    check('移除暂停按钮后仍自动换图', await page.locator('[data-carousel]').getAttribute('data-active-slide') === '1');
    check('无页面脚本错误', errors.length === 0);
    fs.writeFileSync(path.join(output, 'current-design-browser.json'), JSON.stringify({ base, checks, errors, count: checks.length }, null, 2) + '\n');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
