# Claude Code 小标题修复部署回执（新闻／通知详情与审核页）

日期：2026-10-12。执行：Claude Code。本文只记录**实际做到并验证过**的事；未执行或未通过的项目逐项标明。
本文不含任何口令或密钥。

承接[第四轮部署回执](ClaudeCode本轮部署回执_20261012_第四轮.md)。
本轮修复上一轮调查发现的缺陷：新闻／通知详情页把 Markdown 的 `## ` 小标题当普通文字显示。

---

## 1. release、commit、推送分支、迁移结果

| 项 | 值 |
|---|---|
| 公网前台 | **http://47.94.146.53:8099/** |
| 私有后台 | `http://127.0.0.1:8095/preview-admin/`（**仍只监听服务器回环**，经 SSH 隧道访问） |
| 服务器 release | **`/srv/ic-college/releases/20261012.8`**（`current` 指向它；`20261012.1`~`.8` 全部保留） |
| 部署包 | **229** 个文件，SHA256 `32a1671093728ff023a95895…`（本机与服务器一致） |
| commit | **`15e8dac`**（修复新闻／通知详情与审核页的小标题渲染） |
| 推送分支 | `origin/codex/site-development` = **`15e8dac`**（`0b6805b..15e8dac`） |
| main | **本轮未合并**（本地/远端均 `4dbf1e9`），**未强推** |
| 迁移 | `0005_article_body_heading_help` **已应用**（执行前 `showmigrations` 显示未应用，执行后为 `[X]`） |

**资源版本未变**（本轮无前端样式改动），公网实测：
`style.css?v=20261012-14`、`fonts.css?v=20261012-2`、`main.js?v=20261012-6`。

**资源版本说明**：第四轮的字体、布局、英文与呼吸动画成果**全部保留**，本轮验收中
（见 `frontend/qa/public-typography-checks.json` 的上一轮记录）仍为相同版本。

## 2. 实际测试（本轮按当前代码重新执行，未照抄 Codex 结果）

| 检查 | 结果 |
|---|---|
| `manage.py check` | `System check identified no issues (0 silenced).` |
| `makemigrations --check --dry-run` | `No changes detected` |
| `manage.py sqlmigrate content 0005` | **两个操作均为 `-- (no-op)`**：不重建表、不改写数据 |
| **Django content 全部测试** | **Ran 46 tests, OK**（26 + 8 + 7 + 5；含本轮新增的动态页面回归） |
| `deployment/package_preview.py --check` | 通过：**229** 个运行文件，含新增模板与迁移 |
| `git diff --check` | 通过（无空白错误） |

**同两项也在服务器新 release 上复跑**：`check` 无问题、`makemigrations --check` 无差异、
`test content` **46 项 OK**、`sqlmigrate` 同样为 no-op。

**环境**：Django 测试用 `sandbox/.venv`（Python 3.10.8）+ `PYTHONPATH=sandbox/test-deps`，
**未向 Anaconda base 安装任何依赖**；字体检查（上一轮）用 `sandbox/conda-envs/font-tools`。

### 2.1 迁移 0005 确认

```
BEGIN;
-- Alter field body on article
-- (no-op)
-- Alter field body on publication
-- (no-op)
COMMIT;
```
只更新字段 `help_text`，**不含表重建或数据改写**。执行后业务数据计数与执行前一致。

### 2.2 HTML 转义与换行（隔离测试，未触碰线上业务库）

本轮新增测试 `test_news_and_notice_headings_match_review_without_executing_html`
在 **Django 隔离测试库**中验证，未向线上库插入任何内容：

- `## 说明性质` → `<h3>说明性质</h3>`
- 段落内单次换行保留：`第一行<br>第二行`
- **标题中的脚本被转义**：`## <script>alert(1)</script>` → `<h3>&lt;script&gt;alert(1)&lt;/script&gt;</h3>`，
  且断言页面中**不出现** `<script>alert(1)</script>`
- 正文中间的 `##`（非段首）**保持原样**，不被当作标题
- CRLF 正常处理
- 发布快照 `Publication.body` 与录入的原始正文**完全一致**（不改写数据）
- 前台详情 URL 与后台审核 URL **两条路径都验证**

## 3. 公网动态页面验收

### 3.1 公网浏览器检查（`sandbox/check_heading_fix.cjs`）→ **30 项通过，0 失败**

