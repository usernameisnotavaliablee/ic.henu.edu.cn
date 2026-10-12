# Claude Code 本轮部署与内容充实回执

日期：2026-10-12。执行：Claude Code。本文只记录**实际做到并验证过**的事；
未运行、未验证的项目在第五节与本文件末尾逐项标明。本文不含任何口令或密钥。

---

## 1. 前台地址、release、资源版本、对应 commit 与回退方法

| 项 | 值 |
|---|---|
| 公网前台 | **http://47.94.146.53:8099/**（无需登录、无需隧道） |
| 私有后台 | `http://127.0.0.1:8095/preview-admin/`（需 SSH 隧道，见第 4 节） |
| 服务器 release | **`/srv/ic-college/releases/20261012.3`**（`current` 指向它） |
| 上一版本（可回退） | `/srv/ic-college/releases/20261012.2`、`20261012.1`（保留） |
| 前端资源缓存版本 | `style.css` / `header-motion.js` / `page-transition.js` = **`v=20261012-9`**；`main.js=v=20261012-4`；`media-loading.js=v=20261012-3` |
| 部署包 | 152 个文件，SHA256 `4a6bf1c0c9ca52f5cb1bd57599b5a9a19d2986645c7251113986badf30509f7b`（本机与服务器一致） |
| 对应 commit | **`7c9a6c5`**（main 合并提交）。开发分支提交 `1c97829`（目录整理）、`c7dda74`（文档） |

**回退代码**：

```bash
ln -sfn /srv/ic-college/releases/20261012.2 /srv/ic-college/current
systemctl restart ic-preview ic-public-preview
```

注意：`20261012.2` 是**旧目录布局**（代码在 `current/docs/preview-server`），回退时还需把
systemd 单元的 `WorkingDirectory` 改回 `/srv/ic-college/current/docs/preview-server`。
本轮的旧单元文件已备份在 `/srv/ic-college/shared/backups/units-before-layout/`。

**回退数据库**（本轮部署前已备份）：

```
/srv/ic-college/shared/backups/ic-preview-before-layout-switch-20261012.sqlite3
```

回退步骤见 [服务器公网前台部署验收记录](服务器公网前台部署验收记录.md) 与
[deployment/README.md](../../deployment/README.md)。

## 2. 实际运行的测试与结果

全部在**整理后的目录布局**上运行。

| 检查 | 命令 | 结果 |
|---|---|---|
| Django 系统检查 | `manage.py check` | `System check identified no issues (0 silenced).` |
| 迁移一致性 | `manage.py makemigrations --check --dry-run` | `No changes detected` |
| Django 测试 | `manage.py test content` | **Ran 40 tests, OK**（原 25 + 演示 7 + 新增 test_editable 8） |
| 页面构建 | `node frontend/scripts/build-site.js` | 30 个页面 |
| 结构一致性 | `python frontend/scripts/check-current-structure.py` | 通过：53 项 |
| 链接与资源 | `python frontend/scripts/check-preview.py` | 通过：30 页 / 2286 处引用，无失效片段或重复 ID |
| 页头动画（离线） | `node frontend/scripts/check-header-motion.cjs` | 5 项通过 |
| 图片加载（离线） | `node frontend/scripts/check-media-loading.cjs` | 6 项通过 |
| 跨页导航（离线） | `node frontend/scripts/check-page-transition.cjs` | 5 项通过 |
| 字体资源 | `python frontend/scripts/prepare-fonts.py --check` | 通过：41 个字符 |
| 运行包资源 | `python deployment/test_release_assets.py` | Ran 7 tests, OK |
| 备份脚本 | `python deployment/test_backup.py` | Ran 1 test, OK |
| 打包预检 | `python deployment/package_preview.py --check` | 152 个运行文件 |
| **公网浏览器核验** | `node sandbox/check_round3.cjs http://47.94.146.53:8099` | **39 项通过，0 失败** |

**未运行 / 未通过的项目及原因**：见第 5 节与第 10 节。整个过程中没有失败的检查项。

