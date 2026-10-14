# 前端开发入口

线上版式为 release 20261012.8（2026-10-14 核对公网仍是该版本，此后未再部署；仓库当前实现已领先于线上）。见[根说明](../README.md)、[当前设计](../DESIGN.md)及[项目状态](../STATUS.md)。早期 README 已保留到 docs/归档不再看/历史版本/交付整理前_20261012/。

## 修改位置

| 修改项 | 源文件 |
|---|---|
| 颜色、字体、留白、响应式 | src/css/style.css、src/css/fonts.css |
| 栏目、导航、默认教师与站点资料 | src/data/site.js |
| 21 个集合定义、分区英文、列表样式 | src/data/collections.js |
| 首页五个内容区 | src/content/home.html |
| 公共头尾、资源版本号 | src/templates/partials、src/templates/document.html |
| 菜单、轮播、吸附和装饰动效 | src/js/main.js |
| 页头、页面过渡、图片反馈、滚动归位 | src/js/header-motion.js、page-transition.js、media-loading.js、scroll-reset.js |
| 构建与原创芯片 SVG | scripts/build-site.js、scripts/build-chip-art.js |
| 运行素材 | src/assets；来源记录放 docs/assets 或 docs/内部资料 |

## 构建和查看

在仓库根目录执行 `node frontend/scripts/build-site.js`，生成 73 个静态预览页面（含 `404.html`）、backend/templates/site/generated、content-catalog.json 等配套文件。`404.html` 不进路由目录，故不出现在站点地图与栏目清单里；后台 404 走 `backend/templates/site/error.html`。静态预览里的新闻和栏目条目是占位；后台发布不回写这些 HTML。

运行 `python -m http.server 8766 --bind 127.0.0.1 --directory frontend/preview`，打开 <http://127.0.0.1:8766/>。不要直接修改 preview 或 generated；手写 Django 模板应在 backend/templates/site 的非 generated 文件中改。

修改布局时兼顾静态输出和动态模板；尤其 collection_preview.html、overview_content_block.html、entry_body.html 等来自运行时数据。

## 字体和素材

标题区域（`.brand-motto`、`.editorial-heading h2`、`.feature-intro`、`.footer-campus p`）统一使用自托管「新愚公装甲宋A」子集，CSS 族名 `IC ZhuangSong`，由 `--font-display` 引用。全部字形随站分发，不依赖访客本机字体，跨系统渲染一致；正文和导航沿用系统无衬线。字体衍自思源宋体（SIL OFL 1.1，保留字体名 `Source`），授权全文见 `licenses/XinYuGongZhangJiaSongA-OFL.txt`。

固定标题子集当前覆盖 104 字符、约 36 KB，母版是 `docs/assets/fonts/新愚公装甲宋A.ttf`（18 MB，不入运行目录）。改标题或校训后：先 `node frontend/scripts/build-site.js`，再 `python frontend/scripts/prepare-fonts.py`，再构建一次。`--check` 离线核对母版 sha256、子集 sha256 与字符覆盖。子集化需要本机 `fontTools`（`pyftsubset`），脚本不联网也不自动安装。不要将商业系统字体复制入库。

新图片放 src/assets 后构建；教师和站点的后台图片选项扫描运行版 assets 的 jpg/jpeg/png/webp。新闻通知配图是 models.py 中的固定白名单，增加选项需同步模型并生成必要迁移。没有上传入口。

## 验证

常用：check-preview.py、check-current-structure.py、prepare-fonts.py --check、check-navigation-fixes.cjs、check-overview-typography.cjs。浏览器脚本使用已有 Playwright/Edge，设置 IC_TEST_MODULES 为实际 node_modules 路径；所有命令从仓库根目录执行。

check-carousel.cjs、check-navigation-scroll.cjs 含早期暂停按钮等旧断言，作为历史脚本保留，不直接作为当前版验收门槛。check-experience.cjs 同样归入历史脚本（它硬编码了旧页头高度 184/112，现值 171/45），其覆盖内容已由 check-current-design.cjs、check-navigation-fixes.cjs、check-overview-typography.cjs 分担，见 [STATUS.md 3.2 节](../STATUS.md)的过期断言说明。实际已运行项及待办以交接验收记录为准。
