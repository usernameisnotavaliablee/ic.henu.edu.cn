# 河南大学集成电路与微纳电子学院 (筹)网站

这是学院网站的前端工程和开发预览。正式网站使用学校博达站群；仓库里的 Django 后台用于本地预览和联调，数据不会自动同步到学校平台。

**看页面：** [首页](frontend/preview/index.html) · [审核与样例入口](frontend/review.html)

**给学长：** [哪些页面需要后台管理](docs/前端页面与后台动态维护对照.md) · [博达接入与部署说明](后端交付文档_博达接入与预览部署.md)

## 做到哪一步了

截至 2026-10-22，已完成的主要工作：

- **页面与交互**：首页、栏目总览、列表、详情、教师介绍和 404；手机菜单、页头收缩、轮播、图片加载反馈及自托管标题字体。
- **前端重构**：统一栏目和旧地址管理，拆分公共模板、样式及导航控制器，集中内容输入，补齐构建和回归检查。
- **会议调整**：管理机构、招生培养、人才分类、课题组、仪器、制度、联系信息和友情链接已按确认方案调整；保留三位教师的完整资料。
- **预览与交接**：已有 Django 新闻审核发布流程；已整理逐页后台维护需求和博达交接说明。此前检查结果及适用版本见 [STATUS.md](STATUS.md)，不等于正式平台已经验收。

**下一步是接博达后台。** 现有导航和版式保持固定，让学院能维护全站业务内容，包括文字、图片、附件、教师、轮播、首页推荐等。正式材料与图片授权、学校审核权限、搜索、真机检查及正式发布仍需落实。

详细进度、提交/部署状态和测试证据统一记在 [STATUS.md](STATUS.md)；这里仅保留阶段概览。Git 推送不会自动部署网站。

## 本地查看和修改

下载完整仓库后，可以直接打开 `frontend/preview/index.html` 查看页面。需要本地 HTTP 预览时，在项目根目录运行以下一种命令：

Windows PowerShell（已有项目隔离环境）：

```powershell
& sandbox/.venv/Scripts/python.exe -m http.server 8766 --bind 127.0.0.1 --directory frontend/preview
```

macOS / Linux（已有 Python）：

```bash
python3 -m http.server 8766 --bind 127.0.0.1 --directory frontend/preview
```

浏览器打开 <http://127.0.0.1:8766/>，结束时按 `Ctrl+C`。解释器路径以本机为准；静态预览不读取后台文章，查看发布数据和动态详情要按[后端交付文档](后端交付文档_博达接入与预览部署.md)启动 Django。

前端修改入口是 `frontend/src`，修改后用下面的命令构建，不需要 `npm install`：

```powershell
node frontend/scripts/build-site.js
```

**当前构建前需先处理署名彩蛋：** 首页、404、联系页、学院概况等生成文件中有直接添加的注释，尚未全部接回源码，重建会覆盖。先把这些改动纳入源码，再构建；只查看现有页面不必构建。后续不直接修改 `preview` 或 Django 的 `generated` 文件。

具体改哪个文件、如何检查响应式和交互，见 [前端开发说明](frontend/README.md)。统一检查入口是 `node frontend/scripts/check-frontend.cjs`，所需已有依赖和环境变量按该说明设置。

## 文档怎么找

| 想做什么 | 看哪份 |
|---|---|
| 让学长知道哪些位置要接后台 | [前端页面与后台动态维护对照](docs/前端页面与后台动态维护对照.md) |
| 接博达、启动预览后台、部署联调 | [后端交付文档](后端交付文档_博达接入与预览部署.md) |
| 查当前进度、待办和验证结果 | [STATUS.md](STATUS.md) |
| 改前端或理解现有设计 | [前端说明](frontend/README.md)、[DESIGN.md](DESIGN.md) |
| 查数据字段及模板要求 | [内容维护对照](frontend/CONTENT-MAINTENANCE.md)、[展示契约](frontend/CONTRACTS.md) |
| 查其他资料和历史文档 | [文档索引](docs/README.md) |

## 目录

| 目录 | 用途 |
|---|---|
| `frontend/src` | 前端源码、默认内容和运行素材 |
| `frontend/preview` | 生成的静态页面和运行资源 |
| `frontend/scripts`、`qa`、`licenses` | 构建检查、验收资料、素材许可 |
| `backend` | Django 预览后台、模板和测试 |
| `deployment` | 打包、部署、备份工具 |
| `docs` | 当前交付文档、素材来源、对外材料和历史归档 |
| `sandbox` | 本地环境、测试数据、日志和交付包，通常不入库 |

完整交付需要源码、构建器、运行文件及许可证，不能只发 `frontend/src`。对外材料放 `docs/发给老师`；历史文件只用于追溯。

## 协作与 Git 工作流

团队主线为 `main`，按现有约定可直接推送；独立工作可另开分支。用 Issues 分任务、Projects 看进度。开始修改前先检查现场和队友更新，以下命令在 PowerShell、bash 中均可用：

```powershell
git status --short --branch
git rev-parse HEAD
git fetch origin
git log --oneline HEAD..origin/main
git log --oneline origin/main..HEAD
git diff HEAD origin/main --stat
```

工作区干净、当前在 `main` 且只落后时，可执行 `git merge --ff-only origin/main`。有未提交修改或分叉时，先核对双方内容再处理；保留队友和本地成果，不强推、不丢弃修改。fetch 失败就说明未取得最新信息。

提交前看 `git status` 和 `git diff --cached`，按文件选择本次内容，避免用 `git add -A` 混入队友工作。提交信息用中文写清改动；同步、提交、推送和部署分别确认实际状态。新进度和验证结果及时更新 `STATUS.md`，不重复维护多份状态。

## 工作方式

沟通先说结论和下一步，按已确认范围推进；方向变化再确认。已确定的学院名称、蓝白设计和博达方案不反复询问。实现以简单、可维护为原则，审批、备案和数据安全按学校要求执行。

## 硬约束

- 学院事实、教师称号、正式名单、联系方式和素材权属须经确认；保留现有教师完整资料，不编造缺失内容。
- 保护已有 `news-111`、业务库和演示数据，不用 seed/bootstrap 初始化脚本覆盖已有库；演示材料不直接当正式内容发布。
- 搜索、统一认证、英文版及平台接口未接通时不展示假功能；统一认证由学校平台提供。
- 新建环境、安装依赖、改变对外访问方式或服务器配置前说明用途并确认；Python 使用隔离环境，不向全局环境安装项目依赖。
- 不提交账号、密钥、实际配置、数据库、上传文件、日志、备份和临时运行产物。用户既有 Word 和低空学院参考原件保持原样。
- `AGENTS.md` 是本机私有指令，不入库；团队协作规则以本 README 为入口，不在个人文件另维护一套。
