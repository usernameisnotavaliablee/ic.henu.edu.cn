# Claude Code 本轮部署回执（学院概况分区、内页背景字呼吸与楷体本地优先）

日期：2026-10-12。执行：Claude Code。本文只记录**实际做到并验证过**的事；未执行或未通过的项目逐项标明。
本文不含任何口令或密钥。

承接[第三轮回执](ClaudeCode本轮部署回执_20261012_第三轮.md)。本轮部署 Codex 的视觉修正：
学院概况分区化、内页背景字呼吸、楷体本地优先与字体子集补齐、内页英文补全。

---

## 1. 公网地址、release、commit、推送分支与资源版本

| 项 | 值 |
|---|---|
| 公网前台 | **http://47.94.146.53:8099/** |
| 私有后台 | `http://127.0.0.1:8095/preview-admin/`（**仍只监听服务器回环**，经 SSH 隧道访问） |
| 服务器 release | **`/srv/ic-college/releases/20261012.7`**（`current` 指向它；`20261012.1`~`.7` 全部保留） |
| 部署包 | **227** 个文件，SHA256 `12d823d0f14559cbaa95074c…`（本机与服务器一致） |
| commit | **`a35979e`**（学院概况分区、内页背景字呼吸与楷体本地优先） |
| 另附提交 | `225bdde`（上一轮遗留的**本机代理修复回执**，单独提交，不混入本轮） |
| 推送分支 | `origin/codex/site-development` = **`a35979e`**（`f9dbb05..a35979e`） |
| main | **本轮未合并**（本地/远端均为 `4dbf1e9`），**未强推** |

**资源版本（公网实测）**

| 资源 | 版本 |
|---|---|
| style.css | **`?v=20261012-14`** |
| fonts.css | **`?v=20261012-2`** |
| main.js | **`?v=20261012-6`** |

页面静态引用的 `header-motion.js`、`page-transition.js`、`media-loading.js` 版本未变。

**后台隧道**：本轮结束时已建立一条到 8095 的隧道（本机 `ssh` 进程 PID 36184），
实测 `/preview-admin/` 302、`/preview-admin/login/` 200。该隧道随本会话结束会退出，届时重开即可：
`ssh -N -L 8095:127.0.0.1:8095 root@47.94.146.53`

## 2. 实际检查结果

### 2.1 本地检查（**本轮按当前代码重新执行**，未照抄 Codex 的结果）

| 检查 | 命令 | 结果 |
|---|---|---|
| 构建 | `node frontend/scripts/build-site.js` | 72 个页面 |
| 字体 | `sandbox/conda-envs/font-tools/python.exe frontend/scripts/prepare-fonts.py --check` | 通过：**104 个字符** |
| 链接与资源 | `python frontend/scripts/check-preview.py` | 通过：72 页 / **5557** 处引用，无失效片段或重复 ID |
| 结构 | `python frontend/scripts/check-current-structure.py` | 通过：**95 项** |
| 导航回归 | `node frontend/scripts/check-navigation-fixes.cjs http://127.0.0.1:8766` | PASS |
| 排版与动效 | `node frontend/scripts/check-overview-typography.cjs http://127.0.0.1:8766` | PASS：72 页、**175 个楷体区域**、15 项宽度、吸附与呼吸关键帧、减少动态效果、首页背景字未新增动画 |
| **Django 测试** | `sandbox/.venv`（Python 3.10.8）+ `PYTHONPATH=sandbox/test-deps` | **Ran 45 tests, OK** |
| 打包预检 | `python deployment/package_preview.py --check` | 通过：**227** 个运行文件 |

**环境**：字体检查用隔离 Conda 环境 `sandbox/conda-envs/font-tools`（Python 3.12.15）；
Django 测试用 `sandbox/.venv` + `sandbox/test-deps`（**未向 Anaconda base 安装任何项目依赖**）。

### 2.2 服务器端检查

| 检查 | 结果 |
|---|---|
| `manage.py check` | `System check identified no issues (0 silenced).` |
| `makemigrations --check --dry-run` | `No changes detected` |
| `manage.py test content` | **Ran 45 tests, OK** |
| 迁移状态 | `0001`~`0004` **全部已应用**，无待应用迁移（本轮**没有新增迁移**） |

### 2.3 公网真实浏览器验收（`sandbox/check_public_typography.cjs`）→ **60 项通过，0 失败**

