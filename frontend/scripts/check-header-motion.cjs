// 用可控帧时钟验证真实动画控制器；CSS视觉效果另由浏览器检查。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const create = require('../src/js/header-motion');
const checks = [];
function fixture() {
  let time = 0, id = 0; const jobs = new Map(), frames = [];
  const motion = create((value, moving) => frames.push({ value, moving }), {
    requestFrame: fn => { jobs.set(++id, fn); return id; }, cancelFrame: id => jobs.delete(id), now: () => time,
  });
  return { motion, frames, tick: ms => { time += ms; const pending = [...jobs.values()]; jobs.clear(); pending.forEach(fn => fn(time)); }, last: () => frames.at(-1) };
}
function test(name, fn) { fn(); checks.push(name); console.log('PASS ' + name); }
test('收缩有连续中间帧，非立即跳到终点', () => {
  const f = fixture(); f.motion.to(1); assert.equal(f.last().value, 0);
  f.tick(150); const a = f.last().value; f.tick(300); const b = f.last().value;
  assert.ok(a > 0 && a < b && b < 1); assert.equal(f.last().moving, true);
  f.tick(450); assert.equal(f.last().value, 1); assert.equal(f.last().moving, false);
});
test('同方向滚动事件不会重启动画', () => {
  const f = fixture(); f.motion.to(1); f.tick(450); f.motion.to(1); f.tick(450); assert.equal(f.last().value, 1);
});
test('反向操作从当前进度返回，不瞬移回端点', () => {
  const f = fixture(); f.motion.to(1); f.tick(450); const mid = f.last().value;
  f.motion.to(0); assert.equal(f.last().value, mid); f.tick(100); assert.ok(f.last().value > 0 && f.last().value < mid);
  f.tick(800); assert.equal(f.last().value, 0);
});
test('减少动态效果可直接到达目标', () => {
  const f = fixture(); f.motion.to(1, true); assert.equal(f.last().value, 1); assert.equal(f.last().moving, false);
});
test('离页取消后返回仍能到达目标', () => {
  const f = fixture(); f.motion.to(1); f.tick(200); const mid = f.last().value;
  f.motion.stop(); f.tick(1000); assert.equal(f.last().value, mid);
  f.motion.to(1); f.tick(1000); assert.equal(f.last().value, 1);
});
fs.writeFileSync(path.join(__dirname, '../qa/header-motion-unit.json'), JSON.stringify({ scope: 'offline frame controller, not browser visual QA', count: checks.length, checks }, null, 2) + '\n');
