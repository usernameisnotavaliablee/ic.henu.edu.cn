# 前端基础版与队友交接

本轮最新状态：原栏目与多级导航保留，师生园地归人才培养；30页已生成，三位教师恢复完整资料，程纲首位，增加师资空位与父级面包屑。滚动页头与跨页过渡均已实现，需浏览器视觉验收。页脚三组抽屉、公众号区域，工作室徽标＋文字与版权备案同行。服务端新增32个栏目/轮播位置、教师和站点配置后台接口，迁移0002待执行，图片从已归档assets选择（无上传）。静态HTML仅展示默认资料，后台发布需通过Django运行版查看。新版尚未部署；详见[进度与计划](../docs/内部资料/当前开发进度与计划_20261012.md)与[Claude交接](../docs/内部资料/ClaudeCode本轮部署与后台演示交接.md)。

当前入口：[打开首页](preview/index.html)。可直接双击 HTML 查看，不需要安装依赖。此工作区新版尚未部署；上次20261012.2已由Claude Code部署公网，学校正式后台仍未接通。最新进度与阻塞见 [MVP验收记录](../docs/内部资料/MVP验收记录.md)。

芯片现为原创俯视2D：四面48个引脚与48条成组走线，按用户“不要太对称”的反馈错开各组长度、拐点和终点，内部模块采用非对称布局。8条信号路径错峰出现少量双向光点，16秒周期中每条仅约3.5秒显现，光晕8秒呼吸；不加入视频。首页、科研区、新闻示意图与内页横幅已统一。静态构图已检查，见 [芯片静态图](qa/chip-art-2d.png)；完整浏览器动效与手机裁切验收仍未完成。GitHub参考及许可见 [芯片动效选型](../docs/内部资料/芯片动效选型.md)。

已做：校院标识行、独立通栏导航、六张 Banner 轮播、新闻/通知/科研/培养/师资五个纵向板块及普通内页。共30页，其中静态新闻与通知为明确占位，三位教师仅展示公开个人简介待本人确认。新闻左侧列表与右侧大图联动；五个板块滚动进入视口后上浮、渐显并放大，链接悬停有放大与下划线提示。芯片为原创概念图，内容以学院审定版本替换。

## 队友改哪里

| 要改的东西 | 文件 |
|---|---|
| 配色、字体、间距、手机布局 | [src/css/style.css](src/css/style.css) |
| 导航、Banner、文案、教师、联系方式 | [src/data/site.js](src/data/site.js) |
| 首页区块顺序与结构 | [src/content/home.html](src/content/home.html) |
| 顶栏、整栏导航、页脚 | [src/templates/partials](src/templates/partials/) |
| 普通栏目与详情公共外框 | [src/templates/page.html](src/templates/page.html) |
| 多级菜单与轮播 | [src/js/main.js](src/js/main.js) |
| 页头逐帧动画 | [src/js/header-motion.js](src/js/header-motion.js) |
| 图片加载反馈 | [src/js/media-loading.js](src/js/media-loading.js) |
| 统一芯片SVG与动效构图 | [scripts/build-chip-art.js](scripts/build-chip-art.js)；流动与暂停在style.css/main.js |
| 图片、芯片示意 | [src/assets](src/assets/) |

修改 src 后，在本目录运行：

```powershell
& 'C:/Develop/NodeJS/node.exe' scripts/build-site.js
```

脚本只使用 Node 内置模块，输出至 preview/。不要直接改 preview/，再次构建会覆盖同名生成文件。删除栏目时，同时手动核对旧生成页面；构建脚本不会清空整个目录。已有素材的网页副本由 scripts/prepare-assets.py 使用本机现有 Pillow 生成，不覆盖原图。

## 低空代码实际参考了什么

原始相关文件已解压到 [参考源码/低空学院](../docs/内部资料/参考源码/低空学院/)，[清单](../docs/内部资料/参考源码/低空源码解压清单.json)记录32个文件的路径和SHA256，包括本轮补充的3张校园素材。没有解压整套便携编辑器和全量媒体，也没有执行原包程序。

