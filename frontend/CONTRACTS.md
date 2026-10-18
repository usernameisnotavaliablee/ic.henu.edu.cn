# 前端展示契约

本文件说明模板与交互模块的连接要求；当前实施状态见 [STATUS](../STATUS.md)。正式运行由学校平台承接；前端不以 Django 模型、发布状态机或数据库主键作为交互模块的必需依赖。

对接学校平台所需的页面数据、管理编辑和审核发布契约见根目录[后端交付文档](../后端交付文档_博达接入与预览部署.md)。本文件聚焦模板与交互约束；请求适配器和新管理接口均尚未实现。

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
| parentId / kind | 父栏目，以及 page、overview、collection、section、alias 类型；拒绝缺失父级和循环 |
| sections[].reference | 显式引用已有集合以预览同一批资料，不改变其唯一父级/key；当前用于科研页课题组预览及旧招生就业页兼容。各展示位置独立指定anchor与位置，避免重复ID |
| url | 保留原有相对地址；改排序不能改地址 |
| aliasOf / listed | alias 节点保留旧 URL，指向唯一正式栏目；listed=false 保留可读旧页但不加入常规同级入口 |
| storageKey / legacyKeys | 当前预览库的兼容映射，例如 admissions.section-3；不是新后端必须沿用的主键 |
| sections | 显式 id、key、anchor、label；调整展示顺序仍保持旧锚点和内容归属 |
| order / layout / watermark | 集合展示顺序、cards/list 版式、装饰字；不决定身份 |
| sort / service | date-desc 表示合并后的制度与办事以发布日期倒序为主；service 表示允许仪器详情的外部服务入口 |
| facultyFilter | 仅师资页面声明；空值为完整名录，talent / regular 对应分组；静态生成及 Django 路由和标签均读该声明 |
| previewBreadcrumbs | 可选的静态预览面包屑投影，page/detail 各自引用 id 和显示 label；保持 main 的展示顺序，包括通知静态页现有的重复父项，不改变 parentId 或动态页面的 parents |

构建产出的 `backend/content-catalog.json` 是现有 Django 的本地适配输入，不是公开网络接口。`backend/content/presentation.py` 读取同一份路由来提供标题、当前顶层栏目与面包屑；固定页面白名单也从目录投影。文章和教师详情仍受原有发布/撤下逻辑控制，不因存在静态占位而公开。

## 展示组件和具名槽位

`src/templates/components` 的教师卡、栏目卡、轮播及图片反馈由静态和 Django 生成器共用。模板字段接收已经转义的文本，只有调用方明确构造的组件 HTML 可以作为结构插入。浏览器模块读取真实链接、DOM 和 data 属性，不读取数据库模型或发起业务写请求。

| 组件 | 输入 |
|---|---|
| teacher-card | href、title、subtitle、summary、image（已经渲染的图片组件或空字符串） |
| collection-card | href、title、summary、meta、action、image |
| faculty-section | id、title、description、display、cards；有可见教师或类别 showWhenEmpty=true 时渲染，空时显示整理中提示；显式禁用类别始终隐藏 |
| overview-block | anchor、key、mutedClass、side、watermark、title、action、body、photo、related；学院概况静态/动态共用，文字与图片分栏，无图空态按内容高度排版 |
| faculty-person | href、title、display、image、subtitle、summary；portrait/compact/names 三档，仅列姓名时不输出图像 |
| media | src、alt、width、height、loading、共享状态组件；一幅图片对应一个 data-media 容器 |
| slide | 标题、眉题、正文、图注、视觉内容、序号、总数和可见状态 |
| error-body | heading、message、homeUrl、sitemapUrl；静态404与动态错误页共用正文，HTTP状态由服务器决定 |

固定内容使用 `components.slot(name, preview, django)` 注册。构建只替换明确的槽位标记，名称重复或未注册即失败；改占位正文、换行或页脚排版不影响数据绑定。头尾的 logo、logoAlt、motto、college、english、wechat、filing 均是显式参数。`scripts/adapters/django.js` 负责生成现有模板标签，未来适配器可以复用同一组件结构。

静态文本使用 `escape`；Django 表达式沿用自动转义，正文仍经 `content_paragraphs` 按空行和 `## ` 标题渲染，不接收不可信 HTML。外部图片/链接的发布校验归后端适配器；当前仅使用已有素材选择和发布快照，未增加公共写入 API。

## 缺省和空值

本轮不新增迁移或更改发布状态机。普通无内容显示栏目用途介绍及“相关内容正在整理中”；国家级领军人才、国家级青年人才空时保留标题及介绍提示，其余空人才分类整块隐藏；公众号缺图保留虚线占位，官网缺图不显示卡片；教师撤下不展示。空态文案从 `src/data/empty-content.json` 按稳定 key 读取，经共享 `empty-state.html` 输出；Django 通过构建目录的 emptyContent 与 empty_content 标签读取同一配置，有发布内容时自动替换，不新增业务条目。旧 Django 轮播 `is_visible=false` 仍回退默认；站点部分空字符串仍回退默认。后两项是已有能力限制，不能描述为支持主动清空或真正隐藏轮播。将来改变这些语义，需要适配器与内容维护流程一起升级。

用户追加确认的静态审核例外：新闻、通知、媒体掠影在没有业务输入时，从独立preview-content模块取得【演示】条目，之后显示整理中提示；存在输入（包括草稿或撤下）时不回填演示。演示详情不进入业务路由目录、seed或实际数据库，动态页面始终读取平台发布数据。

教师分类来自 `src/data/faculty-categories.json`；前端 `faculty-memberships.json` 表达一人多称号及各自年份，`scripts/lib/faculty.js` 负责筛选、排序和首页去重。当前旧 Django 表单仍只支持一个 teacher_category，不宣称已支持维护多个称号。未分类仍保留完整名录入口。站点网站二维码与公众号二维码独立；管理机构旧领导插槽保留兼容。新增字段及路由详见[会议调整与字段交接](../docs/会议调整与字段交接_20261015.md)。

全站可维护输入、字段结构和旧地址对照统一见 [CONTENT-MAINTENANCE.md](CONTENT-MAINTENANCE.md)。首页文案与图片移入 home.js，集合及单篇资料输入在 entries.js；模板不包含虚构业务条目。

## 资源与适配边界

CSS 在 `src/css/components` 按组件维护，`style.css` 保留明确的层叠顺序，构建后仍是一份样式文件。脚本和样式引用带内容哈希版本；字体本身使用内容哈希文件名。`frontend/build-manifest.json` 记录输入/产物和资源哈希，只删除上次清单拥有且没有被手改的过期产物，未知文件和被手改的过期文件予以保留。

悬停/焦点的共享放大规则位于link-interactions.css，保留main的比例与时长。科研卡片的topic-destination负责整块文字区命中，内部topic-label单独缩放，不能把transform施加在定义命中范围的父元素上。导航和页脚使用main原有反馈；触屏不依赖hover，减少动态时只保留颜色/下划线。

Django 仅为现有预览适配器；未来后端及博达分别实现数据读取和模板渲染，不必沿用 ContentEntry 或 Publication。未确定学校字段、组件语法和认证方式前，不编造 HTTP 地址、REST API 或 JSP 插件。博达待办见 [学校前端适配说明](BODA-HANDOFF.md)。
