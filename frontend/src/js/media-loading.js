/* 图片独立加载：正文不等待图片，懒加载计时从进入视口开始。 */
(() => {
  'use strict';
  const begin = frame => {
    const img = frame.querySelector('img');
    const status = frame.querySelector('[data-media-status]');
    const label = status.querySelector('[data-media-label]');
    let slowTimer, stalledTimer;
    const update = state => {
      frame.dataset.mediaState = state;
      status.hidden = state === 'ready';
      label.textContent = ({ loading: '图片加载中…', slow: '图片加载较慢…', stalled: '图片仍未加载，可刷新重试', error: '图片未能加载，可刷新重试' })[state] || '';
      frame.dispatchEvent(new CustomEvent('ic:media', { bubbles: true }));
    };
    const finish = () => {
      clearTimeout(slowTimer);
      clearTimeout(stalledTimer);
      update(img.naturalWidth ? 'ready' : 'error');
    };
    // 先注册事件，再检查缓存，避免完成事件落在二者之间。
    img.addEventListener('load', finish, { once: true });
    img.addEventListener('error', finish, { once: true });
    if (img.complete) { finish(); return; }
    update('loading');
    slowTimer = setTimeout(() => update('slow'), 12000);
    // 极慢/挂起请求不无限转圈，资源随后到达仍可正常恢复。
    stalledTimer = setTimeout(() => update('stalled'), 30000);
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { observer.unobserve(entry.target); begin(entry.target); }
    });
  }, { rootMargin: '200px' }) : null;
  document.querySelectorAll('[data-media]').forEach(frame => {
    if (frame.querySelector('img').loading === 'lazy' && observer) observer.observe(frame);
    else begin(frame);
  });
})();
