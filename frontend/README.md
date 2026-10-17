# 前端开发入口

当前开发、重构分支与部署证据统一见[项目状态](../STATUS.md)。设计见[当前设计](../DESIGN.md)，展示接口见[前端契约](CONTRACTS.md)。早期 README 已保留到 docs/归档不再看/历史版本/交付整理前_20261012/。

完整后端交付、Django 预览和博达接入见根目录[后端交付文档](../后端交付文档_博达接入与预览部署.md)，不要只交 `src` 目录。审核样例统一在[examples](examples/README.md)，不再依赖某台电脑sandbox中的绝对路径；正式静态成品仍在preview。

只交前端、后端从零开发时，读根目录[后端交付文档](../后端交付文档_博达接入与预览部署.md)：含前端字段、新闻发布、博达配置、后台管理和联调契约。`frontend` 本身没有独立管理后台；历史 API/Django 细节见[归档目录](../docs/归档不再看/后端交付旧文档/)。

## 修改位置

| 修改项 | 源文件 |
|---|---|
| 颜色、字体、留白、响应式 | src/css/components；style.css 定义编译顺序，fonts.css 是字体生成结果 |
| 悬停/键盘放大反馈 | src/css/components/link-interactions.css；复用主线幅度与时长，科研文字命中区域独立于缩放文字 |
| 栏目、导航、集合、层级、旧地址映射 | src/data/columns.js；site.js/collections.js 兼容导出 |
| 默认教师、轮播与站点资料 | src/data/site.js、src/data/teachers.js |
| 师资分类、称号关系、排序与三档组件 | src/data/faculty-categories.json、faculty-memberships.json；scripts/lib/faculty.js、faculty-renderer.js |
| 首页图文、机构正文、集合条目、友链 | src/data/home.js、overview.js、entries.js、friendly-links.js；详见 CONTENT-MAINTENANCE.md |
| 静态审核新闻/通知/媒体演示 | src/data/preview-content.js；scripts/lib/preview-content.js，仅静态预览使用，不导入业务目录或seed |
| 首页五个内容区 | src/content/home.html |
| 公共头尾、共用卡片与图片 | src/templates/partials、src/templates/components |
| 资源版本号与产物清单 | 构建自动生成，不再手填日期；build-manifest.json |
| Django 展示适配 | scripts/adapters/django.js、backend/content/presentation.py |
| 菜单状态、键盘操作、菜单文字动画 | src/js/navigation.js |
| 友情链接抽屉 | src/css/components/friendly-links.css、src/js/disclosures.js；复用 scripts/lib/content.js 的两组链接渲染，不修改导航控制器 |
| 联系信息与公众号对齐 | src/css/components/contact-page.css；联系页布局集中维护，桌面两列、手机单列 |
| 学院概况图文对齐 | src/css/components/about-page.css、src/templates/components/overview-block.html；静态与Django共享，已有正文图片优先于概览默认图 |
| 栏目标题与区块高度 | src/css/components/overview-collections.css 管理内页自然高度；hero-chip.css 保留首页整屏高度并顶部对齐，标题与查看入口共用 editorial-heading |
| 轮播、吸附和装饰动效 | src/js/main.js |
| 页头、页面过渡、图片反馈 | src/js/header-motion.js、page-transition.js、media-loading.js |
| 构建与芯片 JPG 展示 | scripts/build-site.js、src/assets/chip-banner.jpg；按 main 使用静态图片 |
| 运行素材 | src/assets；来源记录放 docs/assets 或 docs/内部资料 |

## 构建和查看

在仓库根目录执行 `node frontend/scripts/build-site.js`，生成静态预览页面（当前数量见 STATUS）（含 `404.html`）、backend/templates/site/generated、content-catalog.json 等配套文件。`404.html` 不进路由目录，故不出现在站点地图与栏目清单里；后台 404 走 `backend/templates/site/error.html`。本地新闻/通知/媒体先展示明确标注的【演示】条目，再显示整理中提示；其他空栏目保持简洁空态。旧layout地址保留。后台发布不回写这些HTML，不自动采用静态演示数据。

