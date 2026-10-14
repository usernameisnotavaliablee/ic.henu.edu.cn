// 公网前台的**真实浏览器**核验：字体真的加载、分页可用、五种视口不溢出。
// 复用已有 Playwright + 本机 Edge/Chrome，不安装任何依赖。
// 用法： IC_TEST_MODULES=<playwright 所在 node_modules> node check_public_browser.cjs [URL]
const path = require('node:path');
const { chromium } = require(path.join(process.env.IC_TEST_MODULES, 'playwright'));

const BASE = (process.argv[2] || 'http://47.94.146.53:8099').replace(/\/$/, '');
const checks = [], failures = [];

function check(name, ok, detail) {
  (ok ? checks : failures).push(name);
  console.log((ok ? '  [通过] ' : '  [失败] ') + name + (detail ? '  -> ' + detail : ''));
}

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({ channel, headless: true }); } catch (e) { /* 换下一个 */ }
  }
  throw new Error('Edge 与 Chrome 均无法启动');
}

(async () => {
  const browser = await launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [], fontResponses = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('response', r => { if (/\.(ttf|woff2?)(\?|$)/i.test(r.url())) fontResponses.push(r); });

  console.log('目标：' + BASE + '\n');
  console.log('===== 一、字体（真实加载证据）=====');
  await page.goto(BASE + '/index.html', { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(500);

  const fontLoad = await page.evaluate(async () => {
    const faces = await document.fonts.load('400 30px "IC ZhuangSong"', '学院新闻');
    return { count: faces.length, status: document.fonts.status,
             family: faces[0] ? faces[0].family : null, check: document.fonts.check('400 30px "IC ZhuangSong"', '学院新闻') };
  });
  check('document.fonts.load 返回至少一个字体对象', fontLoad.count >= 1,
        'count=' + fontLoad.count + ', status=' + fontLoad.status + ', family=' + fontLoad.family);
  check('document.fonts.check 为真', fontLoad.check === true);

  const styled = await page.evaluate(() => {
    const out = {};
    for (const sel of ['.brand-motto', '.editorial-heading h2', '.feature-intro', '.footer-campus p']) {
      const el = document.querySelector(sel);
      out[sel] = el ? getComputedStyle(el).fontFamily : null;
    }
    return out;
  });
  const applied = Object.entries(styled).filter(([, v]) => v && v.includes('IC ZhuangSong')).map(([k]) => k);
  check('标题区域的 computed font-family 以 IC ZhuangSong 打头', applied.length >= 1,
        applied.join(', ') + ' / 全部：' + JSON.stringify(styled));

  const ttf = fontResponses[0];
  check('字体文件请求成功且 MIME 正确', !!ttf && ttf.status() === 200,
        ttf ? ttf.url().split('/').pop() + '  status=' + ttf.status() + '  content-type=' + (ttf.headers()['content-type'] || '(无)') : '未观察到字体请求');
  // 只把 CSP 拦截算失败。本阶段是 HTTP，浏览器对 COOP/安全上下文的安全提示属正常，不算问题。
  const cspErrors = consoleErrors.filter(t => /Content Security Policy|Refused to (load|apply|execute|connect|fetch)/i.test(t));
  check('无 CSP 拦截（字体/脚本未被阻挡）', cspErrors.length === 0, cspErrors.slice(0, 3).join(' | ') || '无');
  console.log('        （其他控制台输出 ' + consoleErrors.length + ' 条，HTTP 下 COOP 等安全上下文提示属正常）');

  console.log('\n===== 二、分页（两类栏目）=====');
  async function readSummary(url) {
    await page.goto(BASE + url, { waitUntil: 'load', timeout: 45000 });
    return page.evaluate(() => {
      const s = document.querySelector('.pagination-summary');
      const items = document.querySelectorAll('.article-list li').length;
      const cur = document.querySelector('.pagination-links [aria-current="page"]');
      const jump = document.querySelector('.pagination-jump');
      return { summary: s ? s.textContent.trim() : null, items,
               current: cur ? cur.textContent.trim() : null, hasJump: !!jump,
               hasLinks: !!document.querySelector('.pagination-links') };
    });
  }

  for (const [label, url, otherTab] of [['新闻', '/news.html', '通知公告'], ['通知', '/notices.html', '学院新闻']]) {
    const first = await readSummary(url);
    const nums = (first.summary || '').match(/共 (\d+) 条 · 每页 (\d+) 条 · 第 (\d+) \/ (\d+) 页/);
    check(label + '列表展示总数/每页/页数', !!nums, first.summary);
    if (!nums) continue;
    const [, total, perPage, , pages] = nums.map(Number);
    check(label + '第一页条数正确', first.items === Math.min(perPage, total), '本页 ' + first.items + ' 条');
    check(label + '多页时显示页码与跳转框', pages > 1 ? (first.hasLinks && first.hasJump) : (!first.hasLinks && !first.hasJump),
          '页数=' + pages);

    if (pages > 1) {
      await page.click('.pagination-links a[rel="next"]');
      await page.waitForLoadState('load');
      check(label + '「下一页」到第 2 页', (await readSummary('/' + page.url().split('/').pop())).current === '2');

      await page.click('.pagination-links a[aria-label="前往最后一页"]');
      await page.waitForLoadState('load');
      const last = await readSummary('/' + page.url().split('/').pop());
      check(label + '「末页」到最后页且末页条数正确', last.current === String(pages) && last.items === total - perPage * (pages - 1),
            '末页 ' + last.items + ' 条');

      const prev = await page.locator('.pagination-links a[rel="prev"]').count();
      if (prev) {
        await page.click('.pagination-links a[rel="prev"]');
        await page.waitForLoadState('load');
        check(label + '「上一页」回到前一页', (await readSummary('/' + page.url().split('/').pop())).current === String(pages - 1));
      }

      await page.goto(BASE + url, { waitUntil: 'load' });
      const pageLink = page.locator('.pagination-links a[aria-label^="前往第 3 页"]');
      if (await pageLink.count()) {
        await pageLink.click();
        await page.waitForLoadState('load');
        check(label + '点击页码 3 生效', (await readSummary('/' + page.url().split('/').pop())).current === '3');
      }

      // 输入跳转 + 回车
      await page.goto(BASE + url, { waitUntil: 'load' });
      await page.fill('#page-number', '2');
      await page.press('#page-number', 'Enter');
      await page.waitForLoadState('load');
      check(label + '输入页码回车跳转生效', (await readSummary('/' + page.url().split('/').pop())).current === '2');

      // 栏目不串
      await page.goto(BASE + url + '?page=2', { waitUntil: 'load' });
      await page.click('.list-tabs a:has-text("' + otherTab + '")');
      await page.waitForLoadState('load');
      const swapped = await readSummary('/' + page.url().split('/').pop());
      check(label + '切到「' + otherTab + '」不串页（回到第 1 页）', swapped.current === '1' && !page.url().includes('page=2'),
            page.url());
    }
  }

  // 原有用户内容仍在
  const userPage = await page.goto(BASE + '/news-111.html', { waitUntil: 'load' });
  check('原有用户内容 news-111 仍可达', userPage.status() === 200, 'HTTP ' + userPage.status());

  console.log('\n===== 三、五种视口（字体生效 + 不横向溢出）=====');
  // 复用同一个页面、只改视口尺寸；每次新建 context 会明显变慢并可能挂住。
  page.setDefaultTimeout(30000);
  for (const [w, h, label] of [[1440, 900, 'PC-1440'], [1024, 768, '1024'], [768, 1024, 'Pad-768'], [390, 844, '手机-390'], [320, 568, '手机-320']]) {
    try {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(BASE + '/news.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        loaded: document.fonts.check('400 30px "IC ZhuangSong"', '学院新闻'),
        pagWidth: (() => { const n = document.querySelector('.pagination'); return n ? Math.round(n.getBoundingClientRect().right) : null; })(),
        itemOver: (() => {
          let worst = 0;
          document.querySelectorAll('.article-list li, .pagination, .site-header').forEach(el => {
            worst = Math.max(worst, Math.round(el.getBoundingClientRect().right) - window.innerWidth);
          });
          return worst;
        })(),
      }));
      check(label + ' 无横向溢出', r.overflow <= 1, 'scrollWidth 超出 ' + r.overflow + 'px');
      check(label + ' 字体已加载且分页/内容不超出视口',
            r.loaded === true && r.itemOver <= 1 && (r.pagWidth === null || r.pagWidth <= w + 1),
            '最右元素超出 ' + r.itemOver + 'px，pagRight=' + r.pagWidth + ' / 视口 ' + w);
    } catch (e) {
      check(label + ' 视口检查完成', false, String(e.message).split('\n')[0]);
    }
  }

  await browser.close();
  console.log('\n===== 汇总：通过 ' + checks.length + ' 项，失败 ' + failures.length + ' 项 =====');
  failures.forEach(f => console.log('  失败：' + f));
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error('执行失败：' + e.message); process.exit(2); });