## 3. 页面切换、顶栏动画、移动端与弱网的检查证据

**已实测（真实浏览器 Edge / Playwright，1440×900）**

- 跨页导航：首页 → 学院概况（到达 `/about.html`）；浏览器后退回到首页；
  浏览器前进再次到达学院概况。**无空白页、无卡住**。
- 无 CSP 拦截（`console` 中无 `Content Security Policy` / `Refused to` 记录）。
- 五种视口 **1440 / 1024 / 768 / 390 / 320**，在 `/index.html`、`/news.html`、
  `/faculty.html`、`/science-innovation.html` 四个页面上
  **`document.documentElement.scrollWidth - window.innerWidth` 均为 0**，即无横向滚动。

**证据文件**

- `frontend/qa/round3-public-checks.json`（本轮汇总）
- 截图：`frontend/qa/round3-home-desktop.png`、`round3-faculty-desktop.png`、
  `round3-science-desktop.png`、`round3-news-desktop.png`、`round3-faculty-mobile.png`（390 宽）
- 页头动画与图片加载的离线证据：`frontend/qa/header-motion-unit.json`、`media-loading-unit.json`

**说明（重要）**

- 离线脚本（`check-header-motion.cjs` 等）验证的是**控制器逻辑**，不是真实渲染帧；
  浏览器核验只断言了**终点状态与无横向溢出**，**没有逐帧比对中间帧**。
- 因此"顶栏平滑收缩无瞬移""轮播完整循环""弱网加载反馈"**仍未取得逐帧或真实弱网证据**。
- 关于"网络等待与掉帧的区分"：本轮**未做**。要做需要 CDP 限速 + Performance 采样，
  本轮没有执行，不宣称已区分。

## 4. 迁移情况、后台入口、权限与可维护范围

**迁移**

| 迁移 | 状态 |
|---|---|
| `content.0001_initial` | 早已应用 |
| `content.0002_contententry` | **本轮已在新 release 执行**，只建 `content_contententry` 表，**未导入任何业务内容** |

执行前后 `content_article` 58 条、`content_publication` 56 条**未变化**。

**后台入口**：`/preview-admin/`（仅服务器回环 127.0.0.1:8095，经 SSH 隧道访问）

```bash
ssh -N -L 8095:127.0.0.1:8095 root@47.94.146.53
```

凭据位置：`/srv/ic-college/shared/access.txt`（600，ic-preview），用
`ssh root@47.94.146.53 'cat /srv/ic-college/shared/access.txt'` 读取。**本文不展示口令。**

**权限**

| 角色 | 能做什么 |
|---|---|
| 内容编辑 | 新闻/通知新增、编辑、存草稿、提交审核 |
| 预览审核员 | 批准、退回、撤下；不能编辑 |
| 栏目资料编辑 | 教师、栏目、轮播、站点资料草稿维护 |
| 栏目资料发布者 | 另加 `content.publish_contententry`，执行"将所选资料发布到预览前台" |

**当前可后台维护的内容**

- 新闻与通知：完整流程（草稿 → 提交 → 审核 → 前台 → 撤下）
- 教师：可新增（`teacher-` 开头标识）、编辑、发布；自动出现在首页、教师名录与详情
- 栏目位置：26 个正文位置 + **6 张首页轮播**
- 站点信息：学院名称、英文名称、院训、标识图片、地址、电话、邮箱、公众号名称与二维码、页脚备案说明
  （页脚与"联系我们"共用同一份配置）

**边界**：图片**只能从已归档 assets 中选择，不支持后台上传**；正文为纯文本；
无富文本、无 SSO、无英文版、无站群同步。

## 5. 录入前后数量与新增内容清单

| 项 | 录入前 | 录入后 |
|---|---|---|
| `content_article` | 58 | 82 |
| `content_publication` | 56 | 80 |
| 新闻已发布 | 29 | **41**（5 页） |
| 通知已发布 | 27 | **39**（4 页） |
| `content_contententry` | 0 | **23**（21 个栏目 + 2 位演示教师），全部已发布 |

