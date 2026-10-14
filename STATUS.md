# 项目状态

> **这是在线协作项目，两个人同时改。动手前必须先看队友最近干了什么。**
>
> ```bash
> git pull                        # 先同步
> git log --oneline -15           # 看最近提交都做了什么
> git log --oneline @{1}..HEAD    # 只看上次自己操作后新增的
> git diff HEAD@{1} HEAD --stat   # 看上次操作后改了哪些文件
> ```
>
> 队友改动涉及当前任务 → 先读相关文件再决定怎么做，别按过时假设开工。
> 队友的新成果、新状态、新待办，**顺手整合进本文件**（已写过的不重复记）。
> 不整合 → 本文件漂移 → 后来者照着过时结论干活。
>
> **提交前逐项确认 `git status`，不要用 `git add -A`**：两人可能在同一工作目录里同时改文件，`git add -A` 会把队友未完成的改动扫进自己的提交（`75b43c9` 已发生过一次）。
>
> 协作规则、工作方式与硬约束的**单点**在 [README.md](README.md) 的对应三节；根目录 `AGENTS.md` 是各人本机私有指令（不入库），不另维护一份规则。

更新：2026-10-14。本文汇总开发进度、后台能力、待办缺口与验收证据。设计正文见 [DESIGN.md](DESIGN.md)，入门见 [README.md](README.md)。

## 零 接手顺序

1. 读 [README.md](README.md)、[DESIGN.md](DESIGN.md) 和本文件。
2. 核对本地分支、未提交内容与远端。当前分支 `main`（不设保护、可直接推送）；实际同步前重新核对远端。
3. 打开公网 <http://47.94.146.53:8099/>。线上 release `20261012.8`，运行代码 `15e8dac`（10-12 部署回执；2026-10-14 核对公网仍是该版本，**此后未再部署**）。**后续文档提交不会自动改变服务器版本。**
4. 先复现本地静态版式，再按 `backend/README.md` 起自己的隔离开发库。动态内容必须走 Django 看，静态 preview 证明不了发布效果。
5. 按第三节待办表承接开发与测试，尤其安全专项、多人权限、真机与恢复演练。

## 一 现在的真实完成度

**能跑通的**：Django 5.2 + SQLite 预览后台已上线公网只读前台 `http://47.94.146.53:8099/`，私有后台 `127.0.0.1:8095`（SSH 隧道）。新闻通知走完整闭环：登录 → 新增 → 保存草稿 → 提交 → 审核批准 → 前台展示 → 改草稿保留旧展示 → 再批准 → 撤下。

**核心事实**：

| 项 | 状态 |
|---|---|
| 线上 release | `20261012.8`，运行代码 `15e8dac`（2026-10-14 核对公网仍为该版本，此后未再部署） |
| 数据快照 | article=82 / publication=80 / contententry=100 / user=1（回执时刻，后续编辑会变） |
| 演示内容 | 新闻 24 条 + 通知 24 条，全部虚构，**正式发布前撤下** |
| 迁移 | 0001—0005 已应用 |
| 服务器 | `/srv/ic-college/releases/<版本>`，`current` 指向运行版；venv、`shared/{data,backups}` |
| 端口 | 公网 8099（nginx 只代理 8096 只读前台）；私有 8095 仅回环 |
| 学校接入 | **未开始**：博达账号、栏目/资料源/组件、技术联系人均未取得 |


**已交出**：首页与内页视觉、三级导航、响应式、页头收缩动画（品牌区滚后整段滑出，不再缩小驻留）、轮播、概览吸附、内页装饰字呼吸；**404 页**（静态 `frontend/preview/404.html` + Django `handler404` → `site/error.html`）；**窄屏导航重做**（去掉整条导航带，汉堡按钮收缩后浮右上角、无底色、触发区为按钮矩形 +5px，展开为整卡菜单 + 逐字动画，收起倒放）；**页脚抽屉**；标题字体统一为自托管「新愚公装甲宋A」子集（跨系统字形一致，不依赖访客本机字体）；新闻通知草稿/审核/发布快照/撤下/分页/详情；教师、栏目条目、研究方向与课题组关联、站点信息、联系方式、公众号与轮播维护；隔离服务器部署与备份脚本。

