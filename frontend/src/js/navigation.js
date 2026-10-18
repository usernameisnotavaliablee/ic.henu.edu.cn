/* 导航只依赖HTML结构与浏览器事件，不依赖数据源或后端模板语言。 */
(() => {
  'use strict';
  const root = document.documentElement;
  const nav = document.querySelector('.main-nav');
  const toggle = document.querySelector('.nav-toggle');
  if (!nav || !toggle) return;
  const smallScreen = matchMedia('(max-width: 959px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => !reducedMotion.matches && root.dataset.motionPaused !== 'true' && typeof Element.prototype.animate === 'function';
  const buttonFor = item => item.querySelector(':scope > .nav-item-heading > .subnav-toggle');
  const menuFor = item => item.querySelector(':scope > .subnav');
  const states = new Map([...nav.querySelectorAll('.nav-item')].filter(buttonFor).map(item => [item, {
    open: false, revision: 0, hoverTimer: 0, button: buttonFor(item), menu: menuFor(item),
    parent: item.parentElement.closest('.nav-item'),
  }]));
  let menuOpen = false;
  let hiddenNavigationHadFocus = false;

  // 保留现有逐字模糊效果和时序。每个作用域拥有自己的动画，取消时清除填充终态。
  const timing = { duration: 245, character: 8.9, link: 26.7 };
  const textGroups = new Map();
  const animations = new Map();
  let topIndex = 0;
  for (const link of nav.querySelectorAll('a')) {
    const parent = link.closest('.subnav')?.closest('.nav-item');
    const scope = parent || nav;
    if (!parent) link.closest('.nav-item').style.setProperty('--nav-i', topIndex++);
    const label = link.textContent;
    link.setAttribute('aria-label', label);
    const chars = [...label].map(character => {
      const span = document.createElement('span');
      span.className = 'nav-flip-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = character === ' ' ? '\u00a0' : character;
      return span;
    });
    link.replaceChildren(...chars);
    if (!textGroups.has(scope)) textGroups.set(scope, []);
    textGroups.get(scope).push(chars);
  }
  const cancelText = scope => {
    for (const animation of animations.get(scope) || []) animation.cancel();
    animations.delete(scope);
  };
  const animateText = (scope, closing = false) => {
    cancelText(scope);
    if (!motionAllowed() || (scope === nav && !smallScreen.matches)) return null;
    const groups = [...(textGroups.get(scope) || [])];
    if (closing) groups.reverse();
    const speed = closing ? 0.7 : 1;
    const running = groups.flatMap((chars, order) => (closing ? [...chars].reverse() : chars).map((char, index) => char.animate(
      closing
        ? [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(10px)' }]
        : [{ opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0)' }],
      { duration: timing.duration * speed, delay: (order * timing.link + index * timing.character) * speed, easing: closing ? 'ease-in' : 'ease-out', fill: closing ? 'both' : 'backwards' },
    )));
    animations.set(scope, running);
    // 取消会拒绝finished；吸收该结果，由调用者的revision判断是否仍应提交终态。
    return Promise.allSettled(running.map(animation => animation.finished));
  };
  const setDropdown = (item, open, immediate = false) => {
    const state = states.get(item);
    clearTimeout(state.hoverTimer);
    if (state.open === open && !immediate) return;
    state.open = open;
    const revision = ++state.revision;
    cancelText(item);
    state.button.setAttribute('aria-expanded', String(open));
    // 先移出即将禁用的区域，避免焦点停在不可操作的后代上。
    if (!open && state.menu.contains(document.activeElement)) state.button.focus({ preventScroll: true });
    state.menu.inert = !open;
    item.classList.remove('opens-left', 'align-right');
    if (!open) {
      for (const [child, childState] of states) if (childState.parent === item) setDropdown(child, false, immediate);
    }
    const settle = () => {
      if (state.revision !== revision) return;
      item.classList.toggle('is-subnav-open', state.open);
      cancelText(item);
    };
    if (open) {
      item.classList.add('is-subnav-open');
      if (!smallScreen.matches && state.menu.getBoundingClientRect().right > innerWidth - 8) {
        item.classList.add(state.parent ? 'opens-left' : 'align-right');
      }
      const finished = immediate ? null : animateText(item);
      if (finished) finished.then(settle);
    } else {
      const finished = !immediate && smallScreen.matches && item.classList.contains('is-subnav-open') ? animateText(item, true) : null;
      if (finished) finished.then(settle);
      else settle();
    }
  };
  const openOnly = item => {
    for (const [other, state] of states) if (other !== item && state.parent === states.get(item).parent) setDropdown(other, false);
    setDropdown(item, true);
  };
  const closeDropdowns = () => {
    for (const [item, state] of states) if (!state.parent) setDropdown(item, false, true);
  };
  const setMenu = (open, restoreFocus = false) => {
    menuOpen = open;
    if (!open && smallScreen.matches && (restoreFocus || nav.contains(document.activeElement))) toggle.focus({ preventScroll: true });
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    nav.inert = smallScreen.matches && !open;
    cancelText(nav);
    if (open) {
      const finished = animateText(nav);
      const running = animations.get(nav);
      if (finished) finished.then(() => { if (animations.get(nav) === running) cancelText(nav); });
    } else closeDropdowns();
  };

  for (const [item, state] of states) {
    setDropdown(item, false, true);
    state.button.addEventListener('click', () => state.open ? setDropdown(item, false) : openOnly(item));
    item.addEventListener('pointerenter', event => {
      clearTimeout(state.hoverTimer);
      if (!smallScreen.matches && event.pointerType === 'mouse') openOnly(item);
    });
    item.addEventListener('pointerleave', () => {
      if (!smallScreen.matches && !item.contains(document.activeElement)) {
        state.hoverTimer = setTimeout(() => setDropdown(item, false), 160);
      }
    });
    item.addEventListener('focusin', event => {
      if (!smallScreen.matches && event.target.matches('a') && event.target.closest('.nav-item') === item) openOnly(item);
    });
    item.addEventListener('focusout', event => {
      if (!item.contains(event.relatedTarget)) setDropdown(item, false);
    });
  }
  nav.addEventListener('keydown', event => {
    let item = event.target.closest('.nav-item');
    if (event.key === 'Escape') {
      // 从焦点所属层向上寻找仍打开的菜单；已关闭的子项不吞掉下一次Escape。
      while (item && !states.get(item)?.open) item = item.parentElement.closest('.nav-item');
      if (item) {
        event.preventDefault(); event.stopPropagation();
        states.get(item).button.focus({ preventScroll: true });
        setDropdown(item, false);
      } else if (smallScreen.matches && menuOpen) {
        event.preventDefault(); event.stopPropagation(); setMenu(false, true);
      }
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowRight') && states.has(item)) {
      event.preventDefault(); event.stopPropagation(); openOnly(item);
      states.get(item).menu.querySelector('a')?.focus();
    }
  });
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuOpen) setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
  });
  // CSS may hide the desktop menu and blur it before the media-query callback runs.
  nav.addEventListener('focusout', event => {
    if (!event.relatedTarget && smallScreen.matches && !menuOpen) hiddenNavigationHadFocus = true;
  });
  document.addEventListener('focusin', () => { hiddenNavigationHadFocus = false; });
  smallScreen.addEventListener('change', () => {
    const focused = document.activeElement;
    const restoreFocus = nav.contains(focused) || (focused === document.body && hiddenNavigationHadFocus);
    hiddenNavigationHadFocus = false;
    if (!smallScreen.matches && focused === toggle) nav.querySelector('a')?.focus({ preventScroll: true });
    setMenu(false, smallScreen.matches && restoreFocus);
  });
  const settleMotion = () => {
    if (motionAllowed()) return;
    for (const scope of textGroups.keys()) cancelText(scope);
    for (const [item, state] of states) {
      ++state.revision;
      item.classList.toggle('is-subnav-open', state.open);
    }
  };
  reducedMotion.addEventListener('change', settleMotion);
  window.addEventListener('ic:motion', settleMotion);
  window.addEventListener('pagehide', () => {
    setMenu(false);
    for (const scope of textGroups.keys()) cancelText(scope);
  });
  setMenu(false);
  toggle.hidden = false;
  nav.classList.add('is-enhanced');
})();
