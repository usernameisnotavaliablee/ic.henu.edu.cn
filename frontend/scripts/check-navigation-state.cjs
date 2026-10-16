// 用户操作回归；可检查静态预览，也可传入动态站点根URL。无需访问业务库。
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.IC_TEST_MODULES, 'playwright'));
const base = process.argv[2] || pathToFileURL(path.resolve(__dirname, '../preview/')).href;
const output = path.resolve(process.env.IC_TEST_OUTPUT || 'sandbox/navigation-regression');
const report = { base, scope: 'Edge simulated viewports; no physical device or production acceptance', checks: [], errors: [] };
fs.mkdirSync(output, { recursive: true });
const itemSelector = '.main-nav > ul > .nav-item:nth-child(2)';
const buttonSelector = `${itemSelector} > .nav-item-heading > .subnav-toggle`;
const menuSelector = `${itemSelector} > .subnav`;

(async () => {
  const browser = await chromium.launch({ channel: process.env.IC_BROWSER_CHANNEL || 'msedge', headless: true });
  report.browser = browser.version();
  const test = async (name, run, width = 390) => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
    page.setDefaultTimeout(6000);
    page.on('pageerror', e => report.errors.push({ name, message: e.message }));
    try {
      await page.goto(new URL('index.html', base.endsWith('/') ? base : base + '/').href);
      await page.locator('.main-nav.is-enhanced').waitFor({ state: 'attached' });
      await run(page);
      report.checks.push({ name, passed: true });
      console.log('PASS ' + name);
    } catch (error) {
      report.checks.push({ name, passed: false, error: error.message });
      await page.screenshot({ path: path.join(output, `failure-${report.checks.length}.png`) });
      console.error('FAIL ' + name + ': ' + error.message);
    } finally { await page.close(); }
  };
  const open = async page => {
    await page.locator('.nav-toggle').click();
    await page.locator(buttonSelector).click();
    await visibleText(page);
  };
  const visibleText = async page => {
    await page.waitForFunction(selector => {
      const menu = document.querySelector(selector);
      const chars = [...menu.querySelectorAll('.nav-flip-char')];
      return menu.getBoundingClientRect().height > 0 && !menu.inert && chars.length && chars.every(c => Number(getComputedStyle(c).opacity) === 1 && !c.getAnimations().some(a => a.playState === 'running'));
    }, menuSelector);
    assert.equal(await page.locator(buttonSelector).getAttribute('aria-expanded'), 'true');
  };
  try {
    await test('收起30ms后再点可重新展开，过期回调不关闭新状态', async page => {
      await open(page);
      await page.locator(buttonSelector).evaluate(async button => {
        button.click(); await new Promise(r => setTimeout(r, 30)); button.click();
      });
      await visibleText(page);
      await page.waitForTimeout(600); // 跨过旧实现关闭定时器的期限。
      await visibleText(page);
    });
    await test('收起完成后切换减少动态效果，重开文字可见', async page => {
      await open(page);
      await page.locator(buttonSelector).click();
      await page.locator(menuSelector).waitFor({ state: 'hidden' });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator(buttonSelector).click();
      await visibleText(page);
    });
    await test('退场过程中切换减少动态效果可完成关闭并重开', async page => {
      await open(page);
      await page.locator(buttonSelector).click();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator(menuSelector).waitFor({ state: 'hidden' });
      await page.locator(buttonSelector).click();
      await visibleText(page);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await visibleText(page);
    });
    await test('关闭主菜单同时重置子菜单，重开不残留展开状态', async page => {
      await open(page);
      await page.locator('.nav-toggle').click();
      assert.equal(await page.locator(buttonSelector).getAttribute('aria-expanded'), 'false');
      await page.locator('.nav-toggle').click();
      await page.locator(menuSelector).waitFor({ state: 'hidden' });
      await page.locator(buttonSelector).click();
      await visibleText(page);
    });
    await test('三级菜单Escape逐级返回，最后返回汉堡按钮', async page => {
      await page.locator('.nav-toggle').click();
      const education = page.locator('.nav-item').filter({ has: page.locator(':scope > .nav-item-heading > a[href$="talent-cultivation.html"]') });
      const admission = education.locator('.nav-item').filter({ has: page.locator(':scope > .nav-item-heading > a[href$="community.html"]') });
      const parentButton = education.locator(':scope > .nav-item-heading > button');
      const childButton = admission.locator(':scope > .nav-item-heading > button');
      await parentButton.click();
      await childButton.press('ArrowDown');
      await page.keyboard.press('Escape');
      assert(await childButton.evaluate(e => e === document.activeElement));
      assert.equal(await parentButton.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert(await parentButton.evaluate(e => e === document.activeElement));
      assert.equal(await parentButton.getAttribute('aria-expanded'), 'false');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
      assert(await page.locator('.nav-toggle').evaluate(e => e === document.activeElement));
    });
    await test('窄屏与桌面切换清理退场状态，桌面文字可见', async page => {
      await open(page);
      await page.locator(buttonSelector).click();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.locator(`${itemSelector} > .nav-item-heading > a`).hover();
      await visibleText(page);
      await page.locator(`${menuSelector} a`).first().focus();
      await page.setViewportSize({ width: 390, height: 900 });
      await page.waitForFunction(() => document.activeElement === document.querySelector('.nav-toggle'));
      assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
      await page.locator('.nav-toggle').click();
      await page.locator(buttonSelector).click();
      await visibleText(page);
    });
    await test('键盘打开桌面菜单并逐级关闭', async page => {
      const button = page.locator(buttonSelector);
      await button.focus();
      await button.press('ArrowDown');
      assert(await page.locator(`${menuSelector} a`).first().evaluate(e => e === document.activeElement));
      await page.keyboard.press('Escape');
      assert(await button.evaluate(e => e === document.activeElement));
      assert.equal(await button.getAttribute('aria-expanded'), 'false');
    }, 1440);
    await test('退场确有中间帧，动画结束后不可聚焦', async page => {
      await open(page);
      const sample = await page.locator(buttonSelector).evaluate(async button => {
        button.click();
        await new Promise(r => setTimeout(r, 80));
        const menu = button.closest('.nav-item').querySelector(':scope > .subnav');
        return { inert: menu.inert, height: menu.getBoundingClientRect().height, opacities: [...menu.querySelectorAll('.nav-flip-char')].map(e => Number(getComputedStyle(e).opacity)) };
      });
      assert(sample.inert && sample.height > 0 && sample.opacities.some(v => v > 0 && v < 1), JSON.stringify(sample));
      await page.locator(menuSelector).waitFor({ state: 'hidden' });
      await page.locator(`${menuSelector} a`).first().evaluate(e => e.focus());
      assert(!(await page.locator(menuSelector).evaluate(e => e.contains(document.activeElement))));
    });
    await test('不支持Web Animations时菜单和工作室链接仍可使用', async page => {
      await page.evaluate(() => { Element.prototype.animate = undefined; });
      await open(page);
      await page.locator(buttonSelector).click();
      await page.locator(menuSelector).waitFor({ state: 'hidden' });
      assert(await page.locator('.footer-support').isVisible());
      assert.equal(await page.locator('.footer-support').getAttribute('href'), 'https://hdwzgzs.cn/');
    });
    await test('320px及768px菜单无溢出、可开关', async page => {
      for (const width of [320, 768]) {
        await page.setViewportSize({ width, height: 900 });
        await open(page);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.locator('.nav-toggle').click();
      }
    });
    await test('保留队友紧凑页脚，切换动态效果不改写页脚文字', async page => {
      const footer = page.locator('.site-footer');
      const before = await footer.innerHTML();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      assert.equal(await footer.locator('.footer-drawer, [data-back-top], .nav-flip-char').count(), 0);
      assert(await footer.locator('.footer-motto').isVisible());
      assert.equal(await footer.locator('.wechat-placeholder').count(),1);
      assert.equal(await footer.locator('.website-code').count(),0);
      assert(await footer.locator('.footer-row .footer-wechat').isVisible());
      assert.equal(await footer.innerHTML(), before);
    });
    await test('导航脚本不可用时各级链接仍可访问', async page => {
      await page.route('**/js/navigation.js*', route => route.abort());
      // 同时屏蔽旧版main，避免旧基线的内嵌导航增强影响降级验证。
      await page.route('**/js/main.js*', route => route.abort());
      await page.reload();
      assert.equal(await page.locator('.main-nav.is-enhanced').count(), 0);
      assert(await page.getByRole('link', { name: '研究生招生', exact: true }).isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    });
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'navigation-state.json'), JSON.stringify(report, null, 2) + '\n');
  }
  if (report.errors.length || report.checks.some(c => !c.passed)) process.exitCode = 1;
  console.log(`${report.checks.filter(c => c.passed).length}/${report.checks.length} passed; ${report.errors.length} page errors; ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
