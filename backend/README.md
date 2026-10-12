# Django 预览后台

Django 5.2 + SQLite + Waitress。正式官网仍由学校博达站群发布，两个系统不自动同步。

当前运行边界、版本和部署证据见[根说明](../README.md)与[最新回执](../docs/内部资料/ClaudeCode小标题修复部署回执_20261012.md)。功能与接口见[实际接口与数据说明](../docs/内部资料/实际接口与数据说明_20261012.md)。

## 功能

- 新闻通知：草稿 → 提交审核 → 批准快照 → 前台；修改草稿不影响旧快照；撤下后详情 404。支持分页、纯文本小标题和版本冲突检查。
- 教师、栏目条目、研究方向/课题组、轮播、站点资料：编辑草稿后执行发布动作。教师/集合条目可发布撤下设置；轮播关闭后回退默认内容，不能真正隐藏；固定区块可能保留待更新提示。与新闻审核状态机不同。

“所有占位后台可改”尚未全部实现，完整缺口见 [最新统一交付](../docs/内部资料/队友统一交付与后台可维护范围_20261012.md)。
- 图片与二维码选择已有运行素材，无上传、富文本、公开写入 API 或学校统一认证。
- 正文空行分段，`## ` 小标题独占一段；HTML 作为文字转义。

## 运行已有本地开发库

在仓库根目录、使用已安装依赖的隔离环境执行：

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

要求该库已有密钥、迁移和账号；启动前确认 8095 没有被 SSH 隧道占用。正常启动不运行 seed/bootstrap。迁移更新先备份，再执行 `backend/manage.py migrate --noinput`；部署同步前端构建输出。

此机器部分依赖现存于 `sandbox/test-deps`，复用时设置 `$env:PYTHONPATH=(Resolve-Path sandbox/test-deps).Path`。这是当前机器环境布局，不要求队友复制。新机器应在自己的隔离环境安装 `backend/requirements.lock`，不要改全局 Python 或 Anaconda base。

## 全新空白开发环境

先确认目标为自己的空目录，例如 sandbox/dev-data，不指向线上库或已有录入库。创建隔离环境、安装锁定依赖、构建前端后，设置 IC_DATA_DIR 到该绝对路径，执行：

```powershell
sandbox/.venv/Scripts/python.exe backend/prepare_local.py
sandbox/.venv/Scripts/python.exe backend/manage.py migrate --noinput
sandbox/.venv/Scripts/python.exe backend/manage.py createsuperuser
sandbox/.venv/Scripts/python.exe backend/manage.py collectstatic --noinput
sandbox/.venv/Scripts/python.exe backend/serve.py
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

测试创建隔离测试库，不向正常业务库录入示例。当前共 46 项；已有转义、权限等测试不是专项安全测试结论。迁移 0001—0005 已在最新部署回执中确认应用，0005 仅更新字段说明，SQL 为 no-op。