| 用户要求 | 实测结果 |
|---|---|
| 学院概况三个锚点、分区及**已发布后台正文** | 3 个分区、标题为「学院简介／组织机构／领导班子」、锚点 `section-1/2/3` 均在；**页面实际显示的是后台已发布的正文**（`【演示】学院概况·学院简介／组织机构／领导班子`），**不是静态占位页** |
| 分区背景交替 | `rgb(255,255,255)` 与 `rgb(243,246,250)` 交替 |
| 党建党务横幅英文 | 横幅为 **`PARTY BUILDING`**；分区英文 **`PARTY` / `LEARNING`** |
| 其他内页分区英文 | 科学与创新：`RESEARCH` / `PROGRESS` / `EXCHANGE` |
| **本机有楷体时实际使用本地字体** | CDP `CSS.getPlatformFontsForNode` 实测 5 处楷体区域**实际渲染为 `KaiTi`**；声明顺序 `KaiTi → 楷体 → Kaiti SC → STKaiti → KaiTi_GB2312 → IC WenKai → serif`；字重 400 |
| **模拟无本地楷体时的回退** | 注入 `--font-kai: "IC WenKai", serif` 后，实际渲染为 **`LXGW WenKai TC`（自托管）**，无系统字体混入 |
| 内页背景大字真实随时间渐隐渐显 | 动画名 `watermark-breathe`、时长 **8s**、状态 running；**真实时间采样** 0.000 → 0.112；固定时间点关键帧 `[0, 0.5, 1, 0.5, 0]`（透明→渐显→全显→渐隐→透明） |
| 正文不跟随闪动 | 正文 `animation-name: none` |
| 首页背景字没有新增呼吸 | 首页 5 个 `.section-watermark` 全部 `animation-name: none` |
| 减少动态效果模式 | 背景字 `animation-name: none`、`opacity: 1`（静态显示） |
| 桌面滚动吸附 | 停靠位置 312；滚轮 40 后中间态 244（未到位）；1.8s 后回到 **312**（对齐） |
| 移动端自然滚动 | 390 宽滚动到 600 后 `scrollY=600`，**未被强制吸附** |
| 320/390/768/1024/1440 无横向溢出 | 5 档宽度 × 5 个页面 = **25 组，scrollWidth 超出均为 0px** |
| 导航当前项未退化 | 通知公告页子菜单只高亮 `/notices.html` |
| 新闻分类未退化 | 三页均显示「学院新闻·通知公告·媒体掠影」 |
| 教师详情未退化 | 师资页仍显示 程纲 / 张锦龙 / 郑海务 |
| 后台内容展示未退化 | 详情页仍显示后台已发布正文；面包屑完整 |
| 资源版本 | 页面实际引用 `style.css?v=20261012-14`、`fonts.css?v=20261012-2`、`main.js?v=20261012-6`；**37 次样式请求全部 200** |
| 控制台与资源请求 | **无 CSP 拦截、无失败资源请求** |
| 后台公网隔离 | 8099 上 `/preview-admin/` 与 `/preview-admin/login/` 均 **404**、写请求 **405**；外网 8095/8096 **超时不可达** |

**截图与报告路径**

- `frontend/qa/pub-about-desktop.png`（学院概况桌面）
- `frontend/qa/pub-about-mobile.png`（学院概况 390 宽）
- `frontend/qa/pub-party-desktop.png`（党建党务桌面，含 PARTY BUILDING）
- `frontend/qa/pub-talent-desktop.png`（人才培养桌面）
- `frontend/qa/public-typography-checks.json`（60 项明细、字体请求、样式请求记录）

**代码一致性**：仓库内 332 个候选运行文件与线上 release 逐一哈希比对，
**227 个（部署包全部内容）归一化换行后 0 处差异**。

## 3. 备份与回退方法（不含凭据）

| 内容 | 位置 |
|---|---|
| 业务数据库备份 | `/srv/ic-college/shared/backups/ic-preview-before-typography-20261012.sqlite3`（完整性检查通过） |
| 旧 systemd 单元 | `/srv/ic-college/shared/backups/release-before-typography/` |
| 部署前 current 指向 | 同目录 `current.txt`（内容 `/srv/ic-college/releases/20261012.6`） |

**回退**：
```bash
ln -sfn /srv/ic-college/releases/20261012.6 /srv/ic-college/current
systemctl restart ic-preview ic-public-preview
```
本轮无迁移，回退代码即可；如需回退数据，用上面的备份文件（不覆盖用户同期编辑）。

## 4. 已有业务内容保留情况

部署前后**完全一致**：`article=82`、`publication=80`、`contententry=100`、`user=1`。

- 用户内容 **`news-111` 仍在**。
- **三位真实教师**（程纲、张锦龙、郑海务）资料**完整保留**，师资页顺序仍为程纲首位；
  本轮未改动教师数据。
- 上一轮录入的 12 篇新闻、12 篇通知、21 个栏目位置、2 位演示教师样例均未动。
- **未运行 seed、未重建或替换业务库**。

## 5. 本轮额外处理的一处构建产物问题

`frontend/preview/assets/` 与 `frontend/src/assets/` 中**同时残留新旧两个字体子集**
（旧的 41 字符 `ic-kai-headings-94898aaeb7a4.ttf` 已不再被 `fonts.css` 引用）。
该文件会被打进部署包（白名单收录 `.ttf`），属无效产物。
本轮**删除该陈旧文件**（两处），重新构建后复测通过；部署包由 228 文件降为 **227 文件**，
线上旧字体 URL 现返回 **404**。

## 6. 未完成或失败项

1. **无失败项**：本轮所有执行的检查与验收均通过。
2. **未执行**：手机/Pad **真机**验收；浏览器阅读模式；**弱网与逐帧动画采样**（未做 CDP 限速与
   Performance 采样，**未区分网络等待与掉帧**）；业务库恢复演练；专项安全验收；多角色权限人工验证。
3. **交付文档、接口文档、设计稿反向更新**仍交 Codex/GPT，本轮未写。
4. **`main` 未合并**（按本轮要求不自动合并）。
5. 学院正式材料（名单、政策、联系方式、二维码、备案号）仍未到位，相关位置仍为【演示】或占位。
6. 本轮浏览器验收为**桌面模拟宽度**，不等于真机；五种宽度无横向溢出已实测，但触控手感、
   移动端菜单展开、真机字体渲染**未验证**。
7. 上一轮的**本机代理**相关变更（Clash Verge `dns_config.yaml`）不在本仓库内，本轮未触碰，
   也未重新验证代理；其回执见[本机代理访问工作室官网修复回执](本机代理访问工作室官网修复回执_20261012.md)。