**不是**正式上线交付，是两人之间的阶段交接。

## 二 后台能改什么

当前是 Django 后台表单 + 前台 HTML 路由，**没有公共 REST 写入 API**。

| 内容 | 能力 | 限制 |
|---|---|---|
| 新闻通知 | 标题/摘要/正文/来源/日期/图注、草稿审核发布撤下、分页 | 图片固定白名单，不能上传；有 revision 冲突保护 |
| 学院简介/组织机构/领导班子 | 固定位置 `about.section-1/2/3`，正文+摘要+图 | 外层栏目标题/英文/背景大字仍固定 |
| 科研/党建/招生/培养/服务 | 21 个集合，可新增 `entry-*`、分类、排序、发布撤下 | 集合名称/英文/布局/导航层级由代码定义 |
| 研究方向与课题组 | 方向详情、课题组详情、已发布方向关联 | 每组当前一个方向 |
| 教师 | 三位默认教师覆盖、新增 `teacher-*`、照片/排序/撤下 | 固定「教师资料待补充」卡片没有后台开关 |
| 首页轮播 | 6 个位置，标题/副标题/简介/图注 | 数量顺序结构固定；`is_visible=false` **回退默认内容，不能真正隐藏** |
| 站点信息 | `key=site`：院名、英文、院训、标识、联系、公众号、页脚 | 部分空值回退默认，不等于清空 |
| 办公地址/电话/邮箱 | 联系页与页脚读 site | 缺失显示占位 |

代码依据：`backend/content/{models,entry_admin,editable,collections,views}.py`、`frontend/scripts/build-site.js`。`content-catalog.json` 含 **32 个固定插槽/轮播位置 + 21 个集合**，另加教师与 site。**不是全站每段文字都有插槽。**

### 权限与流程

- 新闻审核需 `content.review_article`；资料发布需 `content.publish_contententry`。
- Article 与 ContentEntry 管理**均禁删除**。
- Article 有完整状态机：`save_draft`（校验旧 revision）→ `submitted` → `approve`（复制到 Publication）→ `return`（保留旧快照）/ `withdraw`（删 Publication 留草稿）。前台**只读 Publication**。
- **ContentEntry 没有**同款 revision 检查、独立提交审核状态机与 AuditEvent。**不能承诺「所有资料均双人审核」。**

### 纯文本规则

`content_slots.content_paragraphs` 与 `site/plain_text_body.html` 共用：CRLF→LF，空行切段，`## ` 开头为标题，其余保留换行。**不支持任意 Markdown。小标题必须独占一段**，否则同段其余文字也被当标题。

## 三 待办缺口（交队友）

### 3.1 占位内容后台化未完成

「所有占位内容均可后台修改」**未达到**。以下仍在源码硬编码：

| 位置 | 现状 |
|---|---|
| 首页科学与创新区 | 「研究方向、平台与团队材料待审定」「平台概览…待提供」写在 `home.html` |
| 首页人才培养区 | 「专业设置与培养方案待审定」「课程设置…待提供」硬编码 |
| 首页科研三个图文入口 | 图片、标题、图注、链接写在 `home.html` |
| 首页培养图片与说明 | 校园牌坊、固定校训、「正式素材待替换」在 `home.html` |
| 教师空位卡片 | `vacancies.html` 始终输出三张空位，新增教师后仍永久保留 |
| 轮播启停/顺序 | 撤下只回退默认素材，圆点/总数/alt/键盘状态不一致 |
| 全站固定界面文案 | 导航/栏目标题/英文/背景字、页脚链接、技术支持、开发预览提示 |
| 图片/附件工作流 | 只能选既有图片，无上传入口，无通知附件模型 |