### 5.1 新增新闻 12 篇（正文 445–592 字，来源「学院网站建设演示」）

| 地址 | 标题 | 日期 | 正文字数 |
|---|---|---|---|
| `/news-showcase-v2-01.html` | 【演示】集成电路基础课程教学交流活动纪实 | 2026-10-12 | 592 |
| `/news-showcase-v2-02.html` | 【演示】从晶圆到芯片：一次学科知识分享的现场记录 | 2026-10-10 | 571 |
| `/news-showcase-v2-08.html` | 【演示】学习资料共建：一次班级层面的文档整理 | 2026-09-27 | 488 |
| `/news-showcase-v2-03.html` | 【演示】微纳传感方向跨学科交流活动记录 | 2026-10-08 | 553 |
| `/news-showcase-v2-04.html` | 【演示】学生电路设计作品交流：从设计思路到调试记录 | 2026-09-30 | 548 |
| `/news-showcase-v2-05.html` | 【演示】科研文献阅读交流：把方法部分读透 | 2026-09-25 | 535 |
| `/news-showcase-v2-06.html` | 【演示】实验室安全与基础操作学习活动记录 | 2026-09-18 | 571 |
| `/news-showcase-v2-07.html` | 【演示】课程实践周：把课堂知识落到一次完整的设计上 | 2026-10-06 | 512 |
| `/news-showcase-v2-09.html` | 【演示】电子测量基础实践：从读数到不确定度 | 2026-10-03 | 467 |
| `/news-showcase-v2-10.html` | 【演示】低功耗电路学习小组的阶段交流 | 2026-09-23 | 474 |
| `/news-showcase-v2-11.html` | 【演示】校园科普讲解活动：把专业内容讲给非专业听众 | 2026-10-01 | 457 |
| `/news-showcase-v2-12.html` | 【演示】学生实践作品展示与互评活动记录 | 2026-09-21 | 445 |

### 5.2 新增通知 12 篇（正文 477–576 字）

| 地址 | 标题 | 日期 | 正文字数 |
|---|---|---|---|
| `/notice-showcase-v2-01.html` | 【演示】关于学科知识分享交流安排的说明 | 2026-10-12 | 563 |
| `/notice-showcase-v2-02.html` | 【演示】关于课程资料整理与提交方式的说明 | 2026-10-11 | 576 |
| `/notice-showcase-v2-03.html` | 【演示】实验室安全学习提示（演示） | 2026-10-09 | 567 |
| `/notice-showcase-v2-04.html` | 【演示】关于学术文献阅读活动安排的说明 | 2026-10-06 | 547 |
| `/notice-showcase-v2-05.html` | 【演示】关于电路设计作品展示安排的说明 | 2026-09-28 | 539 |
| `/notice-showcase-v2-06.html` | 【演示】关于网站栏目资料核对方式的说明 | 2026-09-22 | 561 |
| `/notice-showcase-v2-07.html` | 【演示】关于课程答疑安排调整的说明 | 2026-10-07 | 501 |
| `/notice-showcase-v2-08.html` | 【演示】关于实践作品互评安排的说明 | 2026-09-26 | 489 |
| `/notice-showcase-v2-09.html` | 【演示】关于实验记录整理方式的说明 | 2026-10-04 | 515 |
| `/notice-showcase-v2-10.html` | 【演示】关于学习小组活动组织的说明 | 2026-10-02 | 515 |
| `/notice-showcase-v2-11.html` | 【演示】关于开放体验活动参观须知的说明 | 2026-09-25 | 477 |
| `/notice-showcase-v2-12.html` | 【演示】关于学期学习计划梳理的说明 | 2026-09-20 | 523 |

