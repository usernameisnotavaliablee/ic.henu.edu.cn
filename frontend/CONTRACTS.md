# 前端展示契约

本文件说明模板与交互模块的连接要求；当前实施状态见 [STATUS](../STATUS.md)。后端可能重写，前端不以 Django 模型、发布状态机或数据库主键作为交互模块的必需依赖。

## 已实现：导航HTML与交互

`src/js/navigation.js` 在页面脚本执行时读取现有HTML，不请求接口。静态构建、Django以及未来服务器端模板只要输出相同结构，就能复用导航交互。未来若使用客户端局部替换，需要另行提供显式挂载/卸载生命周期；当前模块不宣称支持SPA热替换。

| 输出元素 | 契约 |
|---|---|
| 主导航 | `.main-nav`，具有与按钮 `aria-controls` 一致且页面唯一的 id |
| 主开关 | `.nav-toggle`，原生 button，初始 hidden、`aria-expanded="false"`；脚本增强成功后显示 |
| 栏目项 | `.nav-item > .nav-item-heading > a`，真实可导航的 href 与完整文字标签 |
| 子菜单 | `.nav-item > .subnav`，其父项 heading 内带 `.subnav-toggle` 原生按钮；按钮的 aria-controls 对应子菜单唯一 id |
| 当前页 | 由渲染层输出 `aria-current="page"`，交互模块不推断栏目数据或改写href |
| 页脚抽屉 | 原生 `.footer-drawer` details/summary，内部 `.footer-links a` 使用同款文字动画 |

开关的目标状态由模块内部统一管理。ARIA、inert及显示类是状态输出，调用方不应通过直接切换类来控制菜单。退场允许暂时保留可见结构，但内容立即不可聚焦；新操作会取消旧动画，旧完成回调不能覆盖新状态。Escape 从当前层逐级关闭并返回对应按钮；切换屏宽清理状态并将焦点移到可见入口。

动画遵循 `prefers-reduced-motion`，也兼容既有 `documentElement.dataset.motionPaused` 与 `ic:motion` 事件。字符通过 textContent 生成，后端文字不会被当作HTML拼接。缺少 Web Animations 时直接完成状态切换；导航脚本未运行时，CSS保留展开的链接结构，页脚仍使用原生details。

## 后续栏目与内容适配原则

后续批次将把稳定栏目标识、父级、URL、标题、排序和布局集中管理，并以具名槽位连接模板。现有 `site.js`、`collections.js` 和构建器还没有完成这项替换，不应提前称作统一数据契约已完成。

- 栏目身份独立于排序；旧URL和持久化旧标识通过映射兼容，不能因布局调序改变内容归属。
- 展示组件接收标题、链接、日期、摘要、图片及alt等展示字段；数据库模型、权限和审核流程留在后端适配层。
- 区分缺少数据、空列表、主动清空和隐藏，避免用“回退默认”代替所有状态。
- 文本默认转义，正文格式和可信HTML边界在后续模板契约中单独明确。
- Django仅为现有预览适配器；未来后端及博达各自提供读取与渲染适配，不要求沿用ContentEntry或Publication。
- 未确定网络协议、认证、分页格式或学校组件语法之前，不编造可调用的HTTP地址。本文件的展示接口不等于已实现REST API。
