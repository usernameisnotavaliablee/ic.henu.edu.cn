// 历史设计检查：依赖已删除的暂停按钮；2026-10-12新版请用check-current-design.cjs。
// 交互回归：现有 Playwright + Edge，仅访问本地预览，不安装依赖。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.IC_TEST_MODULES, 'playwright'));
const output = path.resolve(__dirname, '../qa');
const checks = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); console.log('PASS ' + name); };

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await context.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:8765' ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const active = () => page.locator('[data-carousel]').getAttribute('data-active-slide').then(Number);
    const state = () => page.locator('[data-carousel]').getAttribute('data-carousel-state');
    const settled = () => page.locator('[data-carousel][data-transition="idle"]').waitFor();
    const load = async () => {
      await page.goto('http://127.0.0.1:8765/', { waitUntil: 'load' });
      await page.locator('[data-carousel][data-carousel-state]').waitFor();
    };
    await load();
    const total = await page.locator('[data-slide]').count();
    check('默认自动播放，全部轮播图加载完成', await state() === 'playing' && await active() === 0 && total === require('../src/data/site').slides.length && await page.locator('.hero-image').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
    await page.locator('[data-carousel]').hover();
    const started = Date.now();
    await page.waitForFunction(() => document.querySelector('[data-carousel]').dataset.activeSlide === '1', null, { timeout: 4200 });
    check('鼠标悬停仍在约3秒时自动切换', Date.now() - started >= 2200 && Date.now() - started < 4000);
    check('自动播放触发向左滑动', await page.locator('[data-carousel]').getAttribute('data-transition') === 'next');
    for (const expected of [...Array.from({length: total - 2}, (_, i) => i + 2), 0]) {
      await page.waitForFunction(index => Number(document.querySelector('[data-carousel]').dataset.activeSlide) === index, expected, { timeout: 4000 });
    }
    check('全部图片自动循环后回到第一张', await active() === 0);
    await settled();
    await page.locator('[data-pause]').click();
    check('暂停按钮状态一致', await state() === 'paused' && await page.locator('[data-pause]').getAttribute('aria-pressed') === 'true');
    await page.waitForTimeout(3250);
    check('主动暂停超过一个周期不切换', await active() === 0);

    await page.locator('[data-next]').click();
    await page.waitForTimeout(120);
    const transforms = await page.locator('[data-slide]').evaluateAll(slides => [0, 1].map(i => new DOMMatrixReadOnly(getComputedStyle(slides[i]).transform).m41));
    check('下一张动画中旧图左移、新图从右进入', transforms[0] < -1 && transforms[1] > 1);
    await page.screenshot({ path: path.join(output, 'carousel-transition.png') });
    await settled();
    check('切换结束只显示一张，暂停状态保持', await page.locator('[data-slide]:not([hidden])').count() === 1 && await active() === 1 && await state() === 'paused');
    await page.locator('[data-prev]').click();
    await page.waitForTimeout(120);
    check('上一张向右滑动', await page.locator('[data-carousel]').getAttribute('data-transition') === 'previous' && await page.locator('[data-slide]').nth(0).evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41) < 0);
    await settled();
    await page.locator('[data-prev]').click();
    await settled();
    check('第一张上一张循环到末张', await active() === total - 1);
    await page.locator('[data-next]').click();
    await settled();
    check('末张下一张循环到第一张', await active() === 0);
    await page.locator('[data-dot]').nth(2).click();
    await settled();
    check('圆点跳转与序号一致', await active() === 2 && (await page.locator('.carousel-count').innerText()).includes(`03 / ${String(total).padStart(2, '0')}`) && await page.locator('[data-dot]').nth(2).getAttribute('aria-pressed') === 'true');
    for (let i = 0; i < total * 2 - 2; i++) await page.locator('[data-next]').click();
    await settled();
    check('快速连续点击无叠图和遗留动画', await active() === 0 && await page.locator('[data-slide]:not([hidden])').count() === 1 && await page.locator('[data-slide]').evaluateAll(slides => slides.every(slide => slide.getAnimations().length === 0)));
    await page.locator('[data-pause]').click();
    check('恢复播放按钮保留焦点', await page.locator('[data-pause]').evaluate(el => el === document.activeElement));
    await page.waitForTimeout(3250);
    check('按钮保留焦点仍继续自动播放', await active() === 1);
    await settled();
    await page.locator('[data-pause]').click();

    // 验证滚动阈值和中间帧，不能只用最终截图判断动效。
    const notices = page.locator('#home-notices');
    check('下方板块进入阈值之前保持未显现', !(await notices.getAttribute('class')).includes('has-entered') && Number(await notices.locator(':scope > .container').evaluate(el => getComputedStyle(el).opacity)) === 0);
    const top = await notices.evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate(y => scrollTo(0, y - innerHeight + 40), top);
    await page.waitForTimeout(100);
    check('只露出下方40像素还不触发浮现', !(await notices.getAttribute('class')).includes('has-entered'));
    await page.evaluate(y => scrollTo(0, y - innerHeight * .5), top);
    await page.waitForFunction(() => document.querySelector('#home-notices').classList.contains('has-entered'));
    await page.waitForTimeout(120);
    const reveal = await notices.locator(':scope > .container').evaluate(el => {
      const style = getComputedStyle(el); const matrix = new DOMMatrixReadOnly(style.transform);
      return { opacity: Number(style.opacity), y: matrix.m42, scale: matrix.m11 };
    });
    check('整块浮现中有渐显、上移与放大', reveal.opacity > 0 && reveal.opacity < 1 && reveal.y > 0 && reveal.scale < 1);
    await page.screenshot({ path: path.join(output, 'section-reveal.png') });
    await page.waitForTimeout(1800);
    check('浮现结束文字完全可见', Number(await notices.locator(':scope > .container').evaluate(el => getComputedStyle(el).opacity)) === 1);
    await notices.locator('.editorial-heading > a').hover();
    await page.waitForTimeout(320);
    check('可点击文字悬停有放大和下划线', await notices.locator('.editorial-heading > a').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m11 > 1 && getComputedStyle(el).textDecorationLine.includes('underline')));
    for (const id of ['home-news', 'home-research', 'home-education', 'home-faculty']) {
      await page.locator('#' + id).scrollIntoViewIfNeeded();
      await page.waitForFunction(id => document.getElementById(id).classList.contains('has-entered'), id);
    }
    check('五个首页板块均已触发浮现', await page.locator('[data-home-section].has-entered').count() === 5);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await load();
    check('减少动态效果默认暂停，所有正文直接可见', await state() === 'paused' && await page.locator('[data-home-section] > .container').evaluateAll(nodes => nodes.every(el => getComputedStyle(el).opacity === '1')));
    await page.locator('[data-next]').click();
    check('减少动态效果时切图不横向移动', await active() === 1 && await page.locator('[data-carousel]').getAttribute('data-transition') === 'idle');
    await page.locator('[data-pause]').click();
    await page.waitForTimeout(3250);
    check('减少动态效果仍能主动开启自动换图', await active() === 2);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await load();
      await page.locator('[data-pause]').click();
      check(width + 'px无横向溢出，轮播按钮可见', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth) && await page.locator('[data-next]').isVisible() && await page.locator('[data-pause]').isVisible());
      if (width === 390) {
        await page.locator('[data-next]').click();
        await settled();
        check('手机手动滑动切图可用', await active() === 1);
        await page.locator('[data-pause]').click();
        await page.waitForTimeout(3250);
        check('手机操作后继续自动轮播', await active() === 2);
        await settled();
        await page.locator('[data-pause]').click();
        await page.screenshot({ path: path.join(output, 'carousel-mobile.png') });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await load();
    await page.locator('[data-pause]').click();
    await page.locator('[data-dot]').nth(2).click();
    await settled();
    await page.screenshot({ path: path.join(output, 'carousel-desktop.png') });
    await page.locator('[data-motion-toggle]').click();
    check('暂停动效后未进入视口的内容也能直接查看', await page.locator('#home-faculty > .container').evaluate(el => getComputedStyle(el).opacity === '1'));
    await context.setOffline(true);
    await page.locator('[data-next]').click();
    check('图片和交互均为本地资源，离线仍可切换', await active() === 3);
    await context.setOffline(false);
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await noJS.newPage();
    await fallback.goto('http://127.0.0.1:8765/');
    check('无JavaScript时正文不被隐藏', await fallback.locator('[data-home-section] > .container').evaluateAll(nodes => nodes.every(el => getComputedStyle(el).opacity === '1')));
    await noJS.close();
    check('页面无JavaScript运行错误', errors.length === 0);
    fs.writeFileSync(path.join(output, 'carousel-check.json'), JSON.stringify({ date: new Date().toISOString(), scope: '3秒轮播、横向滑动、滚动浮现及链接反馈；未模拟页面后台切换，未做手机真机验收', browser: 'Existing Microsoft Edge, isolated headless context', checks, errors }, null, 2) + '\n');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