补齐建议保持简单：优先复用 ContentEntry 与现有发布快照，**不另起一套通用 CMS**。改源码后必须构建静态与 Django 外框，**不直接改 generated**。验收须通过后台 UI 改→存→发→查动态首页/内页，不能只核对静态 preview。

### 3.2 待验收项

| 待办 | 现状 | 完成标志 |
|---|---|---|
| **安全专项** | 未完成，明确交队友 | 授权范围内验权限、输入输出、会话/CSRF、文件边界、代理、依赖与备份暴露 |
| 多角色人工验证 | 回执只有 1 个用户 | 建独立编辑/审核/发布角色，逐一验证能做/不能做 |
| ContentEntry 并发 | 无 revision 保护 | 评估后决定是否补齐 |
| 手机/Pad 真机 | 仅桌面模拟 | 真机各一次：菜单触控、缩放、横竖屏、跨设备字形一致性、长文、二维码、页脚 |
| 浏览器阅读模式 | 未做 | 用动态长文核对正文/标题/图注提取 |
| 公网弱网与帧率 | 仅本机图片阻塞 | 固定网络条件记录等待、帧率、长任务 |
| 完整业务库恢复 | 仅临时 WAL 样例 | 隔离副本恢复，查计数/快照/教师/图片/登录，**不覆盖现网** |
| 备份计划/监控 | 脚本有，定时策略未实证 | 保留周期、告警负责人、演练频率 |
| 学院正式材料 | 大量演示占位 | 学院逐项审定，撤换演示内容 |
| **素材授权** | 327.8 MB 视频来源与许可**未确定**（B 站 UP 主二次打包，文件夹名「免费商用」不是授权声明）。**2026-10-14：该素材已从工作区移除**，来源与授权核查记录留在 `docs/assets/site-media/VIDEO-SOURCES.md` | 若后续重新启用，先补原始来源/许可证/UP 主转载授权；否则本项随素材一并关闭 |
| 学校平台对接 | 无可验证接口 | 博达账号、栏目/资料源/组件、技术联系人、审批 |

**不要为表面「全通过」勾掉无法执行的项目。**

**过期断言，不是产品缺陷（2026-10-14 逐条核实，已修完）**：三个脚本的红灯都来自「断言还写着 `e6e134d` 之前的行为」，不是页面坏了。

- `check-current-design.cjs`「{width}px收缩标识完整可见」要求收缩态 `.college-name` 的 `top >= 0`，但 `e6e134d`（10-13 09:05「品牌区滚后整段滑出，不再缩小驻留」）有意让 `.header-main` 在收缩态 `height: 0`（`--brand-height-closed: 0px`），靠自身的 `overflow: hidden` 把内容裁掉——注意 **`.header-main` 没有 opacity 规则**，淡出的是它内部的 `.brand`（`style.css:679`），别去量前者。断言与现行设计**相反**。10-12 那一版 `frontend/qa/current-design-browser.json`（56 项，现已被 10-14 的 63 项结果覆盖，旧版看 `git log -p -- frontend/qa/current-design-browser.json`）里这条**是通过的** → 说明它是 10-13 之后才红的，不是"既有问题"。同一脚本的「页头实际高度与字号都有连续中间帧」写死 `height > 46` / `size > 20`，也是品牌区驻留时代的取值。
- `check-navigation-fixes.cjs` 与 `check-overview-typography.cjs` 都硬编码 `元素顶 - 91`，而 91 是旧的 `--header-compact-height`，现值 **45**；实际吸附落点 = `元素顶 - 45`（`.overview-section { scroll-margin-top: var(--header-compact-height) }`），实测差 46.5px。

**不是「时序不稳定」**：`check-overview-typography.cjs` 在新树上连跑 2 次、在干净 worktree 上跑 1 次，失败点与差值（46.5px）完全一致，是确定性失败。