> 字数统计为**正文总字符数**（含 `## ` 小标题与换行）。实际纯文字略少。
> 其中新闻 `v2-01/02/06`、通知 `v2-01/02/03` 超过 550 字；**没有达到 1200 字量级的长文**——
> 本轮未按该档位编写，这是与"各准备 2 篇约 1200 字长文"要求的**差距**，如实标注。
> 已有的第一轮长文（`news-showcase-v1-01/13/24`、`notice-showcase-v1-01/13/24`，各约 1300–1400 字）
> 仍在线上，可用于长文阅读测试。

### 5.3 新增/完善的栏目内容 21 处（正文 379–548 字，日期为展示日期）

| 栏目位置 | 标题 | 访问页面 | 正文字数 |
|---|---|---|---|
| `science-innovation.section-1` | 【演示】研究方向（示例） | `/science-innovation.html` | 548 |
| `science-innovation.section-2` | 【演示】研究进展（示例） | 同上 | 462 |
| `science-innovation.section-3` | 【演示】学术交流（示例） | 同上 | 477 |
| `research-platforms.section-1` | 【演示】平台概览（示例） | `/research-platforms.html` | 446 |
| `research-platforms.section-2` | 【演示】平台介绍（示例） | 同上 | 427 |
| `research-groups.section-1` | 【演示】团队概览（示例） | `/research-groups.html` | 413 |
| `research-groups.section-2` | 【演示】课题组介绍（示例） | 同上 | 449 |
| `regulations.section-1` | 【演示】规章制度（示例） | `/regulations.html` | 455 |
| `regulations.section-2` | 【演示】办事流程（示例） | 同上 | 451 |
| `party-building.section-1` | 【演示】党建动态（示例） | `/party-building.html` | 390 |
| `party-building.section-2` | 【演示】学习园地（示例） | 同上 | 412 |
| `admissions.section-3` | 【演示】就业指导（示例） | `/admissions.html` | 436 |
| `community.section-1` | 【演示】师生活动（示例） | `/community.html` | 410 |
| `community.section-2` | 【演示】学生风采（示例） | 同上 | 387 |
| `ic-world.section-1` | 【演示】学科科普（示例） | `/ic-world.html` | 513 |
| `ic-world.section-2` | 【演示】芯片与微纳世界（示例） | 同上 | 515 |
| `media.section-1` | 【演示】媒体报道（示例） | `/media.html` | 379 |
| `talent-cultivation.section-1` | 【演示】学科与专业（示例） | `/talent-cultivation.html` | 427 |
| `talent-cultivation.section-2` | 【演示】课程与培养方案（示例） | 同上 | 445 |
| `public-service.section-1` | 【演示】公共服务信息（示例） | `/public-service.html` | 407 |
| `careers.section-1` | 【演示】人才招聘信息（示例） | `/careers.html` | 407 |

**仍保留占位（未编造）**：`about.section-1` 学院简介、`about.section-2` 组织机构、
`about.section-3` 领导班子、`admissions.section-1/2` 本科与研究生招生。
原因为需学院正式材料，且规则明确要求不伪造机构、领导名单与招生政策。

### 5.4 演示教师 2 位（明确标注虚构）

| key | 标题 | 说明 |
|---|---|---|
| `teacher-demo-sample-a` | 【演示】教师资料样例（虚构人物） | 教授 · 示例方向；**不使用真人照片** |
| `teacher-demo-sample-b` | 【演示】教师资料样例（虚构人物） | 副教授 · 示例方向；同上 |

排序值 60/61，**排在三位真实教师之后**。师资页实测顺序：程纲 → 张锦龙 → 郑海务 → 两位演示样例。

## 6. 录入方式确认与已有内容留存

**录入方式（关键）**：**全部通过真实后台网页 UI 完成**——Playwright 驱动浏览器登录后台、
在弹出的表单里填写字段、点"保存"、进入"查看草稿并审核"页面提交批准；
栏目资料通过"教师、栏目与站点资料"逐条新增并执行"将所选资料发布到预览前台"。

