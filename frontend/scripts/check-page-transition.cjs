// 离线检查导航不再被人为延迟；不替代浏览器帧率与网络性能验收。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../src/js/page-transition.js'), 'utf8');
const checks = [];
function fixture({ native = false, reduced = false, protocol = 'https:' } = {}) {
  const events = {}, timers = new Map(), classes = new Set();
  let sequence = 0;
  const root = { classList: { add: x => classes.add(x), remove: x => classes.delete(x) } };
  const media = { matches: reduced, addEventListener: (name, fn) => events['media:' + name] = fn };
  const context = {
    document: { documentElement: root }, window: native ? { onpagereveal: null } : {},
    CSS: { supports: () => native }, matchMedia: () => media,
    addEventListener: (name, fn) => events[name] = fn, location: { protocol },
    setTimeout: (fn, delay) => { timers.set(++sequence, { fn, delay }); return sequence; },
    clearTimeout: id => timers.delete(id),
  };
  // 不提供点击拦截、location.assign或sessionStorage，若误用则直接报错。
  vm.runInNewContext(source, context);
  return { events, timers, classes, media };
}
function test(label, run) { run(); checks.push(label); console.log('PASS ' + label); }
test('原生过渡不叠加JS动画或计时器', () => {
  const f = fixture({ native: true }); assert.equal(f.timers.size, 0); assert.equal(f.classes.size, 0);
});
test('降级只在新页淡入，不拦截或延迟链接导航', () => {
  const f = fixture(); assert.ok(f.classes.has('page-entering')); assert.equal(f.events.click, undefined);
  [...f.timers.values()][0].fn(); assert.equal(f.classes.size, 0);
});
test('减少动态效果不创建淡入或计时器', () => {
  const f = fixture({ reduced: true }); assert.equal(f.classes.size, 0); assert.equal(f.timers.size, 0);
});
test('历史缓存恢复和系统设置变化清理淡入', () => {
  const f = fixture(); f.events.pageshow({ persisted: true }); assert.equal(f.classes.size, 0); assert.equal(f.timers.size, 0);
  const g = fixture(); g.media.matches = true; g.events['media:change'](); assert.equal(g.classes.size, 0); assert.equal(g.timers.size, 0);
});
test('直接打开本地HTML使用无等待降级', () => {
  const f = fixture({ native: true, protocol: 'file:' }); assert.ok(f.classes.has('page-entering')); assert.equal(f.events.click, undefined);
});
const output = path.resolve(process.env.IC_TEST_OUTPUT || path.join(__dirname, '../../sandbox/frontend-checks'));
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'page-transition-unit.json'), JSON.stringify({ scope: 'offline navigation controller, not visual or performance QA', count: checks.length, checks }, null, 2) + '\n');