| 用户要求 | 实测结果 |
|---|---|
| 1 `notice-showcase-v2-01.html` 小标题输出为 h3、无字面量 `##` | **7 个 h3**（说明性质／适用对象／演示议程／准备事项／记录与反馈／再次说明／关于适用范围），正文中**不含 `##`**；普通段落 8 个 |
| 1 `news-showcase-v2-01.html` 同上 | **5 个 h3**（交流背景／课程案例与讨论／实验环节的衔接／作业与反馈等），正文中**不含 `##`**；普通段落 7 个 |
| 2 **后台审核页**同正文小标题正确 | 登录真实后台后打开审核页：通知 **7 个 h3**、新闻 **5 个 h3**，均**无字面量 `##`** |
| 3 栏目详情无退化 | `entry-direction-device-process.html` **9 个 h3**（方向说明／关注的问题／常用方法／与其他方向的交界…），无字面量 `##`，21 个段落 |
| 4 正文元素正常 | 日期与来源（`发布日期：2026-10-12　来源：学院网站建设演示`）、配图加载成功（`chip-banner.svg`）、返回链接指向 `notices.html`、标题为 `h2` |
| 6 窄屏可读性 | 1440/768/390/320 **无横向溢出**；390 宽下小标题 `18.72px / 行高 37.44px`、正文 `16px / 行高 32px` |
| 7 既有内容与隔离 | `news-111` 200；师资页仍有 程纲／张锦龙／郑海务；通知列表分页仍为「共 39 条 / 4 页」；公网 `/preview-admin/` 仍 **404** |
| 版本与控制台 | 三个资源版本均未变；**无 CSP 拦截、无失败资源请求** |

### 3.2 关于「标题间距」的说明（第 6 项的补充）

实测小标题的 `margin` 为 **0**，其上下间距与普通段落之间**完全相同**——分离只靠字重（700）
与字号（18.72px vs 16px），以及 `.article-content { line-height: 2 }` 提供的行间留白。
截图（`frontend/qa/heading-body-desktop.png`、`heading-body-mobile.png`）显示**可读、不拥挤**。

**这不是本轮引入的问题，两类页面行为一致**：起初我测到栏目详情页标题上方有 30px，
进一步核查发现那 30px 来自其前一个元素 `<figure class="article-photo">` 的 `margin-bottom: 30px`，
**并非标题间距**。因此新闻／通知详情与栏目详情的标题间距**都是 0，没有不一致**。
如需让标题更醒目，属**样式优化建议**，不是本次修复的缺陷。

### 3.3 证据文件

- `frontend/qa/heading-fix-checks.json`（30 项明细）
- `frontend/qa/heading-body-desktop.png`、`heading-body-mobile.png`（正文小标题区域，桌面与 390 宽）
- `frontend/qa/heading-fix-notice-desktop.png`、`heading-fix-notice-mobile.png`、`heading-fix-news-desktop.png`

**代码一致性**：仓库内 340 个候选运行文件与线上 release 逐一哈希比对，
**229 个（部署包全部内容）归一化换行后 0 处差异**。

**⚠️ 关于静态预览**：`frontend/preview/` 下的静态页是占位文案，**不读取后台发布正文**，
因此静态页与本轮修复无关，也不能作为本次验收依据；本节所有结论均来自**公网动态页面**。

## 4. 备份与回退方法（不含凭据）

| 内容 | 位置 |
|---|---|
| 业务数据库备份 | `/srv/ic-college/shared/backups/ic-preview-before-heading-fix-20261012.sqlite3`（完整性检查通过） |
| 旧 systemd 单元 | `/srv/ic-college/shared/backups/release-before-heading-fix/` |
| 部署前 current 指向 | 同目录 `current.txt`（内容 `/srv/ic-college/releases/20261012.7`） |

**回退**：
```bash
ln -sfn /srv/ic-college/releases/20261012.7 /srv/ic-college/current
systemctl restart ic-preview ic-public-preview
```
迁移 0005 是 no-op，回退代码时**保留该迁移记录即可**，无需回滚数据库结构；
如需回退数据，用上面的备份文件（不覆盖用户同期编辑）。

## 5. 业务内容保留情况

部署前后**完全一致**：`article=82`、`publication=80`、`contententry=100`、`user=1`。

- 用户内容 **`news-111` 仍在**（HTTP 200）。
- **三位真实教师**（程纲、张锦龙、郑海务）资料完整保留，师资页顺序仍为程纲首位。
- 上一轮录入的新闻、通知、栏目内容、两位演示教师样例均未动。
- **未运行 seed、未替换或重建业务库、未重新发布任何已有文章**——
  那 24 条受影响正文是**通过模板修复直接正确渲染的**，正文内容一字未改。

## 6. 未完成或失败项

1. **本轮的检查与验收无失败项**。
2. **未执行**：手机/Pad **真机**验收；浏览器阅读模式；**弱网与逐帧动画采样**；
   业务库恢复演练；专项安全验收；多角色权限人工验证。
3. **交付文档、接口文档、设计稿反向更新**仍交 Codex/GPT，本轮未写。
4. **`main` 未合并**（按本轮要求不自动合并）。
5. 小标题**间距为 0** 属既有设计（两类页面一致），如要调整属样式优化，本轮**未改样式**
   （因此资源版本保持 `20261012-14` / `20261012-2` / `20261012-6` 不变）。
6. 学院正式材料仍未到位，相关位置仍为【演示】或占位。
7. 本轮验收为**桌面浏览器 + 模拟窄屏**，不等于真机；触控手感与真机字体渲染未验证。