**但确实另有两处真的时序竞态，已一并修掉**（不要把它们和上面的确定性失败混为一谈）：
1. `check-navigation-fixes.cjs` / `check-overview-typography.cjs` 用固定 `waitForTimeout(500)` 赌「吸附动画还在 settling」，并发负载下会采到 `idle` 而误报。改为 `waitForFunction` 等状态机自己进出 `settling`。
2. `check-overview-typography.cjs` 只等 `document.fonts.ready`，而 `@font-face` 还没被请求时它就已经 resolve，会量到系统回退字体（macOS 上是 `Songti SC`）。改为先把已声明的字面 `load()` 完。**注意**：并发抓站时本地 `python3 -m http.server` 会 `ERR_CONNECTION_RESET`，字体面变 `|error`，此时报「回退字体」是**真的**回退，报错信息里带字体面状态可用于区分；单人跑一次即可得干净结果。

处理方式：改断言去读 CSS 计算值（`scrollMarginTop` / `--header-expanded-height` / `--header-compact-height`），不再写死数字。**不要为了点亮断言去恢复品牌区收缩驻留——那是有意去掉的旧行为。** 改完实测：`check-current-design.cjs` 63 项、`check-navigation-fixes.cjs`、`check-overview-typography.cjs` 全绿（2026-10-14，单跑）。

**已退役脚本（不要当验收门槛，也别把它们修绿）**：下面三个的红灯**不是**上面那类过期断言，是脚本本身跑不完——它们依赖的 DOM 在 10-12/10-13 就被删了：

| 脚本 | 断点 | 证据（2026-10-14 实测） |
|---|---|---|
| `check-experience.cjs` | 第 29 行点 `[data-pause]` | 暂停按钮 10-12 已删，`[data-pause]` 计数 0 |
| `check-carousel.cjs` | 第 40 行等 `[data-pause]` | 同上，直接 TimeoutError |
| `check-navigation-scroll.cjs` | 第 21 行断言箭头 `opacity === '0'` | 现状静止 `0.12`、悬停 `0.65`（旧值 0 / 1）；第 25 行起同样点 `[data-pause]`；`[data-motion-toggle]` 计数也是 0 |

三者的覆盖内容由 `check-current-design.cjs`、`check-navigation-fixes.cjs`、`check-overview-typography.cjs`、`check-header-motion.cjs` 分担。文件头都已自述为历史脚本；保留作历史参考，是否删除待定。
另注：`check-carousel.cjs` 与 `check-navigation-scroll.cjs` 把 `http://127.0.0.1:8765` **写死在代码里、不读命令行参数**，所以必须把预览服务起在 8765 才跑得动；其余脚本接受 `argv[2]`（默认 8766）。

## 四 验收证据（截至 2026-10-14）

自动化结果，**不等于人工验收**。标「隔离库」的项需要 Django 环境（本机 macOS 未装 Django，须在 `backend/requirements.lock` 的环境里复跑；Windows 那台见 `backend/README.md`）。

| 检查 | 结果 | 入口 |
|---|---|---|
| Django content 回归 | 46 项通过（隔离库） | `backend/manage.py test content --noinput` |
| 静态链接与片段 | 73 页 / 5629 引用通过 | `frontend/scripts/check-preview.py` |
| 页面结构/模板对应 | 96 项通过 | `frontend/qa/current-structure.json` |
| 字体资源、许可、覆盖 | 104 字符通过（母版 sha256 + 子集 sha256 + 覆盖） | `prepare-fonts.py --check` |
| 标题字体跨页一致 | 73 页 177 区域 2191 字形全部自托管、0 回退 | `frontend/scripts/check-overview-typography.cjs` |
| 运行包预检 | 231 文件通过 | `deployment/package_preview.py --check` |
| WAL 备份恢复 | 1 项通过（临时样例） | `deployment/test_backup.py` |
| 打包资源回归 | 7 项通过 | `deployment/test_release_assets.py` |
| 页头动画控制 | 5 项通过 | `frontend/qa/header-motion-unit.json` |
| 窄屏汉堡按钮 | 8 项通过（无导航带、无底色、收缩后浮右上角） | `frontend/scripts/check-nav-toggle.cjs` |
| 图片状态机 | 6 项通过 | `frontend/qa/media-loading-unit.json` |
| 跨页过渡控制 | 5 项通过 | `frontend/scripts/check-page-transition.cjs` |
| Edge 实际浏览器 | **63 项通过**（2026-10-14 重跑，脚本已对齐现行设计，见 3.2 节） | `frontend/qa/current-design-browser.json` |