| 低空原文件 | 本版用法 |
|---|---|
| scripts/build-site.js | 复用 render 模板替换函数；沿用 data/templates/content 分离，改为构建时生成头尾 |
| src/templates/partials/header.html、footer.html | 参考头尾分层，重写IC标识与通栏导航，不沿用右侧挤排的大菜单 |
| src/data/site.js | 参考科学与创新、人才培养、师资、公共服务、概况、招聘、联系等栏目 |
| src/js/main.js | 参考移动菜单开合模式；补充 Escape、焦点处理和尺寸切换 |
| scripts/build-boda-site.js、BODA_CMS_COMPONENT_TEMPLATES.md | 保留 home-news、home-notices、news-list、notice-list 插入位；未知学校ID为null |

这不是原工程直接改名。当前IC样式、图片轮播和具体页面布局新写；博达插入位只用于后续接入，当前没有生成经过学校验证的JSP发布包。原包中未见可直接使用的学校REST/统一认证实现，不自行伪造接口。

## 素材与发布边界

- 校徽和校园牌坊图来自低空参考包；牌坊图只有720×406，正式版换经确认的高清素材，不当作学院楼宇照片。
- 当前共6张轮播图：芯片概念、校园牌坊、校园风光/庭院/楼宇及晶圆近景。校园图均来自低空参考包，仅作内部占位，不认定为本学院楼宇；正式素材与使用权限待学院审核。当前不再加载旧Canvas。SVG由本项目绘制，光流机制参考Magic UI；MIT许可归档于licenses/。
- 轮播每3秒切换，以0.65秒横向滑动提示换图。下一张向左、上一张向右，圆点按跳转方向滑动；快速连续点击会收齐前一段动画。鼠标悬停和按钮保留焦点均不阻止自动播放；系统减少动态效果、页面隐藏或当前图片仍在加载时停止计时，恢复后重新等待3秒。
- 两个暂停按钮按用户要求移除。系统减少动态效果时不自动换图，支持手动切换；装饰动画停止，正文直接可见。
- 五个首页板块进入视口后首次浮现：整块上移72px、从94%放大至100%、渐显1.35秒、位移1.6秒，标题与内容错峰0.18秒。无脚本、暂停动效和减少动态效果时正文直接可见。可点击标题悬停约放大5.5%，普通链接约4%，键盘焦点也有提示。
- 三位教师照片使用已归档资料的压缩副本，展示名单、照片与简历待学院确认，按本轮要求仅展示个人简介，完整底稿仍保留，均待核对。
- 搜索、学校后台登录、英文版暂不展示无效按钮；配置保留，接通后再开放。
- 正式新闻维护交学校博达站群；Django、SQLite预览工具代码见 [后台说明](../backend/README.md)，该工具此前已由Claude Code部署服务器；本机未安装Django，纯静态前端不依赖该工具。
- 内部预览带 noindex 和 robots 禁止索引。这些不是访问控制；如需公网审阅，应另配访问限制，不能直接当正式官网发布。

## 历史检查（本轮结果见上方最新进度）

2026-10-12接续：Node语法和22页构建通过，1169处本地资源、链接与片段检查通过。独立Edge回归启动即发生Crashpad管道错误，尚未进入断言；IAB读到新版首页结构，后续验收接口被审批503拦住。历史qa/carousel-check.json和experience-check.json不代表本轮新版验收；旧experience检查停在首页刷新归零失败。全尺寸、手机真机、后台切换和视觉最终验收仍待补。

```powershell
python scripts/check-preview.py
```

交互脚本使用已有Playwright和Edge。先将preview以HTTP绑定127.0.0.1:8765，再设置IC_TEST_MODULES指向已有node_modules；临时浏览器资料设置到本仓库sandbox/tmp。check-carousel.cjs验证3秒换图、暂停恢复与浮现；check-experience.cjs验证收缩导航、吸附、快滚、刷新与响应式。

后台首页与文章页的外框同样由build-site.js生成到backend/templates/site/generated。新闻数据由SQLite批准快照渲染；src/data/site.js保留静态占位演示及首次种子，不会覆盖数据库中的编辑内容。

## 本轮验证入口

构建后运行 `python scripts/check-current-structure.py`、`python scripts/check-preview.py`、`node scripts/check-header-motion.cjs`、`node scripts/check-media-loading.cjs`。这些是离线检查。

真实浏览器新入口为 `scripts/check-current-design.cjs`，使用已有Playwright/Edge，支持传入预览URL；本轮未运行成功。旧check-carousel/check-experience/check-navigation-scroll依赖已删除的暂停按钮，保留为历史脚本，不用它们的报告证明新版通过。
