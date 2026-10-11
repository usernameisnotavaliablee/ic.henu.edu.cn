/* 参考低空 src/js/main.js 的移动导航模式；保留基础交互，补充键盘和减少动态效果。 */
(() => {
  'use strict';
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  const smallScreen = window.matchMedia('(max-width: 959px)');
  if (toggle && nav) {
    nav.classList.add('is-enhanced');
    toggle.hidden = false;
    const setMenu = (open, restoreFocus = false) => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.querySelector('.menu-icon').textContent = open ? '×' : '☰';
      if (restoreFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) setMenu(false, true);
    });
    document.addEventListener('click', event => {
      if (smallScreen.matches && !nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    smallScreen.addEventListener('change', () => {
      const focusInNav = nav.contains(document.activeElement);
      setMenu(false, smallScreen.matches && focusInNav);
    });
  }

  const hero = document.querySelector('[data-carousel]');
  if (!hero) return;
  const slides = [...hero.querySelectorAll('[data-slide]')];
  const dots = [...hero.querySelectorAll('[data-dot]')];
  const controls = hero.querySelector('.carousel-controls');
  const pause = hero.querySelector('[data-pause]');
  const count = hero.querySelector('.carousel-count');
  const status = hero.querySelector('[data-slide-status]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let userPaused = reducedMotion.matches;
  let hovering = false;
  let timer;
  const updatePlayback = () => {
    window.clearTimeout(timer);
    const paused = userPaused || reducedMotion.matches || hovering || hero.contains(document.activeElement) || document.hidden;
    hero.dataset.paused = String(paused);
    pause.textContent = userPaused ? '播放' : '暂停';
    pause.setAttribute('aria-label', userPaused ? '开启自动轮播' : '暂停自动轮播');
    pause.disabled = reducedMotion.matches;
    if (reducedMotion.matches) {
      pause.textContent = '静态';
      pause.setAttribute('aria-label', '已按系统偏好关闭自动轮播');
    }
    if (!paused && slides.length > 1) timer = window.setTimeout(() => show(index + 1), 6000);
  };
  const show = (next, manual = false) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    // 自动切换不打断读屏；手动操作才播报。
    if (manual) status.textContent = `第 ${index + 1} 张，共 ${slides.length} 张：${slides[index].dataset.title}`;
    updatePlayback();
  };
  if (slides.length < 2) return;
  controls.hidden = false;
  hero.querySelector('[data-prev]').addEventListener('click', () => show(index - 1, true));
  hero.querySelector('[data-next]').addEventListener('click', () => show(index + 1, true));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i, true)));
  pause.addEventListener('click', () => { userPaused = !userPaused; updatePlayback(); });
  hero.addEventListener('mouseenter', () => { hovering = true; updatePlayback(); });
  hero.addEventListener('mouseleave', () => { hovering = false; updatePlayback(); });
  hero.addEventListener('focusin', updatePlayback);
  hero.addEventListener('focusout', () => window.setTimeout(updatePlayback, 0));
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) userPaused = true; updatePlayback(); });
  show(0);
})();