**公网实测**（Claude Code 于 10-12 执行，**非本轮复现；当时线上还是旧字体**）：分页新闻 29 条/3 页、通知 27 条/3 页；48 条演示详情页全量 200；外网全站爬取 77 页/94 资源全 200；字体真实加载（`document.fonts.load('400 30px "IC WenKai"', '学院新闻')` 返回 1 个对象，文件 200 且 `font/ttf`）；五视口 1440/1024/768/390/320 无横向溢出。10-14 起线上字体改为 `IC ZhuangSong`，该条须在下次部署后重测。

**未覆盖**：真机、阅读模式、触控手感、跨设备字形一致性、长文实际阅读体验、锚点/反向滚动/刷新归位、公网弱网与帧率。弱网是暂挂 `campus-gate.jpg` 模拟，不是公网带宽测试。

## 五 栏目树

```
首页
学院概况      学院简介 / 组织机构 / 领导班子
科学与创新    研究方向 / 研究平台（平台概览·平台介绍）/ 课题组（团队概览·课题组介绍）
              研究进展 / 学术交流 / 芯片天地
人才培养      学科与专业 / 课程与培养方案
              招生就业（本科生招生·研究生招生·就业指导）/ 师生园地（师生活动·学生风采）
师资队伍      教师名录 / 人才招聘
新闻通知      学院新闻 / 通知公告 / 媒体掠影
党建党务      党建动态 / 学习园地
公共服务      制度与办事（规章制度·办事流程）/ 服务指南 / 网站导航
人才招聘
联系我们
```

顶层共 **10** 项（首页 + 9 个主栏目），参考纳米学院补齐结构并合并同义入口。师资展示程纲、张锦龙、郑海务三人，**前台仅个人简介**，完整底稿保留在数据源，不展示论文/课程/荣誉/个人联系方式。

## 六 关键操作

**本机运行**：前端 `node frontend/scripts/build-site.js`；静态预览绑 `127.0.0.1:8766`。动态运行见 `backend/README.md`，用自己的隔离数据目录。

**后台访问**：

```bash
ssh -N -L 8095:127.0.0.1:8095 <已授权用户>@47.94.146.53
# 浏览器打开 http://127.0.0.1:8095/preview-admin/
```

账号口令与 SSH 密钥私下交接，**不放文档**。隧道退出即不可用，不要为方便开放后台公网端口。

**新闻录入**：slug 以 `news-`/`notice-` 开头创建后固定；正文空行分段，小标题 `## ` 独占一段；只保存=草稿，勾「保存后提交审核」交审核员；批准/退回/撤下在「查看草稿并审核」。每页 10 条。

**硬禁忌**：
- **不执行** `bootstrap_preview`、`seed_showcase` 或任何导入命令「修复」已有库。`backend/start-local.ps1` 内含 bootstrap，不能盲用于现有业务库。
- **不删除**已有文章、发布快照与教师资料。
- 不在数据库直接编辑快照代替审核。
- 演示正文不硬编码到前端数据文件，走后台 UI 录入。

## 七 部署与运维

流程见 `deployment/README.md`。发布必须对应明确 Git commit：备份库与必要配置 → 生成新 release → 验证 → 切换。**不把代码发布与业务数据覆盖混为一件事。**

字体：标题区域（校训、栏目大标题、feature-intro、页脚校训）统一用自托管「新愚公装甲宋A」子集（CSS 族名 IC ZhuangSong，衍自思源宋体，SIL OFL 1.1，许可存 `frontend/licenses/`），**不再依赖访客本机字体**；正文与导航仍是系统无衬线。母版 18 MB 存 `docs/assets/fonts/`，运行子集 36 KB；改固定标题/校训需跑 `prepare-fonts.py --check`，缺字则重跑不带 `--check` 的脚本重建（构建期需本机 fontTools，不联网）。**不得复制 Windows 商业字体给访客下载。**

