# 河南大学集成电路与微纳电子学院网站开发预览

正式官网优先接入学校博达站群。本仓库为团队开发预览，Django 数据不会自动同步到学校平台。

### SWE模型是傻逼！千万别用
## 开发与交接入口

- 公网预览：<http://47.94.146.53:8099/>。
- 当前分支、前端重构进度、部署版本和验收证据统一见 [STATUS.md](STATUS.md)，本地改动不自动部署到服务器。
- 前端构建与统一检查见 [frontend/README.md](frontend/README.md)，可替换后端的展示边界见 [frontend/CONTRACTS.md](frontend/CONTRACTS.md)。
- 已实现前端版式、新闻通知审核发布、教师/栏目/轮播/站点资料发布快照、分页及栏目详情。最新修复使新闻通知和审核页正确显示 `## ` 小标题。
- 交接目标是队友继续开发完善，不是正式上线验收完成。安全专项测试、多人权限人工验证交给队友；真机、阅读模式、真实业务库恢复等仍待验证。

先读 [STATUS.md](STATUS.md)：项目状态、后台能改什么、待办缺口与验收证据都在那里。

注意：主要正文可后台编辑，不等于所有占位均已后台化；首页部分文案/图片、固定教师空位和轮播启停是明确待补项，见 [STATUS.md 第三节](STATUS.md)。

## 工程目录

| 目录 | 用途 |
|---|---|
| frontend/src | 前端源码、默认内容及正式运行素材源文件 |
| frontend/preview | 构建结果；静态占位预览与 Django 共用的 CSS/JS/assets |
| frontend/scripts、frontend/qa、frontend/licenses | 构建检查、验收证据、字体与素材许可证 |
| backend | Django 模型、后台、模板、迁移、测试与依赖锁定文件 |
| deployment | 打包、服务配置模板、备份与运行资源检查 |
| docs | 交付资料、素材来源、历史记录和对外材料 |
| sandbox | 隔离环境、数据库、凭据、日志、部署包等本地产物；Git 忽略 |

## 开始开发

构建只使用 Node 内置模块，不需要 npm install。在仓库根目录执行：

```powershell
node frontend/scripts/build-site.js
python -m http.server 8766 --bind 127.0.0.1 --directory frontend/preview
```

第二条命令仅启动静态版式预览，不读取后台正文。需要查看发布数据、分页与动态详情时使用 Django，详见 [后台说明](backend/README.md)。本机已存在 `C:/Develop/NodeJS/node.exe` 与 `sandbox/.venv/Scripts/python.exe`，PATH 不包含它们时使用完整路径；不要求队友采用相同安装目录。

## 当前资料入口

| 文档 | 用途 |
|---|---|
| [STATUS.md](STATUS.md) | 项目状态、后台能力、待办缺口、验收证据、栏目树、关键操作 |
| [DESIGN.md](DESIGN.md) | 按现有实现反向更新的栏目和交互设计 |
| [前端](frontend/README.md) / [后台](backend/README.md) / [部署](deployment/README.md) | 开发者操作入口 |

## 内容与协作边界

三位真实教师按程纲、张锦龙、郑海务展示；当前预览保留完整公开资料，正式展示范围、联系方式和素材权属仍需学院与本人确认。已有 `news-111` 和演示内容不得被初始化脚本覆盖。

学校后台、搜索、统一认证、正式英文版及博达组件绑定尚未对接，不提供不存在的 API。当前公网入口是 HTTP 开发预览，不等于正式域名已启用 HTTPS 或已完成合规验收。

协作约定：不提交数据库、凭据、环境、日志、上传及部署包；提交前同步远端；本轮不操作其他站点或代理。Python 使用隔离环境；Anaconda 不向 base 安装项目依赖。

对外材料仍放 [docs/发给老师](docs/发给老师/)，不修改用户既有 Word。旧设计与 README 原稿保存在 [整理前历史版本](docs/归档不再看/历史版本/交付整理前_20261012/)，其中旧状态和相对链接仅用于追溯。

根目录 AGENTS.md 是个人本地指令，不纳入 Git；项目状态与团队共享说明统一以 [STATUS.md](STATUS.md) 为准。
