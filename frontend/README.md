# 前端开发入口

当前开发、重构分支与部署证据统一见[项目状态](../STATUS.md)。设计见[当前设计](../DESIGN.md)，展示接口见[前端契约](CONTRACTS.md)。早期 README 已保留到 docs/归档不再看/历史版本/交付整理前_20261012/。

现有 HTTP 地址、后台字段与更换后端时的数据映射见[后端接口与前端对接文档](../docs/接口文档.md)。

## 修改位置

| 修改项 | 源文件 |
|---|---|
| 颜色、字体、留白、响应式 | src/css/components；style.css 定义编译顺序，fonts.css 是字体生成结果 |
| 栏目、导航、集合、层级、旧地址映射 | src/data/columns.js；site.js/collections.js 兼容导出 |
| 默认教师、轮播与站点资料 | src/data/site.js、src/data/teachers.js |
| 首页五个内容区 | src/content/home.html |
| 公共头尾、共用卡片与图片 | src/templates/partials、src/templates/components |
| 资源版本号与产物清单 | 构建自动生成，不再手填日期；build-manifest.json |
| Django 展示适配 | scripts/adapters/django.js、backend/content/presentation.py |
| 菜单状态、键盘操作、菜单文字动画 | src/js/navigation.js |
| 轮播、吸附和装饰动效 | src/js/main.js |
| 页头、页面过渡、图片反馈 | src/js/header-motion.js、page-transition.js、media-loading.js |
| 构建与原创芯片 SVG | scripts/build-site.js、scripts/build-chip-art.js |
| 运行素材 | src/assets；来源记录放 docs/assets 或 docs/内部资料 |

## 构建和查看

在仓库根目录执行 `node frontend/scripts/build-site.js`，生成 73 个静态预览页面（含 `404.html`）、backend/templates/site/generated、content-catalog.json 等配套文件。`404.html` 不进路由目录，故不出现在站点地图与栏目清单里；后台 404 走 `backend/templates/site/error.html`。静态预览里的新闻和栏目条目是占位；后台发布不回写这些 HTML。

运行 `python -m http.server 8766 --bind 127.0.0.1 --directory frontend/preview`，打开 <http://127.0.0.1:8766/>。不要直接修改 preview 或 generated；手写 Django 模板应在 backend/templates/site 的非 generated 文件中改。

修改布局时兼顾静态输出和动态模板；尤其 collection_preview.html、overview_content_block.html、entry_body.html 等来自运行时数据。

教师卡片、栏目卡片、图片反馈与空位生成到 Django generated 目录，手写同名模板只转入共享组件。公共头尾和固定内容使用具名槽位，不能重新引入整段 HTML 匹配。构建清理仅限上次 build-manifest.json 记录且未被手改的旧文件；首次生成清单不会擅自接管未知文件。

## 字体和素材

标题区域（`.brand-motto`、`.editorial-heading h2`、`.feature-intro`、`.footer-motto`）统一使用自托管「新愚公装甲宋A」子集，CSS 族名 `IC ZhuangSong`，由 `--font-display` 引用。全部字形随站分发，不依赖访客本机字体，跨系统渲染一致；正文和导航沿用系统无衬线。字体衍自思源宋体（SIL OFL 1.1，保留字体名 `Source`），授权全文见 `licenses/XinYuGongZhangJiaSongA-OFL.txt`。

固定标题子集当前覆盖 104 字符、约 36 KB，母版是 `docs/assets/fonts/新愚公装甲宋A.ttf`（18 MB，不入运行目录）。改标题或校训后：先 `node frontend/scripts/build-site.js`，再 `python frontend/scripts/prepare-fonts.py`，再构建一次。`--check` 离线核对母版 sha256、子集 sha256 与字符覆盖。子集化需要本机 `fontTools`（`pyftsubset`），脚本不联网也不自动安装。不要将商业系统字体复制入库。

仅调整字体 CSS 选择器且没有新增字符时，可用 `--style-only`：先验证母版、现有子集、许可证和字符覆盖，再生成 CSS 并更新其哈希；不会重新生成字体，也不会跳过字形校验。

新图片放 src/assets 后构建；教师和站点的后台图片选项扫描运行版 assets 的 jpg/jpeg/png/webp。新闻通知配图是 models.py 中的固定白名单，增加选项需同步模型并生成必要迁移。没有上传入口。

## 验证

统一入口：`node frontend/scripts/check-frontend.cjs`。先设置 `IC_TEST_MODULES` 为已有 Playwright 所在 node_modules；可通过 `IC_PYTHON` 指定项目隔离 Python，默认使用 sandbox/.venv。入口会构建、检查原有 URL/教师完整资料/轮播输入、链接与结构、字体、控制器，以及菜单、页头、响应式和概览浏览器行为。使用自动分配的本地端口，退出后关闭，不读取业务库；不会安装依赖。截图和汇总默认写入 sandbox/frontend-checks，可用 `IC_TEST_OUTPUT` 指定独立目录。

菜单专项：`node frontend/scripts/check-navigation-state.cjs [站点根URL]`；不传URL时检查静态文件，传入自己的隔离 Django 服务地址可核验动态外框。它覆盖快速点击、逐级 Escape、焦点、减少动态效果、屏宽切换、动画降级和脚本不可用时的链接可访问性。模拟浏览器检查不能替代真机验收。

数据/模板/产物回归：`node frontend/scripts/check-presentation-contracts.cjs`。动态展示：用项目隔离 Python 执行 `frontend/scripts/check-django-presentation.py`；脚本强制新建 sandbox 空数据目录，仅运行迁移、内存展示夹具和原有业务测试，不读取现有录入库、不 seed/bootstrap、不发布演示内容。其 46 项业务测试会使用独立测试库。

`check-navigation-fixes.cjs` 和 `check-overview-typography.cjs` 的吸附目标读取当前收缩高度；`check-current-design.cjs` 按队友当前品牌区收起及悬浮按钮设计验收。字体CSS和许可证由 .gitattributes 固定 LF，保持原始字节哈希校验，不忽略校验失败。

check-carousel.cjs、check-experience.cjs、check-navigation-scroll.cjs 含早期暂停按钮等旧断言，作为历史脚本保留，不纳入统一入口。实际已运行项及未完成项以 STATUS 为准；入口通过也不等于已验证后台发布、学校平台、专项安全或公网性能。

**check-experience.cjs、check-carousel.cjs、check-navigation-scroll.cjs 三个已无法运行**，保留作历史参考，不要当验收门槛，也不要试图把它们修绿：它们依赖的 DOM 在 10-12/10-13 就被删了（`[data-pause]`、`[data-motion-toggle]`，以及轮播箭头 `opacity` 旧值 0/1，现为 0.12/0.65）。逐条断点见 [STATUS.md 3.2 节](../STATUS.md)的退役脚本表。其中 check-carousel.cjs 与 check-navigation-scroll.cjs 还把 `127.0.0.1:8765` 写死在代码里、不读命令行参数。当前覆盖由 check-current-design.cjs、check-navigation-fixes.cjs、check-overview-typography.cjs、check-header-motion.cjs 分担。
