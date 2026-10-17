# Django 预览后台

Django 5.2 + SQLite + Waitress。正式官网仍由学校博达站群发布，两个系统不自动同步。

当前运行边界、版本和部署证据见[根说明](../../../README.md)与[项目状态](../../../STATUS.md)。主[接口交接文档](../../../后端交付文档_博达接入与预览部署.md)同时列出现有新闻发布等真实地址和从零重建所需A节读取/B节管理契约；拟定JSON地址尚未实现。维护现有Django的更多细节见[现有预览接口说明](../../../后端交付文档_博达接入与预览部署.md)。

## 功能

- 新闻通知：草稿 → 提交审核 → 批准快照 → 前台；修改草稿不影响旧快照；撤下后详情 404。支持分页、纯文本小标题和版本冲突检查。
- 教师、栏目条目、研究方向/课题组、轮播、站点资料：编辑草稿后执行发布动作。教师/集合条目可发布撤下设置；轮播关闭后回退默认内容，不能真正隐藏；固定区块可能保留待更新提示。与新闻审核状态机不同。

“所有占位后台可改”尚未全部实现，完整缺口见 [项目状态第三节](../../../STATUS.md)。本轮仅展示适配：多称号/年份的前端模型已就绪，旧后台仍是单选分类；统一制度读取兼容旧归属，不批量移动记录；没有新增数据库结构或迁移。静态【演示】新闻不会自动写入或回填动态业务列表。
- 师资分类、仪器服务入口及官网二维码使用现有 ContentEntry 保存与发布快照；分类定义与栏目定义均来自构建目录，详见[会议字段交接](../../../docs/会议调整与字段交接_20261015.md)。
- 图片与二维码选择已有运行素材，无上传、富文本、公开写入 API 或学校统一认证。
- 正文空行分段，`## ` 小标题独占一段；HTML 作为文字转义。
- 404 与 CSRF 403：`config/urls.py` 的 `handler404` → `content/views.py` 的 `not_found`，以及 `csrf_failure`，都渲染 `templates/site/error.html`（`page_heading` / `page_english` / `error_heading` / `message`）。正文与静态 `frontend/preview/404.html` 共用前端 error-body 组件，由 `build-site.js` 生成；后台边界中间件的拒绝响应仍是简单文本。

## 运行已有本地开发库

在仓库根目录、使用已安装依赖的隔离环境执行。**Windows 用 PowerShell，macOS/Linux 用下面的 bash 等价命令**；解释器路径按各自环境的实际位置替换，不要求两人一致。

```powershell
$env:PYTHONUTF8='1'
$env:IC_DATA_DIR=(Resolve-Path sandbox/data).Path
$env:IC_ALLOWED_HOSTS='127.0.0.1,localhost,[::1]'
$env:IC_PUBLIC_ONLY='0'
$env:IC_HTTPS='0'
$env:IC_PORT='8095'
sandbox/.venv/Scripts/python.exe backend/manage.py check
sandbox/.venv/Scripts/python.exe backend/serve.py
```

```bash
export PYTHONUTF8=1
export IC_DATA_DIR="$PWD/sandbox/data"
export IC_ALLOWED_HOSTS='127.0.0.1,localhost,[::1]'
export IC_PUBLIC_ONLY=0
export IC_HTTPS=0
export IC_PORT=8095
python3 backend/manage.py check
python3 backend/serve.py
```

要求该库已有密钥、迁移和账号；启动前确认 8095 没有被 SSH 隧道占用。正常启动不运行 seed/bootstrap。迁移更新先备份，再执行 `backend/manage.py migrate --noinput`；部署同步前端构建输出。

此机器部分依赖现存于 `sandbox/test-deps`，复用时设置 `$env:PYTHONPATH=(Resolve-Path sandbox/test-deps).Path`（bash 用 `export PYTHONPATH="$PWD/sandbox/test-deps"`）。这是 Windows 那台机器的环境布局，不要求队友复制。新机器应在自己的隔离环境安装 `backend/requirements.lock`，不要改全局 Python 或 Anaconda base。

## 全新空白开发环境

先确认目标为自己的空目录，例如 sandbox/dev-data，不指向线上库或已有录入库。创建隔离环境、安装锁定依赖、构建前端后，设置 IC_DATA_DIR 到该绝对路径，执行：

```powershell
sandbox/.venv/Scripts/python.exe backend/prepare_local.py
sandbox/.venv/Scripts/python.exe backend/manage.py migrate --noinput
sandbox/.venv/Scripts/python.exe backend/manage.py createsuperuser
sandbox/.venv/Scripts/python.exe backend/manage.py collectstatic --noinput
sandbox/.venv/Scripts/python.exe backend/serve.py
```

```bash
python3 backend/prepare_local.py
python3 backend/manage.py migrate --noinput
python3 backend/manage.py createsuperuser
python3 backend/manage.py collectstatic --noinput
python3 backend/serve.py
```

账号由交互输入，不写在命令参数、聊天或 Git 中。业务示例通过后台网页录入。现有 start-local.ps1 会调用 bootstrap_preview 并建立占位数据，因此不作为已有业务库或本轮交接的启动入口。

## 后台操作与权限

入口 `/preview-admin/`。新闻审核动作需要 `content.review_article`；教师/栏目/站点发布动作需要 `content.publish_contententry`，另需相应模型查看和编辑权限。两者不能混为一项权限。

首次演示的超级用户不是多人分权验收。旧 bootstrap 中的“内容编辑”和“预览审核员”组只配置新闻相关权限，不自动覆盖 ContentEntry。队友需用隔离账号验证实际角色配置；详见维护手册与交接验收表。

## 检查

```powershell
sandbox/.venv/Scripts/python.exe backend/manage.py check
sandbox/.venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run
sandbox/.venv/Scripts/python.exe backend/manage.py test content --noinput
```

```bash
python3 backend/manage.py check
python3 backend/manage.py makemigrations --check --dry-run
python3 backend/manage.py test content --noinput
```

测试创建隔离测试库，不向正常业务库录入示例。当前测试数量与结果见 STATUS；已有转义、权限等测试不是专项安全测试结论。已提供的部署回执只确认 0001—0005；当前候选新增主线 0006（芯片图片列改 JPG）及 0007（修复 ContentEntry 已发布 JSON 内的旧芯片图片引用）。0007 不重新发布草稿，不改变正文、可见状态、日期或更新时间；另有 0008，新增师资分类、服务 URL/名称和网站二维码四个可空字段，不写入材料。0006—0008 均仅在隔离库验证，尚未应用于现有业务库。部署前仍须备份，不能沿用 0005 的 no-op 回退假设。
