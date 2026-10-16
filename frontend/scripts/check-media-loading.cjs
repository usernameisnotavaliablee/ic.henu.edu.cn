// 离线验证图片状态机；不把此检查当成真实浏览器或弱网视觉验收。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/js/media-loading.js'), 'utf8');
const checks = [];
function fixture({ complete = false, width = 0, lazy = false, observer = true } = {}) {
  const listeners = {}, timers = new Map(), events = [], label = { textContent: '' };
  const status = { hidden: true, querySelector: () => label };
  const img = { complete, naturalWidth: width, loading: lazy ? 'lazy' : 'eager', addEventListener: (name, fn) => { listeners[name] = fn; } };
  const frame = { dataset: {}, querySelector: selector => selector === 'img' ? img : status, dispatchEvent: event => events.push(event) };
  let observed, callback, nextId = 0;
  const window = observer ? { IntersectionObserver: true } : {};
  vm.runInNewContext(source, {
    window, document: { querySelectorAll: () => [frame] },
    CustomEvent: class { constructor(type, options) { this.type = type; this.bubbles = options.bubbles; } },
    IntersectionObserver: class { constructor(fn) { callback = fn; } observe(el) { observed = el; } unobserve() { observed = null; } },
    setTimeout: (fn, ms) => { timers.set(++nextId, { fn, ms }); return nextId; }, clearTimeout: id => timers.delete(id),
  });
  return { frame, img, status, label, timers, events,
    enter: () => { assert.equal(observed, frame); callback([{ target: frame, isIntersecting: true }]); },
    tick: ms => { for (const [id, timer] of [...timers]) if (timer.ms <= ms) { timers.delete(id); timer.fn(); } },
    emit: (name, width) => { img.naturalWidth = width; listeners[name](); },
  };
}
function test(name, fn) { fn(); checks.push(name); console.log('PASS ' + name); }
test('缓存图片立即就绪，无多余计时器', () => {
  const f = fixture({ complete: true, width: 800 });
  assert.equal(f.frame.dataset.mediaState, 'ready'); assert.equal(f.status.hidden, true); assert.equal(f.timers.size, 0);
});
test('慢加载、30秒停止转圈、随后成功恢复', () => {
  const f = fixture(); assert.equal(f.frame.dataset.mediaState, 'loading');
  f.tick(12000); assert.equal(f.frame.dataset.mediaState, 'slow');
  f.tick(30000); assert.equal(f.frame.dataset.mediaState, 'stalled');
  f.emit('load', 800); assert.equal(f.frame.dataset.mediaState, 'ready'); assert.equal(f.status.hidden, true);
  assert.ok(f.events.every(e => e.type === 'ic:media' && e.bubbles));
});
test('加载失败显示提示并取消慢网计时器', () => {
  const f = fixture(); f.emit('error', 0); assert.equal(f.frame.dataset.mediaState, 'error');
  assert.equal(f.status.hidden, false); assert.equal(f.timers.size, 0); assert.match(f.label.textContent, /未能加载/);
});
test('快速完成后不会再次变成加载较慢', () => {
  const f = fixture(); f.emit('load', 800); f.tick(30000); assert.equal(f.frame.dataset.mediaState, 'ready'); assert.equal(f.timers.size, 0);
});
test('懒加载在进入可见范围后才计时', () => {
  const f = fixture({ lazy: true }); assert.equal(f.timers.size, 0); f.enter(); assert.equal(f.frame.dataset.mediaState, 'loading');
});
test('无观察器环境和缓存失败均能回退', () => {
  assert.equal(fixture({ lazy: true, observer: false }).frame.dataset.mediaState, 'loading');
  assert.equal(fixture({ complete: true }).frame.dataset.mediaState, 'error');
});
const output = path.resolve(process.env.IC_TEST_OUTPUT || path.join(__dirname, '../../sandbox/frontend-checks'));
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'media-loading-unit.json'), JSON.stringify({ scope: 'offline state machine, not browser QA', checks, count: checks.length }, null, 2) + '\n');