静态服务的 Windows 与 macOS/Linux 成对命令见 [根目录开发入口](../README.md#开始开发)，打开 <http://127.0.0.1:8766/>。不要直接修改 preview 或 generated；手写 Django 模板应在 backend/templates/site 的非 generated 文件中改。

修改布局时兼顾静态输出和动态模板；尤其 collection_preview.html、overview_content_block.html、entry_body.html 等来自运行时数据。

教师卡片、三档人才组件、栏目卡片与图片反馈生成到 Django generated 目录，手写同名模板只转入共享组件。公共头尾和固定内容使用具名槽位，不能重新引入整段 HTML 匹配。构建清理仅限上次 build-manifest.json 记录且未被手改的旧文件；首次生成清单不会擅自接管未知文件。

## 本轮内容接入

见 [内容接入与维护对照](CONTENT-MAINTENANCE.md)：一人多称号、获评年份、首页前三人、旧制度归并、空分类与二维码、所有可更新内容字段。平台新闻和集合仅列已发布输入；独立静态演示不进入业务资料源。现三位教师称号未核准，不自行归类。

空栏目介绍统一维护于 `src/data/empty-content.json`，说明该栏目将展示的内容，不是业务记录或已确认的学院事实；有正式内容后自动替换。共享 `empty-state.html` 同步输出静态与 Django 版式，平台适配时使用同一文案。

改栏目后运行 `node frontend/scripts/update-contract-map.cjs` 更新接口文档中标记的映射表；`--check` 可检查是否漂移。正式录入由平台后台完成，不把开发静态输入文件当日常后台。

## 字体和素材

标题区域（`.editorial-heading h2`、`.feature-intro`、`.footer-motto`）统一使用自托管「新愚公装甲宋A」子集，CSS 族名 `IC ZhuangSong`，由 `--font-display` 引用。全部字形随站分发，不依赖访客本机字体，跨系统渲染一致；正文、导航和顶栏（含 `.brand-motto` 校训）使用微软雅黑优先的系统字体栈，未安装时回退；不分发微软雅黑字体文件。字体衍自思源宋体（SIL OFL 1.1，保留字体名 `Source`），授权全文见 `licenses/XinYuGongZhangJiaSongA-OFL.txt`。

固定标题子集覆盖及大小见 STATUS 与 licenses/zhuangsong-manifest.txt；母版是 `docs/assets/fonts/新愚公装甲宋A.ttf`（18 MB，不入运行目录）。改标题或校训后：先 `node frontend/scripts/build-site.js`，再 `python frontend/scripts/prepare-fonts.py`，再构建一次。`--check` 离线核对母版 sha256、子集 sha256 与字符覆盖。子集化需要本机 `fontTools`（`pyftsubset`），脚本不联网也不自动安装。不要将商业系统字体复制入库。

仅调整字体 CSS 选择器且没有新增字符时，可用 `--style-only`：先验证母版、现有子集、许可证和字符覆盖，再生成 CSS 并更新其哈希；不会重新生成字体，也不会跳过字形校验。

新图片放 src/assets 后构建；教师和站点的后台图片选项扫描运行版 assets 的 jpg/jpeg/png/webp。新闻通知配图是 models.py 中的固定白名单，增加选项需同步模型并生成必要迁移。没有上传入口。

## 验证

统一入口：`node frontend/scripts/check-frontend.cjs`。先显式设置 `IC_PYTHON` 为本机已有 Python（需满足字体检查依赖）、`IC_TEST_MODULES` 为已有 Playwright 所在 node_modules；使用已有 Edge，不安装任何依赖。不要求两人安装目录相同。未配置 `IC_PYTHON` 时仍兼容 sandbox/.venv 的旧默认值，但该环境不保证存在。

以下均在仓库根目录执行；路径示例应替换为本机已有位置。

Windows（PowerShell）：

```powershell
$env:IC_PYTHON = (Resolve-Path sandbox/.venv/Scripts/python.exe).Path
$env:IC_TEST_MODULES = 'C:\已有环境\node_modules'
node frontend/scripts/check-frontend.cjs
# 仅复跑输出隔离检查（已有构建产物即可）
& $env:IC_PYTHON frontend/scripts/check-test-output.py
```

macOS/Linux（zsh/bash）：

```bash
export IC_PYTHON="$(command -v python3)"
export IC_TEST_MODULES='/已有环境/node_modules'
node frontend/scripts/check-frontend.cjs
# 仅复跑输出隔离检查（已有构建产物即可）
"$IC_PYTHON" frontend/scripts/check-test-output.py
```

入口会构建、检查原有 URL/教师完整资料/轮播输入、链接与结构、字体、控制器及输出隔离，以及菜单、页头、响应式和概览浏览器行为。使用自动分配的本地端口，退出后关闭，不读取业务库。

**报告与基线分开：**统一入口的截图和报告默认写入仓库根目录的 sandbox/frontend-checks；`IC_TEST_OUTPUT` 可指定独立目录。结构、页头、媒体加载、页面切换四个离线检查也遵循此规则：变量未设置或为空用上述默认值；显式相对路径以调用时工作目录解析，绝对路径直接使用；自动创建目录，写入失败非零退出，不回退写入 frontend/qa。四个检查从其他目录调用也不会改变默认位置。

`check-test-output.py` 使用标准库、已有 Node 与 Git，已纳入统一入口：覆盖默认/空值、异地调用、带空格的相对/绝对路径、目录不可写入，并核对受跟踪 frontend/qa 文件哈希。它会特意验证默认目录（即使入口设置了自定义输出），其他隔离样本在 sandbox/tmp 内创建并自动清理。历史报告与 refactor-baseline.json 留在 frontend/qa；后者是测试输入，不是缓存。正式验收再人工选取汇总入库，不自动覆盖历史报告。

会议栏目与响应式专项：`node frontend/scripts/check-meeting-design.cjs [站点根URL]`；检查管理机构三级导航、教师分类、工程认证、制度、仪器及二维码。它已纳入统一入口。新字段与后台发布方式见[会议调整与字段交接](../docs/会议调整与字段交接_20261015.md)。

菜单专项：`node frontend/scripts/check-navigation-state.cjs [站点根URL]`；不传URL时检查静态文件，传入自己的隔离 Django 服务地址可核验动态外框。它覆盖快速点击、逐级 Escape、焦点、减少动态效果、屏宽切换、动画降级和脚本不可用时的链接可访问性。模拟浏览器检查不能替代真机验收。

Hover专项：`node frontend/scripts/check-hover.cjs [站点根URL]`。清点所有静态页链接，按共享交互类别测缩放终点/中间帧、键盘焦点、文字区命中、导航页脚例外及触屏/减少动态效果，写出逐页清单与逐帧证据。已纳入统一入口。

有底线/边框的入口只强化已有线条：标题右侧入口、资讯/师资分类、友情链接和管理机构入口设置 `--interaction-underline: none`，hover 与键盘焦点不再叠加文字下划线，缩放与颜色反馈保留。正文、资料来源等普通链接继续使用单条文字下划线。此规则集中在 `link-interactions.css`，新增同类入口应复用对应组件，避免逐页覆盖。

教师卡片悬停：卡片占位固定；姓名、职称、简介和查看入口作为整组文字放大至 1.035 倍，背景与边框同步放大至 1.035 倍，照片连同图框整体放大至 1.04 倍，内层图片不二次缩放。过渡统一为 250ms，不整卡上浮。键盘焦点同样反馈，减少动态时取消缩放；首页与教师名录共享同一卡片。

友情链接专项：`node frontend/scripts/check-disclosures.cjs [站点根URL]`。检查默认收起、开合中间帧、快速反向、键盘焦点、触屏、减少动态及无脚本原生降级，同时核对公众号占位和官网缺图隐藏。默认检查本地联系页；已纳入统一入口。

数据/模板/产物回归：`node frontend/scripts/check-presentation-contracts.cjs`。动态展示：用项目隔离 Python 执行 `frontend/scripts/check-django-presentation.py`；脚本强制新建 sandbox 空数据目录，仅运行迁移、内存展示夹具和原有业务测试，不读取现有录入库、不 seed/bootstrap、不发布演示内容。业务测试（含 0005 升级至 JPG 兼容迁移、师资分类与后台表单保存/发布）使用独立测试库；最新数量见 STATUS。

`check-navigation-fixes.cjs` 和 `check-overview-typography.cjs` 的吸附目标读取当前收缩高度；`check-current-design.cjs` 按队友当前品牌区收起及悬浮按钮设计验收。字体CSS和许可证由 .gitattributes 固定 LF，保持原始字节哈希校验，不忽略校验失败。

退役的轮播、暂停按钮及导航滚动检查集中在[scripts/archive](scripts/archive/README.md)，不纳入统一入口；其原始文件保留，仅供历史查证。当前覆盖由check-current-design.cjs、check-navigation-fixes.cjs、check-overview-typography.cjs、check-header-motion.cjs分担。验收边界与证据统一见[STATUS](../STATUS.md)。
