# 学院网站开发预览后台

这是已确认的 Django 5.2 LTS＋SQLite 预览工具。正式新闻仍由学校博达站群维护，两个系统不自动同步。

2026-10-12 更新：本项目已在服务器 47.94.146.53 的隔离目录 `/srv/ic-college` 真实运行，私有服务
`ic-preview.service` 监听 `127.0.0.1:8095`，依赖装在该项目 venv，25 项测试全部通过，新闻与通知各自的
「登录→新增→草稿→提交→审核→前台展示→改草稿前台不变→再批准更新→撤下」闭环已实测通过。
真实路径、命令与未验收项见[服务器私有部署验收记录](../docs/内部资料/服务器私有部署验收记录.md)。
下面的本地沙盒步骤仍然有效，用于本机二次开发；服务器上请用 `/srv/ic-college/venv`。

2026-10-12 第二轮：公网只读前台已开放。`ic-public-preview.service`（`PUBLIC_ONLY=1`，仅监听
`127.0.0.1:8096`）经 nginx 8099 端口对外提供 **http://47.94.146.53:8099/**；
该实例拒绝所有后台路径与写请求，只读、不落草稿。管理后台仍只在 `127.0.0.1:8095`，
经 SSH 隧道访问。详见[服务器公网前台部署验收记录](../docs/内部资料/服务器公网前台部署验收记录.md)。

## 运行范围

- 新闻、通知新增和修改；已有栏目、教师与轮播继续在前端源码中维护。
- 内容编辑：保存草稿、勾选提交审核。审核员：查看完整草稿，批准预览、退回或撤下。
- 前台首页、列表、详情只读取批准快照；修改草稿不影响旧快照，撤下后旧详情返回404。
- 编辑与审核都检查版本号，旧表单不会覆盖其他窗口的新修改。
- 正文使用纯文本、空行分段；不接受 HTML 执行，不提供上传入口。图片从已归档素材中选取。
- 后台中文，入口 `/preview-admin/`；仅回环地址或 SSH 隧道可访问。
- 账号至少12位口令；五次登录失败锁定来源15分钟。初始化账号为随机长口令，仅写入被 Git 忽略的 `sandbox/access.txt`。

## 首次安装与启动

在仓库根目录运行，所有依赖只安装到本仓库：

```powershell
python -m venv sandbox/.venv
$env:PYTHONUTF8='1'
$env:TEMP=(Resolve-Path sandbox/tmp).Path
$env:TMP=$env:TEMP
sandbox/.venv/Scripts/python.exe -m pip install --cache-dir sandbox/pip-cache -r backend/requirements.txt
sandbox/.venv/Scripts/python.exe -m pip freeze | Set-Content -Encoding utf8 backend/requirements.lock
node frontend/scripts/build-site.js
powershell -NoProfile -File backend/start-local.ps1
```

已有 `.venv` 不必重建。安装成功后保留实际解析的 `requirements.lock`，服务器使用同一锁定版本。新依赖应在此环境测试后再升级。

2026-10-12接续发现旧pip在Windows默认GBK下不能解析含中文注释的requirements.txt，已增加UTF-8声明并验证旧pip解码成功；启动脚本同步启用Python UTF-8。

2026-10-12 服务器安装结果：该项目依赖已在 `/srv/ic-college/venv` 实际安装，实际解析版本写入
`requirements.lock`（Django 5.2.18、whitenoise 6.12.0、waitress 3.0.2、django-axes 8.3.1、
asgiref 3.12.1、sqlparse 0.6.0、typing_extensions 4.16.0）。服务器 `python3 -m venv` 原先因缺
`ensurepip` 失败，已按用户确认只新增 `python3.10-venv` 等三个纯数据包修复，未升级系统 Python。

前台：`http://127.0.0.1:8095/`；后台：`http://127.0.0.1:8095/preview-admin/`。前端纯静态版本仍可直接打开 `frontend/preview/index.html`，但静态文件不读取 SQLite；后台编辑后应通过8095查看。

首次管理员兼具编辑与审核能力，便于一人演示。多人使用时在 Django 用户管理创建普通 staff 账号，分别加入“内容编辑”或“预览审核员”；不要给普通编辑超级用户权限。学校账号不在这里使用。

## 一条完整演示

1. 登录后台，打开“新闻与通知草稿”，新增一条标题，地址标识填写 `news-demo-20261012`。
2. 填摘要与正文，保留“示例内容”勾选，勾选“保存后提交审核”，保存。
3. 打开“查看草稿并审核”，核对内容，选择“批准到开发预览”，确认操作。
4. 访问首页、新闻列表和详情，确认标题与正文一致。
5. 修改并只保存草稿，前台应继续显示旧版；重新提交审核批准后才显示新版。
6. 审核页选择“撤下前台预览”，列表移除，详情404。该操作保留草稿和日志，可再次提交恢复。

## 检查命令

```powershell
sandbox/.venv/Scripts/python.exe backend/manage.py check
sandbox/.venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run
sandbox/.venv/Scripts/python.exe backend/manage.py test content --verbosity 2
python deployment/test_backup.py
python frontend/scripts/check-preview.py
```

`content/tests.py`覆盖后台真实表单、审核和撤下、快照隔离、权限、CSRF、XSS、路径访问、登录限制和版本冲突。浏览器尺寸与交互检查在 `frontend/scripts/check-*.cjs`，需已有 Playwright/Edge。当前哪些命令实际执行通过，见验收记录，不能仅凭测试文件存在宣称通过。

## 维护

- 前端页面、数据和样式在 `frontend/src/`；构建同时生成22个静态页面和 Django 外框，不直接修改 generated 目录。
- SQLite 默认 `sandbox/data/ic-preview.sqlite3`。迁移纳入 Git，数据库、会话、口令和备份不纳入 Git。
- 正文 HTML 被当作文字输出；若以后增加富文本或上传，按安全设计完成净化、文件验证和权限检查后再开放。
- 管理员丢失口令时，通过本机 `manage.py changepassword preview-admin` 重设；不要将口令写进命令参数或聊天。
- `PUBLIC_ONLY=1` 的独立实例拒绝所有后台路径和写请求，必须与私有管理实例分离。部署步骤见 [隔离部署](../deployment/README.md)。
