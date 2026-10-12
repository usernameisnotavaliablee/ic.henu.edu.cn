/* 参考低空 src/js/main.js 的移动导航模式；保留基础交互，补充键盘和减少动态效果。 */
(() => {
  'use strict';
  const root = document.documentElement;
  const isHome = root.dataset.page === 'home';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const navigationEntry = performance.getEntriesByType('navigation')[0];
  const resetHome = isHome && !location.hash && navigationEntry?.type === 'reload';
  // 只在无锚点首页刷新时回首屏；返回上一页和明确的深链接仍尊重浏览器位置。
  if (resetHome) {
    history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    // pageshow 之后浏览器仍可能恢复旧位置，不能在这里过早恢复 auto。
    window.addEventListener('pageshow', () => requestAnimationFrame(() => scrollTo(0, 0)), { once: true });
    window.addEventListener('pagehide', () => { history.scrollRestoration = 'auto'; }, { once: true });
  }
  // 时间可控的柔和滚动。新滚轮、键盘或指针操作随时中止，不锁住用户。
  let scrollFrame = 0;
  let settleTimer = 0;
  const cancelScroll = () => {
    cancelAnimationFrame(scrollFrame);
    clearTimeout(settleTimer);
    root.dataset.scrollState = 'idle';
  };
  const glideTo = (destination, onFinish) => {
    cancelScroll();
    const start = scrollY;
    const target = Math.max(0, Math.min(destination, root.scrollHeight - innerHeight));
    const distance = target - start;
    if (Math.abs(distance) < 2 || reducedMotion.matches || root.dataset.motionPaused === 'true') {
      scrollTo(0, target);
      onFinish?.();
      return;
    }
    const duration = Math.min(1900, 1150 + Math.abs(distance) * .35);
    const started = performance.now();
    root.dataset.scrollState = 'settling';
    const frame = now => {
      const progress = Math.min(1, (now - started) / duration);
      // smootherstep 的两端速度和加速度均为零，消除突然起步和刹停。
      const eased = progress ** 3 * (progress * (progress * 6 - 15) + 10);
      scrollTo(0, start + distance * eased);
      if (progress < 1) scrollFrame = requestAnimationFrame(frame);
      else { root.dataset.scrollState = 'idle'; onFinish?.(); }
    };
    scrollFrame = requestAnimationFrame(frame);
  };
  window.addEventListener('wheel', cancelScroll, { passive: true });
  window.addEventListener('pointerdown', cancelScroll, { passive: true });
  window.addEventListener('touchstart', cancelScroll, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape', 'Tab'].includes(event.key)) cancelScroll();
  });
  window.addEventListener('resize', cancelScroll);
  window.addEventListener('ic:motion', cancelScroll);
  document.querySelectorAll('[data-back-top]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    glideTo(0, () => header.querySelector('.brand').focus({ preventScroll: true }));
  }));
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
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      setMenu(false);
      dropdowns.forEach(item => setDropdown(item, false));
    }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) setMenu(false, true);
    });
    document.addEventListener('click', event => {
      if (smallScreen.matches && !nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    const buttonFor = item => item.querySelector(':scope > .nav-item-heading > .subnav-toggle');
    const menuFor = item => item.querySelector(':scope > .subnav');
    const dropdowns = [...nav.querySelectorAll('.nav-item')].filter(buttonFor);
    const setDropdown = (item, open) => {
      item.classList.toggle('is-subnav-open', open);
      buttonFor(item).setAttribute('aria-expanded', String(open));
      const menu = menuFor(item);
      menu.inert = !open;
      item.classList.remove('opens-left', 'align-right');
      if (open && !smallScreen.matches) {
        // 靠近右边缘时朝左展开，三级菜单不溢出视口。
        if (menu.getBoundingClientRect().right > innerWidth - 8) {
          item.classList.add(item.parentElement.classList.contains('subnav') ? 'opens-left' : 'align-right');
        }
      }
      if (!open) dropdowns.filter(child => child !== item && item.contains(child)).forEach(child => {
        child.classList.remove('is-subnav-open', 'opens-left', 'align-right');
        buttonFor(child).setAttribute('aria-expanded', 'false');
        menuFor(child).inert = true;
      });
    };
    const openOnly = item => {
      dropdowns.filter(other => other.parentElement === item.parentElement && other !== item).forEach(other => setDropdown(other, false));
      setDropdown(item, true);
    };
    dropdowns.forEach(item => {
      let closeTimer;
      setDropdown(item, false);
      const button = buttonFor(item);
      button.addEventListener('click', () => {
        const open = !item.classList.contains('is-subnav-open');
        if (open) openOnly(item);
        else setDropdown(item, false);
      });
      item.addEventListener('pointerenter', event => { clearTimeout(closeTimer); if (!smallScreen.matches && event.pointerType === 'mouse') openOnly(item); });
      item.addEventListener('pointerleave', () => { if (!smallScreen.matches && !item.contains(document.activeElement)) closeTimer = setTimeout(() => setDropdown(item, false), 160); });
      item.addEventListener('focusin', event => { if (!smallScreen.matches && event.target.matches('a') && event.target.closest('.nav-item') === item) openOnly(item); });
      item.addEventListener('focusout', event => { if (!item.contains(event.relatedTarget)) setDropdown(item, false); });
      item.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.stopPropagation(); setDropdown(item, false); button.focus(); }
        if (event.target.closest('.nav-item') !== item) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault(); event.stopPropagation(); openOnly(item);
          menuFor(item).querySelector('a').focus();
        }
      });
    });
    document.addEventListener('click', event => { if (!nav.contains(event.target)) dropdowns.forEach(item => setDropdown(item, false)); });
    smallScreen.addEventListener('change', () => {
      const focusInNav = nav.contains(document.activeElement);
      setMenu(false, smallScreen.matches && focusInNav);
      dropdowns.forEach(item => setDropdown(item, false));
    });
  }

  // 不拦截原生滚轮：连续快滚能跨屏；手势停止后再柔和吸附。
  if (isHome) {
    const pagedDesktop = window.matchMedia('(min-width: 1100px) and (min-height: 600px) and (hover: hover) and (pointer: fine)');
    let wheelAt = 0;
    let gestureDistance = 0;
    let gestureStart = 0;
    let gestureDirection = 0;
    const compactHeight = () => parseFloat(getComputedStyle(root).getPropertyValue('--header-compact-height'));
    const snapAfterGesture = (direction, fast) => {
      if (document.hidden || !pagedDesktop.matches || reducedMotion.matches || root.dataset.motionPaused === 'true') return;
      const offset = compactHeight();
      const available = innerHeight - offset;
      const maximum = root.scrollHeight - innerHeight;
      // 过高区块提供起点与末端停靠；中间阅读区不强迫翻屏。
      const stops = [0, maximum];
      const sections = [...document.querySelectorAll('[data-home-section], .site-footer')];
      for (const section of sections) {
        const top = section.getBoundingClientRect().top + scrollY - offset;
        const bottom = top + section.offsetHeight - available;
        if (section.offsetHeight > available + 80 && scrollY > top + 8 && scrollY < bottom - 8) return;
        stops.push(Math.max(0, Math.min(maximum, top)));
        if (section.offsetHeight > available + 80) stops.push(Math.max(0, Math.min(maximum, bottom)));
      }
      const points = [...new Set(stops)].sort((a, b) => a - b);
      if (points.some(point => Math.abs(point - scrollY) < 4)) return;
      const before = points.filter(point => point <= scrollY).at(-1) ?? 0;
      const after = points.find(point => point > scrollY) ?? maximum;
      const target = fast ? (scrollY - before < after - scrollY ? before : after) : direction > 0 ? after : before;
      glideTo(target);
    };
    window.addEventListener('wheel', event => {
      if (!pagedDesktop.matches || root.dataset.motionPaused === 'true' || reducedMotion.matches) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
      if (event.target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], .subnav')) return;
      const now = performance.now();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      const direction = Math.sign(delta);
      if (now - wheelAt > 280 || gestureDirection !== direction) { gestureDistance = 0; gestureStart = now; }
      gestureDistance += Math.abs(delta);
      gestureDirection = direction;
      wheelAt = now;
      const fast = gestureDistance > innerHeight * .85 || (now - gestureStart > 35 && gestureDistance / (now - gestureStart) > 2.2 && gestureDistance > 260);
      root.dataset.scrollGesture = fast ? 'fast' : 'gentle';
      settleTimer = setTimeout(() => snapAfterGesture(direction, fast), fast ? 340 : 220);
    }, { passive: true });
  }

  // 动效统一跟随系统偏好；不再提供页面上的暂停按钮。
  let motionPaused = reducedMotion.matches;
  const syncMotion = () => {
    document.documentElement.dataset.motionPaused = String(motionPaused);
    window.dispatchEvent(new CustomEvent('ic:motion'));
  };
  reducedMotion.addEventListener('change', () => { motionPaused = reducedMotion.matches; syncMotion(); });
  syncMotion();

  // 同一套 SVG 光流用于首页、科研和内页；离屏、后台和减少动态效果时停止。
  const chipVisuals = [...document.querySelectorAll('[data-chip-visual]')];
  const syncChips = () => chipVisuals.forEach(el => {
    el.classList.toggle('is-animating', el.dataset.inView === 'true' && !document.hidden && !motionPaused && !reducedMotion.matches);
  });
  if ('IntersectionObserver' in window) {
    const chipObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { entry.target.dataset.inView = String(entry.isIntersecting); });
      syncChips();
    });
    chipVisuals.forEach(el => chipObserver.observe(el));
  }
  document.addEventListener('visibilitychange', syncChips);
  window.addEventListener('ic:motion', syncChips);

  // 图片新闻：左侧标题与右侧大图联动，所有链接仍可直接进入详情。
  const gallery = document.querySelector('[data-news-gallery]');
  if (gallery) {
    const links = [...gallery.querySelectorAll('[data-news-select]')];
    const pictures = [...gallery.querySelectorAll('[data-news-panel]')];
    const newsStatus = gallery.querySelector('[data-news-status]');
    let active = 0;
    const showNews = (next, announce = false) => {
      if (!pictures.length) return;
      active = (next + pictures.length) % pictures.length;
      links.forEach((link, i) => link.classList.toggle('is-active', i === active));
      pictures.forEach((picture, i) => { picture.hidden = i !== active; });
      gallery.querySelector('[data-news-count]').textContent = `${String(active + 1).padStart(2, '0')} / ${String(pictures.length).padStart(2, '0')}`;
      if (announce) newsStatus.textContent = `图片新闻 ${active + 1}：${links[active].querySelector('h3').textContent}`;
    };
    links.forEach((link, i) => {
      link.addEventListener('mouseenter', () => showNews(i));
      link.addEventListener('focus', () => showNews(i));
    });
    gallery.querySelector('[data-news-prev]').addEventListener('click', () => showNews(active - 1, true));
    gallery.querySelector('[data-news-next]').addEventListener('click', () => showNews(active + 1, true));
    gallery.querySelector('.news-picture-controls').hidden = pictures.length < 2;
    if (pictures.length) showNews(0);
    else gallery.querySelector('[data-news-count]').textContent = '00 / 00';
  }

  if ('IntersectionObserver' in window) {
    const sections = document.querySelectorAll('[data-home-section]');
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('has-entered'); reveal.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -12% 0px' });
    sections.forEach(section => {
      section.classList.add('is-reveal-ready');
      reveal.observe(section);
      // 键盘进入尚未展示的内容时立即显现，不能把焦点藏起来。
      section.addEventListener('focusin', () => { section.classList.add('has-entered'); reveal.unobserve(section); });
    });
  }

  const hero = document.querySelector('[data-carousel]');
  if (!hero) return;
  const slides = [...hero.querySelectorAll('[data-slide]')];
  const dots = [...hero.querySelectorAll('[data-dot]')];
  const controls = hero.querySelector('.carousel-controls');
  const count = hero.querySelector('.carousel-count');
  const status = hero.querySelector('[data-slide-status]');
  const playbackStatus = hero.querySelector('[data-playback-status]');
  const intervalMs = 3000;
  const transitionMs = 650;
  let index = 0;
  let timer;
  let slideAnimations = [];
  const finishTransition = () => {
    slideAnimations.forEach(animation => { animation.onfinish = null; animation.cancel(); });
    slideAnimations = [];
    slides.forEach((slide, i) => {
      slide.hidden = i !== index;
      slide.style.zIndex = '';
    });
    hero.dataset.transition = 'idle';
  };
  const updatePlayback = () => {
    window.clearTimeout(timer);
    const waitingForImage = ['loading', 'slow'].includes(slides[index].dataset.mediaState);
    const paused = reducedMotion.matches || document.hidden || waitingForImage;
    hero.dataset.paused = String(paused);
    hero.dataset.carouselState = reducedMotion.matches ? 'paused' : document.hidden ? 'background' : waitingForImage ? 'loading' : 'playing';
    const message = reducedMotion.matches ? '已跟随系统减少动态效果，可手动换图' : document.hidden ? '后台暂停，返回后继续' : waitingForImage ? '正在等待当前图片，可手动换图' : '每 3 秒自动换图';
    if (playbackStatus && playbackStatus.textContent !== message) {
      playbackStatus.textContent = message;
    }
    if (!paused && slides.length > 1) timer = window.setTimeout(() => show(index + 1), intervalMs);
  };
  const show = (next, manual = false) => {
    const previous = index;
    const direction = next < previous ? -1 : 1;
    // 连续点击先收齐上一次动画，避免多张叠住或旧动画结束时隐藏新图。
    finishTransition();
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
      slide.inert = i !== index;
    });
    hero.dataset.activeSlide = String(index);
    if (index !== previous && !reducedMotion.matches && !motionPaused && typeof slides[index].animate === 'function') {
      const outgoing = slides[previous];
      const incoming = slides[index];
      outgoing.hidden = false;
      outgoing.style.zIndex = '1';
      incoming.style.zIndex = '2';
      hero.dataset.transition = direction > 0 ? 'next' : 'previous';
      const options = { duration: transitionMs, easing: 'cubic-bezier(.25,.75,.25,1)', fill: 'both' };
      slideAnimations = [
        outgoing.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-direction * 100}%)` }], options),
        incoming.animate([{ transform: `translateX(${direction * 100}%)` }, { transform: 'translateX(0)' }], options),
      ];
      slideAnimations[1].onfinish = finishTransition;
    }
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    // 自动切换不打断读屏；手动操作才播报。
    if (manual) status.textContent = `第 ${index + 1} 张，共 ${slides.length} 张：${slides[index].dataset.title}`;
    updatePlayback();
  };
  if (slides.length < 2) return;
  controls.hidden = false;
  hero.querySelectorAll('.carousel-arrow').forEach(button => { button.hidden = false; });
  hero.querySelector('[data-prev]').addEventListener('click', () => show(index - 1, true));
  hero.querySelector('[data-next]').addEventListener('click', () => show(index + 1, true));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i, true)));
  hero.addEventListener('ic:media', event => { if (event.target === slides[index]) updatePlayback(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishTransition(); updatePlayback(); });
  reducedMotion.addEventListener('change', updatePlayback);
  window.addEventListener('ic:motion', () => { if (motionPaused) finishTransition(); });
  window.addEventListener('pagehide', () => { window.clearTimeout(timer); finishTransition(); });
  window.addEventListener('pageshow', updatePlayback);
  show(0);
})();