图片在 `frontend/src/assets` 添加并记录来源，构建后进 `preview/assets`。禁止把外部示意图称为学院真实设施或活动现场；未获正式公众号二维码不生成冒用占位。

素材来源与授权记录在 `docs/assets/site-media/`：`SOURCES.md`、`ADDITIONAL-SOURCES.md`、`VIDEO-SOURCES.md`。演示图多为 Wikimedia Commons 的 CC BY-SA 许可，**属校外占位图，待学院确认或替换**。

视频素材（`docs/assets/芯片 主板 电路 CPU 处理器 免费商用4K超清视频素材【合集】/`，327.8 MB）**未使用、未入库、不随部署包发布**。**2026-10-14：该目录已从工作区移除**，`.gitignore` 中原有的按路径排除规则同步删除；来源与授权核查记录留档在 `docs/assets/site-media/VIDEO-SOURCES.md`。若日后重新启用，单文件超 GitHub 100 MB 上限，需走 LFS 并先补授权。

## 八 已归档文档去向

本文件取代下列原 `docs/内部资料/*.md`（已删除）：

| 类别 | 原文档 |
|---|---|
| 状态与进度 | 当前开发进度与计划、MVP验收记录、开发状态与ClaudeCode交接、今晚交付文字与Claude提示词 |
| 后台与接口 | 实际接口与数据说明、交付与维护手册、队友统一交付与后台可维护范围 |
| 验收与核验 | 交接验收记录、公网与多设备人工核验清单、预览后台人工验收清单、服务器公网/私有部署验收记录 |
| 部署回执 | ClaudeCode本轮部署与内容充实回执（含第二/三/四轮）、小标题修复部署回执、分页演示与字体部署交接、阶段交付Git回执、本机代理访问工作室官网修复回执、公网预览交接提示词、接续提示词、部署与后台演示交接 |
| 单项改动 | 导航与子板块修复、栏目列表与详情改造、栏目与页头参考记录、内页首页风格统一、新闻通知小标题修复、学院概况与字体动效修正、芯片动效选型、演示新闻与通知目录 |

**保留**：`教师简历汇总.md`、`IC学院官网所需素材.md`（对外收集素材仍在用），以及子目录 `低空学院参考/`、`电路板样片/`、`排版检查/`、`设计预览/`、`制作脚本/`。

**2026-10-12 队友侧变更（PR #2 及后续）**：根目录个人笔记移出版本管理；新增 `docs/assets/site-media/` 视频与补充图片来源记录。合并方式见 `cdb1d74`。

**2026-10-13/14 变更摘要**（63 个提交，详见 `git log --oneline --since=2026-10-13`）：

| 方向 | 改动 | 关键提交 |
|---|---|---|
| 页头 | 品牌区滚后整段滑出，不再缩小驻留；收缩高度 91→45px | `e6e134d` |
| 窄屏导航 | 去掉整条 navigation-band，汉堡按钮收缩后浮右上角、无底色、触发区 = 按钮矩形 +5px | `84f3193`、`5d1ae50` |
| 菜单动效 | 整卡展开 + 逐字模糊/翻转动画，收起逐字倒放 | `ba69a2a`、`f25a1fb`、`7e2047c` |
| 页脚 | 抽屉套用 nav-item 风格，品牌区间距减半 | `bad7a0e`、`3e184be` |
| 404 页 | 新增静态 `frontend/preview/404.html` 与 Django `handler404` → `site/error.html` | `f7ae3db` |
| 字体 | 楷体 → 自托管「新愚公装甲宋A」子集（`IC ZhuangSong`），删旧 `IC WenKai` 子集与母版 | `68c9422` |
| 轮播 | 删掉可见的「每 3 秒自动换图」提示文字（3 秒间隔本身不变） | `82583dd` |

历史全文可查 `git log --diff-filter=D --name-only` 或 `docs/归档不再看/`。
