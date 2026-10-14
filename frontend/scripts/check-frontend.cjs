// 当前前端验收入口。使用已有Python/Playwright/Edge，不安装依赖，不启动业务库。
// IC_TEST_MODULES 指向已有node_modules；IC_PYTHON 可指定项目隔离Python。
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const preview = path.join(root, 'frontend/preview');
const output = path.resolve(process.env.IC_TEST_OUTPUT || path.join(root, 'sandbox/frontend-checks'));
const python = process.env.IC_PYTHON || path.join(root, process.platform === 'win32' ? 'sandbox/.venv/Scripts/python.exe' : 'sandbox/.venv/bin/python');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png' };
const results = [];
fs.mkdirSync(output, { recursive: true });
const run = (command, args) => new Promise(resolve => {
  const started = Date.now();
  const child = spawn(command, args, { cwd: root, env: { ...process.env, PYTHONUTF8: '1', IC_TEST_OUTPUT: output }, stdio: 'inherit', windowsHide: true });
  child.on('error', error => { results.push({ command: [command, ...args], passed: false, error: error.message }); resolve(false); });
  child.on('exit', code => { results.push({ command: [command, ...args], passed: code === 0, code, durationMs: Date.now() - started }); resolve(code === 0); });
});
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(preview, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(preview + path.sep)) { response.writeHead(403).end(); return; }
    const body = await fs.promises.readFile(file);
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch { response.writeHead(404).end(); }
});
(async () => {
  let sourceCommit = null;
  try { sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch {}
  try {
    if (!await run(process.execPath, ['frontend/scripts/build-site.js'])) return;
    for (const args of [
      ['frontend/scripts/check-preview.py'], ['frontend/scripts/check-current-structure.py'], ['frontend/scripts/prepare-fonts.py', '--check'],
    ]) await run(python, args);
    for (const script of ['check-refactor-baseline.cjs', 'check-header-motion.cjs', 'check-media-loading.cjs', 'check-page-transition.cjs']) {
      await run(process.execPath, ['frontend/scripts/' + script]);
    }
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const script of ['check-navigation-state.cjs', 'check-nav-toggle.cjs', 'check-current-design.cjs', 'check-navigation-fixes.cjs', 'check-overview-typography.cjs']) {
      await run(process.execPath, ['frontend/scripts/' + script, base]);
    }
  } finally {
    await new Promise(resolve => server.listening ? server.close(resolve) : resolve());
    const passed = results.length > 0 && results.every(result => result.passed);
    fs.writeFileSync(path.join(output, 'frontend-checks.json'), JSON.stringify({ sourceCommit, workingTree: 'includes local changes', scope: 'static build and Edge simulation; no backend, physical device or deployment acceptance', passed, results }, null, 2) + '\n');
    console.log(`Frontend checks: ${results.filter(r => r.passed).length}/${results.length}; ${output}`);
    if (!passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
