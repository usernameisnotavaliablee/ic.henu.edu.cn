// 不拦截导航、不延迟请求。原生浏览器在新文档就绪后一次完成跨页过渡。
// 不支持跨文档过渡时，仅新页淡入；旧页加载期间始终可见。
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const native = ['http:', 'https:'].includes(location.protocol) && 'onpagereveal' in window && CSS.supports('view-transition-name: site-header');
  let cleanup;
  const reset = () => {
    clearTimeout(cleanup);
    root.classList.remove('page-entering');
  };
  if (!native && !reduced.matches) {
    root.classList.add('page-entering');
    cleanup = setTimeout(reset, 300);
  }
  addEventListener('pageshow', event => { if (event.persisted) reset(); });
  reduced.addEventListener('change', () => { if (reduced.matches) reset(); });
})();
