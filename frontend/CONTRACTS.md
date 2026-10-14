# 前端展示契约

本文件说明模板与交互模块的连接要求；当前实施状态见 [STATUS](../STATUS.md)。后端可能重写，前端不以 Django 模型、发布状态机或数据库主键作为交互模块的必需依赖。

实际 HTTP 路由、后台表单和数据读取说明见[后端接口文档](../docs/接口文档.md)；本文件聚焦模板与交互约束。

## 已实现：导航HTML与交互

`src/js/navigation.js` 在页面脚本执行时读取现有HTML，不请求接口。静态构建、Django以及未来服务器端模板只要输出相同结构，就能复用导航交互。未来若使用客户端局部替换，需要另行提供显式挂载/卸载生命周期；当前模块不宣称支持SPA热替换。

| 输出元素 | 契约 |
|---|---|
| 主导航 | `.main-nav`，具有与按钮 `aria-controls` 一致且页面唯一的 id |
| 主开关 | `.nav-toggle`，原生 button，初始 hidden、`aria-expanded="false"`；脚本增强成功后显示 |
| 栏目项 | `.nav-item > .nav-item-heading > a`，真实可导航的 href 与完整文字标签 |
| 子菜单 | `.nav-item > .subnav`，其父项 heading 内带 `.subnav-toggle` 原生按钮；按钮的 aria-controls 对应子菜单唯一 id |
| 当前页 | 由渲染层输出 `aria-current="page"`，交互模块不推断栏目数据或改写href |
| 页脚 | 独立静态结构；队友新版已取消抽屉，不由导航模块增强 |

开关的目标状态由模块内部统一管理。ARIA、inert及显示类是状态输出，调用方不应通过直接切换类来控制菜单。退场允许暂时保留可见结构，但内容立即不可聚焦；新操作会取消旧动画，旧完成回调不能覆盖新状态。Escape 从当前层逐级关闭并返回对应按钮；切换屏宽清理状态并将焦点移到可见入口。

动画遵循 `prefers-reduced-motion`，也兼容既有 `documentElement.dataset.motionPaused` 与 `ic:motion` 事件。字符通过 textContent 生成，后端文字不会被当作HTML拼接。缺少 Web Animations 时直接完成状态切换；导航脚本未运行时，CSS保留展开的链接结构。

## 栏目与路由

`src/data/columns.js` 是栏目的唯一声明。`scripts/lib/columns.js` 校验并生成导航、概览配置、集合与面包屑，`site.js` 和 `collections.js` 仅保留兼容导出。层级以 `parentId` 表示，菜单配置只引用 `id`，允许不同入口标签指向同一栏目。

| 字段 | 约定 |
|---|---|
| id | 语义稳定标识，例如 employment-guidance；不得由数组下标生成 |
| parentId / kind | 父栏目，以及 page、overview、collection、section 类型；拒绝缺失父级和循环 |
| url | 保留原有相对地址；改排序不能改地址 |
| storageKey / legacyKeys | 当前预览库的兼容映射，例如 admissions.section-3；不是新后端必须沿用的主键 |
| sections | 显式 id、key、anchor、label；调整展示顺序仍保持旧锚点和内容归属 |
| order / layout / watermark | 集合展示顺序、cards/list 版式、装饰字；不决定身份 |

构建产出的 `backend/content-catalog.json` 是现有 Django 的本地适配输入，不是公开网络接口。`backend/content/presentation.py` 读取同一份路由来提供标题、当前顶层栏目与面包屑；固定页面白名单也从目录投影。文章和教师详情仍受原有发布/撤下逻辑控制，不因存在静态占位而公开。

## 展示组件和具名槽位

`src/templates/components` 的教师卡、栏目卡、轮播及图片反馈由静态和 Django 生成器共用。模板字段接收已经转义的文本，只有调用方明确构造的组件 HTML 可以作为结构插入。浏览器模块读取真实链接、DOM 和 data 属性，不读取数据库模型或发起业务写请求。

| 组件 | 输入 |
|---|---|
| teacher-card | href、title、subtitle、summary、image（已经渲染的图片组件或空字符串） |
| collection-card | href、title、summary、meta、action、image |
| media | src、alt、width、height、loading、共享状态组件；一幅图片对应一个 data-media 容器 |
| slide | 标题、眉题、正文、图注、视觉内容、序号、总数和可见状态 |
| error-body | heading、message、homeUrl、sitemapUrl；静态404与动态错误页共用正文，HTTP状态由服务器决定 |

固定内容使用 `components.slot(name, preview, django)` 注册。构建只替换明确的槽位标记，名称重复或未注册即失败；改占位正文、换行或页脚排版不影响数据绑定。头尾的 logo、logoAlt、motto、college、english、wechat、filing 均是显式参数。`scripts/adapters/django.js` 负责生成现有模板标签，未来适配器可以复用同一组件结构。

静态文本使用 `escape`；Django 表达式沿用自动转义，正文仍经 `content_paragraphs` 按空行和 `## ` 标题渲染，不接收不可信 HTML。外部图片/链接的发布校验归后端适配器；当前仅使用已有素材选择和发布快照，未增加公共写入 API。

## 缺省和空值

本轮保留现有业务含义，未把重构当作数据库或发布规则迁移：未提供固定内容显示占位；空集合显示暂无已发布内容；教师撤下不展示；轮播 `is_visible=false` 仍回退默认；站点部分空字符串仍回退默认。后两项是已有能力限制，不能描述为支持主动清空或真正隐藏轮播。将来改变这些语义，需要适配器与内容维护流程一起升级。

## 资源与适配边界

CSS 在 `src/css/components` 按组件维护，`style.css` 保留明确的层叠顺序，构建后仍是一份样式文件。脚本和样式引用带内容哈希版本；字体本身使用内容哈希文件名。`frontend/build-manifest.json` 记录输入/产物和资源哈希，只删除上次清单拥有且没有被手改的过期产物，未知文件和被手改的过期文件予以保留。

Django 仅为现有预览适配器；未来后端及博达分别实现数据读取和模板渲染，不必沿用 ContentEntry 或 Publication。未确定学校字段、组件语法和认证方式前，不编造 HTTP 地址、REST API 或 JSP 插件。博达待办见 [学校前端适配说明](BODA-HANDOFF.md)。