- **没有**使用 SQL、ORM 脚本、`seed_showcase`、management command、接口直灌或替换数据库文件。
- 演示正文**没有**固化进 HTML、JS 或构建数据文件。
- 驱动脚本与内容草稿放在 `sandbox/`（已 gitignore），**不属于应用代码，不进部署包**。

**已有内容留存（已核对）**

- 用户内容 `news-111`：**仍在**，且仍在公网首页与列表可见。
- 三位真实教师（程纲、张锦龙、郑海务）：**完整资料保留**，未被 `【演示】` 前缀覆盖，
  未被虚构文案替换；师资页顺序为程纲首位。
- 第一轮 48 条演示内容（`*-showcase-v1-*`）：未重复导入、未被覆盖。

**过程中发现并修正的问题**：首次录入时我的自动化脚本点到了后台页面的"注销"按钮
（审核页含 2 个 form），导致批准未真正生效。已改为只点带 `decision` 字段的表单，
并改为按"状态=待审核"筛选逐条批准，最终 **24 篇全部批准成功**。

## 7. 文件整理与主要路径迁移

**迁移（`git mv` 级重命名，git 已识别为 rename）**

| 原路径 | 新路径 |
|---|---|
| `docs/frontend/` | `frontend/` |
| `docs/preview-server/` | `backend/` |
| `docs/deployment/` | `deployment/` |
| `docs/sandbox/` | `sandbox/` |

**同步修正的路径依赖**：`build-site.js`（Django 外框输出目标）、
`backend/config/settings.py`（`DOCS_DIR` → `REPO_DIR`，`PREVIEW_ROOT`）、
两个 systemd 单元的 `WorkingDirectory`、`deployment/package_preview.py`（白名单与包内路径）、
`release_assets.py` / `test_release_assets.py` / `check_showcase_offline.py` /
`check-current-structure.py` / `prepare-assets.py` / `check-navigation-scroll.cjs`、
`.gitignore`（`/sandbox/*`）、以及全部文档相对链接。

**核对**：搬迁前后文件数 225 与 `125+86+14` **逐一对应，无丢失**；
搬迁后全部离线检查与 Django 40 项测试**重跑通过**。

**未动**：`docs/内部资料/`、`docs/assets/`、`docs/发给老师/` 的原有内容；
队友整理的 `docs/归档不再看/`、`docs/Claude拉的一坨/`、`DESIGN.md` 保持原样。

**服务器侧的目录迁移**：新 release 采用新布局，systemd 单元改为
`WorkingDirectory=/srv/ic-college/current/backend`；旧单元文件已备份；
业务数据库、密钥与上传位置**沿用原路径未变**（仍是 `/srv/ic-college/shared/...`），
**没有创建空库，也没有丢数据**。

## 8. 交付文档、接口文档与设计稿的位置

- **交付文档与接口文档由 Codex/GPT 编写**（按用户 2026-10-12 指示）。
  我此前起草的两份已按指示**撤掉**，避免重复。
- 本文（回执）包含 GPT 撰写交付文档所需的全部事实：地址、release、commit、
  目录结构、部署边界、后台入口与权限、迁移、能力边界、待办。
- **设计稿反向更新**：未执行。本轮**未修改** `docs/归档不再看/04_前端设计稿.md` 等设计稿，
  也未新写设计文档——该部分交由 Codex/GPT。**如实标注为未完成。**
- 本轮已有的实测记录（可作为设计稿更新的依据）：
  [服务器公网前台部署验收记录](服务器公网前台部署验收记录.md)、
  [服务器私有部署验收记录](服务器私有部署验收记录.md)、
  [MVP验收记录](MVP验收记录.md)、
  [公网与多设备人工核验清单](公网与多设备人工核验清单.md)。

## 9. Git 提交哈希、推送分支、main 哈希与冲突处理

| 项 | 值 |
|---|---|
| 开发分支 | `codex/site-development` |
| 开发分支提交 | `1c97829` 目录整理 → `c7dda74` 文档 |
| 已推送 | `origin/codex/site-development`，`b5bf669..c7dda74` |
| main 合并提交 | **`7c9a6c5`**（`--no-ff`，合并 `codex/site-development`） |
| main 推送 | `origin/main`，由 `0280637` 前进到 `7c9a6c5` |
| 强制推送 | **无**。未重写任何共享历史 |

