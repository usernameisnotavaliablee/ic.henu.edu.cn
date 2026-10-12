# Claude Code：分页、演示数据与跨设备字体部署交接

用户最新分工：**Codex只修改工作区文件，部署全部由Claude Code执行。** 原公网已在 `http://47.94.146.53:8099/` 运行，后台仍为服务器 `127.0.0.1:8095`。本轮不改变端口、nginx或前后台隔离，也不提交/推送Git。

> 2026-10-12回执：本交接的字体下载、48条数据导入与release `20261012.2` 部署已由Claude Code完成，32项Django测试及34项浏览器检查报告通过；不必重复导入或重新部署。以下保留原执行步骤，人工验收以[最新清单](公网与多设备人工核验清单.md)为准。后续本地仅增加运行资源打包检查，不改变线上页面。

## 本轮已有文件

- `backend/content/views.py` 与 `templates/site/list.html`：分页总数、首页/末页、前后页、当前页高亮、省略页码及GET输入跳转；每页仍10条，原有排序不变。单页/空列表不显示无效跳转框。
- `frontend/src/css/style.css`：分页按钮触控尺寸、窄屏换行；构建后进入全部页面共享CSS。
- `backend/content/demo_content.py`：新闻/通知各24条，全部明确虚构；每类01、13、24为长文，标题/摘要/正文均有标记，不含真实报名、地点、人员或奖项信息。
- `content/management/commands/seed_showcase.py`：默认只预检；`--publish`新增并通过已有提交/批准服务生成快照与日志；固定slug，重复运行不覆盖已存在的内容，含用户的 `news-111`。`--withdraw`只撤下本批仍保留演示来源、标题前缀及示例标记的内容，保留草稿。
- `content/test_showcase.py`：新增7项测试，覆盖重复导入、现有内容保护、权限、分栏分页/边界、空列表、定向撤下；**Codex未运行Django测试**，本机没有Django且未安装新依赖。
- `frontend/scripts/prepare-fonts.py`：Python标准库下载Google Fonts提供的LXGW WenKai TC字符子集及SIL OFL许可证，写入仓库资源及哈希记录；网页自托管，不访问第三方字体服务，不安装系统字体或Python库。
- `src/templates/document.html`：所有静态页面及两个Django外框引用共享 `fonts.css`；样式URL已带本轮版本参数。
- `views.resource`：仅在现有assets目录允许WOFF2/TTF并给出明确MIME；CSP仍为字体同源，无放宽。
- `deployment/package_preview.py`：运行包白名单包含WOFF2/TTF，许可证TXT原本就在白名单内。

**历史提醒：交接开始时 `src/css/fonts.css` 为占位文件，现已由Claude Code生成真实字体声明并部署。今后仍需检查构建后的 `preview/css/fonts.css` 和字体文件，避免漏跑构建；打包脚本现会自动阻止字体缺失或与清单不一致的运行产物。**

## 依次执行

1. 保留工作区全部已有修改，不要Git重置/清理/拉取来覆盖文件。先检查当前服务器release、数据库位置与服务状态；保留原站及8099路由。新依赖如确实必要仍先询问用户，本方案无需新依赖。
2. 在工作区使用已有Node和Python准备前端资源，按以下顺序执行：

```powershell
node frontend/scripts/build-site.js
python -X utf8 frontend/scripts/prepare-fonts.py
node frontend/scripts/build-site.js
python -X utf8 frontend/scripts/prepare-fonts.py --check
python -X utf8 frontend/scripts/check-preview.py
python -X utf8 deployment/check_showcase_offline.py
```

字体第一次准备需要外网获取官方素材。脚本检查来源主机、字体文件头、许可证关键词、SHA256和所用字符覆盖；失败则先解决资源获取问题，不要去掉CSP或只加一个设备字体名称。字体只替换原有四类楷体区域（校训、栏目标题、学科引导语、页脚校训），正文不变。网页中的LXGW文楷与Windows自带楷体并非同一字形，但手机/Pad/PC会使用同一份网页字体。今后改动这些固定文案后，需重新生成子集。

