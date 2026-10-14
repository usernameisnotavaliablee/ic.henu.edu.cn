/* 单一进度驱动整组标识；改变目标时从当前帧继续，避免 class 切换导致跳位。 */
(() => {
  'use strict';
  function createAnimator(render, { requestFrame, cancelFrame, now }, initial = 0) {
    let value = initial, target = initial, frame = 0;
    render(value, false);
    const to = (next, immediate = false) => {
      if (next === target && !immediate) return;
      cancelFrame(frame);
      target = next;
      if (immediate || Math.abs(next - value) < .0001) {
        value = next; render(value, false); return;
      }
      const from = value, started = now();
      // 完整收缩900ms；反向从当前尺寸继续，不回到某个端点重放。
      const duration = Math.max(320, 900 * Math.abs(next - from));
      const tick = time => {
        const t = Math.min(1, (time - started) / duration);
        const eased = t * t * t * (t * (t * 6 - 15) + 10);
        value = from + (next - from) * eased;
        render(value, t < 1);
        if (t < 1) frame = requestFrame(tick);
      };
      frame = requestFrame(tick);
    };
    return { to, stop: () => { cancelFrame(frame); target = NaN; } };
  }
  if (typeof module === 'object' && module.exports) { module.exports = createAnimator; return; }
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  if (!header) return;
  const home = root.dataset.page === 'home';
  const brand = header.querySelector('.brand');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let compact = !home || scrollY > 90;
  root.classList.add('header-enhanced');
  header.classList.toggle('is-compact', compact);
  header.dataset.headerReady = 'true';
  if (brand) brand.inert = compact;
  const motion = createAnimator((progress, moving) => {
    header.style.setProperty('--header-progress', progress.toFixed(5));
    header.dataset.headerAnimation = moving ? 'running' : 'idle';
  }, { requestFrame: requestAnimationFrame, cancelFrame: cancelAnimationFrame, now: () => performance.now() }, Number(compact));
  const update = () => {
    compact = !home || scrollY > 90 || (compact && scrollY > 20);
    header.classList.toggle('is-compact', compact);
    if (brand) brand.inert = compact;
    motion.to(Number(compact), reduce.matches);
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('pageshow', update);
  addEventListener('pagehide', () => motion.stop());
  reduce.addEventListener('change', () => motion.to(Number(compact), reduce.matches));
})();