**与队友 main 的分叉与冲突处理**

合并前 `origin/main` 已前进 7 个提交（`4b3d3d3..0280637`，含队友的 `DESIGN.md`、
README 改写、"把 agents.md 加入 gitignore"、文档整理）。`b5bf669` 是 main 的祖先，可合并。
出现 3 处冲突，处理如下：

| 冲突 | 处理 |
|---|---|
| `README.md` | 以我的**当前状态**版本为基础，**并入队友的实质内容**：三位教师表、已确认的事实、边界规则、「等学校」待办、DESIGN.md 入口。并修正队友改名后失效的链接 |
| `.gitignore` | 保留我的沙盒与原视频规则；**队友新增的 `AGENTS.md` 忽略行未保留**——因为用户明确要求更新 AGENTS.md 并保留协作规则，该文件继续纳入版本管理。已在文件中写明缘由，便于后续决定 |
| `AGENTS.md` | 队友在 main 上删除了该文件，我分支修改了它。按用户指示**保留更新版** |

**合并后复测**：全部离线检查与打包预检**重跑通过**（30 页/2286 链接、53 项结构、字体、
7 项资源测试、1 项备份测试、152 文件打包预检）。

**未做**：`origin/codex/site-development` 尚未合并 main 的最新内容（main 的合并提交尚未回流到开发分支）。
不影响功能，但如需在开发分支继续工作，建议先 `git merge main`。
**无法代为**：队友电脑上的**本地**仓库无法由我更新，只能更新共同远端 `origin/main`。

## 10. 未完成事项、待正式材料与功能边界

**本轮未做（如实标注，不视为通过）**

1. **设计稿反向更新**与**交付文档、接口文档**——按用户指示交 Codex/GPT。
2. **1200 字量级长文**：本轮新增的 24 篇在 445–592 字之间，未达该档位（详见 5.2 注）。
3. **逐帧的动画/过渡验收**：只验证了终点状态与无横向溢出，**未做中间帧比对**。
4. **真实弱网测试**：未做，因此**未区分网络等待与掉帧**。
5. **手机/Pad 真机**：未做。五种视口是桌面浏览器模拟。
6. **浏览器阅读模式**、跨设备字形像素一致性：未做。
7. **业务库恢复演练**：未做（备份脚本只在独立库测过）。
8. **专项安全验收**：未做。40 项测试全绿**不等于**安全验收通过。
9. **开发分支尚未回流 main 的最新内容**（见第 9 节）。
10. **空列表真实渲染**：本轮栏目内容已全部发布，未构造空数据场景。

**待学院提供（现为占位，未编造）**

学院简介正式文本、组织机构、领导班子、本科与研究生招生政策、真实联系方式、
公众号二维码、备案号、院徽院训正式版本、教师资料的本人确认与照片肖像授权、媒体报道真实条目。

**待学校对接（无任何实现，不虚构接口）**

博达站群子站账号与栏目/模板权限、发布接口、正式域名 `ic.henu.edu.cn`、HTTPS 与访问保护、
校内备案与等保、服务器归属与运维交接。

**功能边界（当前确实不具备）**

后台上传文件、富文本编辑、学校统一认证、站群搜索、英文版与语言切换、与学校站群的自动同步。

**其他已在文档中记录的注意点**

- 公网前台目前是 **HTTP 明文且无访问口令**，知道地址即可浏览。
- `django-axes` 按 IP 锁定，SSH 隧道把客户端折叠为 127.0.0.1，**连续 5 次登录失败会锁定
  唯一登录来源 15 分钟**，演示时注意。
- 新闻列表按 `(-date, -approved_at, -pk)` 排序，**日期为空的记录会排在末尾**，
  内容多时被挤到末页。
