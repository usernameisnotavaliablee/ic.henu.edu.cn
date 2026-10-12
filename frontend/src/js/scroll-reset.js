// 在浏览器恢复位置之前执行；仅无锚点首页刷新归零。
// 提前固定页头，避免 defer 脚本运行前后 position 切换造成首帧闪动。
document.documentElement.classList.add('header-enhanced');
if (document.documentElement.dataset.page === 'home' && !location.hash && performance.getEntriesByType('navigation')[0]?.type === 'reload') {
  history.scrollRestoration = 'manual';
}
