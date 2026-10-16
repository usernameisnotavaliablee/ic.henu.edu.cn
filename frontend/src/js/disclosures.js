// Progressive enhancement of native details; one controller for every disclosure.
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  for (const drawer of document.querySelectorAll('[data-disclosure]')) {
    const summary = drawer.querySelector('summary');
    const panel = summary?.nextElementSibling;
    if (!summary || !panel) continue;
    let target = drawer.open;
    let animations = [];
    let revision = 0;
    drawer.dataset.enhanced = 'true';
    const settle = () => {
      drawer.open = target;
      panel.inert = !target;
      drawer.dataset.expanded = String(target);
      summary.setAttribute('aria-expanded', String(target));
    };
    const toggle = (next, immediate = false) => {
      if (next === target && !immediate) return;
      const from = drawer.getBoundingClientRect().height;
      const opacity = getComputedStyle(panel).opacity;
      const wasOpen = drawer.open;
      const version = ++revision;
      target = next;
      animations.forEach(animation => animation.cancel());
      animations = [];
      if (!target && panel.contains(document.activeElement)) summary.focus({preventScroll:true});
      panel.inert = !target;
      summary.setAttribute('aria-expanded', String(target));
      drawer.dataset.expanded = String(target);
      if (immediate || reduced.matches || typeof drawer.animate !== 'function') { settle(); return; }
      drawer.open = true;
      const border = parseFloat(getComputedStyle(drawer).borderTopWidth) + parseFloat(getComputedStyle(drawer).borderBottomWidth);
      const to = target ? drawer.getBoundingClientRect().height : summary.getBoundingClientRect().height + border;
      const timing = {duration:360,easing:'cubic-bezier(.22,.61,.36,1)'};
      animations = [
        drawer.animate([{height:from+'px'},{height:to+'px'}],timing),
        panel.animate([{opacity:wasOpen?opacity:0,filter:wasOpen?'blur(0)':'blur(5px)'},{opacity:target?1:0,filter:target?'blur(0)':'blur(5px)'}],timing),
      ];
      Promise.allSettled(animations.map(animation=>animation.finished)).then(()=>{
        if (version !== revision) return;
        settle(); animations.forEach(animation=>animation.cancel()); animations=[];
      });
    };
    settle();
    summary.addEventListener('click',event=>{event.preventDefault();toggle(!target);});
    drawer.addEventListener('keydown',event=>{
      if (event.key==='Escape' && target) {event.preventDefault();toggle(false);summary.focus({preventScroll:true});}
    });
    reduced.addEventListener('change',()=>toggle(target,true));
  }
})();