3. 生成运行包前确认字体文件、许可证、生成的fonts.css均存在且实际引用匹配，然后运行 `python -X utf8 deployment/package_preview.py`。使用原有发布流程上传到**新的项目release目录**，保留旧release用于回退，不覆盖旧站。
4. 使用服务器现有 `/srv/ic-college/venv`，在新release目录执行 `manage.py check`、`manage.py makemigrations --check --dry-run`、`manage.py test content`。沿用现有项目配置/密钥的安全读取方式，不打印凭据。测试使用Django测试库，不能把业务库换成测试库。此次无模型变化，不需新迁移；未实际运行就标未验证。
5. **导入演示内容前先对业务SQLite做一致性备份**。已有 `deployment/sqlite_backup.py backup 源库 新备份路径` 可用，备份目录 `/srv/ic-college/shared/backups/`，目标使用新文件名，不覆盖已有备份。
6. 在新release的 `docs/preview-server` 中，以已有项目用户、数据目录和账号执行：

```bash
sudo -u ic-preview env IC_DATA_DIR=/srv/ic-college/shared/data /srv/ic-college/venv/bin/python manage.py seed_showcase
sudo -u ic-preview env IC_DATA_DIR=/srv/ic-college/shared/data /srv/ic-college/venv/bin/python manage.py seed_showcase --publish --actor preview-admin
```

默认预检应显示48条计划、实际新增和跳过数量。新导入全部使用 `news-showcase-v1-01..24`、`notice-showcase-v1-01..24`；不会覆盖已有用户新闻/通知。它们是用户明确要求公开展示的虚构样例，不是假装学校已审核的正式内容。

7. 完成项目release切换，重启项目私有/公开两个服务，让模板与资源使用新版本；无需改nginx、安全组或原站。页面HTML无缓存，CSS已更新版本参数；检查新字体请求不是404。若失败，回退项目代码release；演示数据有独立撤下方式，不要恢复整库而覆盖用户同期编辑。
8. 真实核验并给用户回执。公网前台至少包括：
   - 两类列表总数、实际页数、各页条数；1→2→末页→上一页、页码点击、输入跳转与回车，栏目不串；重复运行导入后总数不增加。
   - 48条新增详情可达，长文和配图正常；原有用户内容仍在。
   - 字体资源200、MIME正确、未被CSP阻挡；真实浏览器 `document.fonts.load('400 30px "IC WenKai"', '学院新闻')` 返回至少一个字体对象，不能只看computed font-family就宣称字体已加载。
   - PC/手机/Pad或五种视口至少检查字体及分页不溢出；真实设备没测就标未测。系统强制字体/阅读模式单独记录。
   - 原站正常，公网后台仍不可访问，后台私有入口仍可登录；不重复或扩大专项安全测试。

本机已有可复用Playwright：`C:/Users/HONOR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`，之前遇到的是Edge启动失败，不能直接写“没有工具所以没测”。若用旧体验脚本，先检查其默认8765地址，不能拿静态站结果证明8099联动。本轮可按需使用已有工具，不擅自安装。

## 演示清理与回执

演示期间保留样例；正式发布前，可在同样的项目环境执行 `manage.py seed_showcase --withdraw --actor preview-admin` 定向撤下。它不会删除草稿/日志，不会覆盖其他内容；被用户去掉演示标记的条目会跳过，需要单独核查。撤下后重跑 `--publish`不会自动恢复，需后台逐条重新提交批准。

完成后报告：实际公网URL、release、实际新增/跳过及两栏目总数/页数、字体文件名/大小及加载证据、执行过的测试、未验证项、原站状态、备份位置和回退方法。更新[人工核验清单](公网与多设备人工核验清单.md)与[MVP验收记录](MVP验收记录.md)，不要自动把用户人工项全部勾为通过。请用户优先核验P1—P4和F1。

## Codex本轮执行边界

Codex只完成文件修改与离线检查，没有新增依赖，没有连接成功或修改服务器，没有导入数据库。此前SSH核查与字体下载曾在执行前被自动审批服务503拒绝，随后用户明确指定部署交给Claude Code；此后不再请求部署执行。
