# Claude Code 本轮部署回执（导航与子板块修复）

日期：2026-10-12。执行：Claude Code。本文只记录**实际做到并验证过**的事；未运行的检查逐项标明。
本文不含任何口令或密钥。

承接[第二轮回执](ClaudeCode本轮部署与内容充实回执_20261012_第二轮.md)。本轮内容：部署 Codex 的导航与子板块修复，
修正部署中发现的子菜单当前项判定缺陷，并做公网验收。**未新增迁移，未重新录入业务内容。**

---

## 1. 发布版本、分支、提交号及推送结果

| 项 | 值 |
|---|---|
| 公网前台 | **http://47.94.146.53:8099/**（只读，无需登录/隧道） |
| 私有后台 | `http://127.0.0.1:8095/preview-admin/`（**仍只监听回环**，需 SSH 隧道；公网 `/preview-admin/` 404、写请求 405） |
| 服务器 release | **`/srv/ic-college/releases/20261012.6`**（`current`） |
| 部署包 | 226 个文件，SHA256 `f349318c48660b27bba6f5f3…` |
| CSS 缓存版本 | **`style.css?v=20261012-11`**（浏览器实测请求到的即此版本） |
| Git 分支 | `codex/site-development` |
| 本轮提交 | **`8e636e1`**（导航与子板块修复，含我补的子菜单判定修正） |
| 推送 | 见第 7 节（提交与推送结果） |

> 说明：本轮先部署了 `20261012.5`（Codex 原始修复），随后在验收中发现子菜单当前项判定缺陷，
> 修复后重新构建部署为 `20261012.6`。`20261012.5` 保留但已被取代。

## 2. 备份与回滚位置（不含密钥）

| 内容 | 位置 |
|---|---|
| 部署前业务库备份 | `/srv/ic-college/shared/backups/ic-preview-before-navfix-20261012.sqlite3`（完整性检查通过） |
| 旧 systemd 单元 | `/srv/ic-college/shared/backups/release-before-navfix/` |
| 部署前 current 指向 | 同目录 `current.txt`（内容为 `/srv/ic-college/releases/20261012.4`） |
| 仍保留的旧版本 | `20261012.1` ~ `20261012.6` 全部保留 |

**回滚**：`ln -sfn /srv/ic-college/releases/20261012.4 /srv/ic-college/current && systemctl restart ic-preview ic-public-preview`

**业务数据未变**：部署前后均为 `article=82 / publication=80 / contententry=100`。本轮无迁移。

## 3. 公网样例链接

| 用途 | 链接 |
|---|---|
| 学院新闻（子菜单当前项修复） | http://47.94.146.53:8099/news.html |
| 通知公告（**原错误高亮已修正**） | http://47.94.146.53:8099/notices.html |
| 媒体掠影（**原错误高亮已修正**） | http://47.94.146.53:8099/media.html |
| 媒体掠影列表 | http://47.94.146.53:8099/media-section-1.html |
| 人才培养（学科与专业／课程与培养方案两分区） | http://47.94.146.53:8099/talent-cultivation.html |
| 科学与创新（三个子板块交替背景） | http://47.94.146.53:8099/science-innovation.html |
| 招生就业（三个子板块交替背景） | http://47.94.146.53:8099/admissions.html |
| 就业指导列表（分页，未退化） | http://47.94.146.53:8099/admissions-section-3.html |
| 详情面包屑（未退化） | http://47.94.146.53:8099/entry-career-resume-ability.html |

## 4. 实际执行的测试与浏览器验收

**本地（当前代码重新执行，未沿用旧结果）**

| 检查 | 结果 |
|---|---|
| `node frontend/scripts/build-site.js` | 72 个页面 |
| `check-preview.py` | 通过：72 页 / **5570** 处链接与资源，无失效片段或重复 ID |
| `check-current-structure.py` | 通过：**95 项** |
| `check-header-motion.cjs` | 5 项通过 |
| `check-media-loading.cjs` | 6 项通过 |
| `check-page-transition.cjs` | 5 项通过 |
| `prepare-fonts.py --check` | 通过：41 个字符 |
| `test_release_assets.py` | 7 项通过 |
| `package_preview.py --check` | **226** 个运行文件 |

**服务器（新 release 上执行）**

| 检查 | 结果 |
|---|---|
| `manage.py check` | `System check identified no issues (0 silenced).` |
| `makemigrations --check --dry-run` | `No changes detected` |
| `manage.py test content` | **Ran 45 tests, OK** |

**公网真实浏览器验收（`sandbox/check_navfix.cjs`）→ 64 项通过，0 失败**

| 用户要求 | 实测结果 |
|---|---|
| 1 下拉当前项未悬停即可见 | 新闻页子项 `color=rgb(18,62,112)` / `bg=rgb(234,242,249)`，**悬停前后与移出后颜色不变**；通知公告、媒体掠影页各自**只高亮自身项** |
| 2 三个分类入口 | news / notices / media / media-section-1 四页均显示「学院新闻·通知公告·媒体掠影」且选中态正确；点击可相互切换 |
| 3 子板块背景与边界 | 人才培养(2)、科学与创新(3)、招生就业(3) 子板块**背景交替**（`#f2f6fb` / `#f4f8f6`），`padding-top=32px`、`border-top=3px` |
| 4 桌面与手机无横向溢出 | 1440 / 1024 / 768 / 390 / 320 五种宽度 × 5 个页面，**scrollWidth 超出均为 0px** |
| 5 页脚工作室 | 链接为 `https://hdwzgzs.cn/`，徽标仍在，与版权/备案**同一条底栏**且不溢出 |
| 6 新 CSS 版本 | 浏览器请求 `style.css?v=20261012-11`，全部 13 次请求 **200** |
| 7 既有功能未退化 | 列表分页仍在（共 12 条 / 2 页）；详情面包屑完整；**页头滚动收缩实测 171px → 91px**；多级导航结构在；跨页导航与浏览器后退正常；无 CSP 拦截 |

**截图与证据**（在仓库既有 QA 目录）

- `frontend/qa/navfix-submenu-current.png`（子菜单当前项）
- `frontend/qa/navfix-sections-desktop.png`（子板块交替背景，整页）
- `frontend/qa/navfix-media-mobile.png`（390px 宽媒体掠影）
- `frontend/qa/navfix-checks.json`（验收明细与 CSS 请求记录）
- `frontend/qa/section-colors-desktop.png`（Codex 原有脚本产出的区块配色图）

**我额外修正的一处缺陷（不在 Codex 本轮修复清单内）**

验收时发现：`notices.html` 与 `media.html` 的子菜单**错误高亮「学院新闻」**。
根因是生成 Django 模板时，**顶层导航与子菜单都用了 `active_page`**，而这两页的 `active_page`
都是 `news.html`。本轮 CSS 修复让子菜单当前项有了明显配色，反而把这个错误高亮暴露出来。

修法：顶层导航仍按 `active_page`；**子菜单改按当前请求路径 `request.path` 判断**（`request` 上下文处理器
本就启用，无需改各视图）。静态页同步修正为按当前页面判定。修复后三页各自高亮自身项，已实测通过。

## 5. 工作室官网访问问题：**已复现，并定位到本机系统代理**

**复现结果**

| 方式 | 结果 |
|---|---|
| DNS 解析 | 正常，返回 Cloudflare 地址（含 IPv6） |
| curl 直连（不经代理） | `https://hdwzgzs.cn/` → 301 → `/studio` → **200** |
| curl 经系统代理 `127.0.0.1:7897` | **TLS 握手失败**（`schannel: failed to receive handshake`） |
| 浏览器（Edge，默认设置，继承系统代理） | **`net::ERR_CONNECTION_CLOSED`** |
| 浏览器 `--no-proxy-server` | **HTTP 200**，标题「河南大学网站工作室 \| HENU Web Studio」 |
| 浏览器显式 `direct://` | **HTTP 200** |
| 对照：浏览器访问 `https://www.baidu.com/` | 200（说明浏览器 HTTPS 本身正常） |
| 对照：浏览器访问 `https://www.henu.edu.cn/` | 405（已连通） |

**系统代理设置（只读读取，未修改）**：`ProxyEnable=0x1`、`ProxyServer=127.0.0.1:7897`、
`ProxyOverride` 为常见内网段与 `<local>`（**该域名不在绕过列表内**）。

**判断**：本机浏览器打不开该站点的原因指向**本地代理 `127.0.0.1:7897` 对该域名的处理**，
而不是站点本身或 DNS。平板能打开，与平板未走同一代理相符。

**未复现的部分 / 不能下结论的部分**

- **未确认为什么该代理对这个域名失败**（可能是代理规则分流到不可用节点，或 TLS 被中间处理）。
  这个判断需要看代理软件自身的日志与规则，本轮**没有读取或修改代理配置**。
- 我**没有**修改系统代理、DNS、hosts、证书，也没有关闭任何安全校验。
- 因此**不能宣称"网络问题已修复"**——只报告可复现的证据与指向。

**给用户的建议（由其自行决定）**：在该代理软件的规则里，把 `hdwzgzs.cn` 设为直连，
或临时关闭系统代理后再打开该站点；也可在该代理的日志中查看请求该域名时的报错。

## 6. 保留的真实资料与未完成项

**保留**：`news-111`、全部新闻通知、三位真实教师完整资料、研究方向与课题组的关联关系、
100 条后台内容全部未动（部署前后计数一致）。本轮**未新增或修改任何业务内容**。

**未完成（如实标注，未视为通过）**

1. **手机／Pad 真机验收** —— 未做；五种视口是桌面浏览器模拟。
2. **浏览器阅读模式、跨设备字形一致性** —— 未做。
3. **弱网与逐帧动画验收** —— 未做 CDP 限速与 Performance 采样，**未区分网络等待与掉帧**。
4. **业务库恢复演练** —— 未做。
5. **专项安全验收** —— 未做；45 项测试全绿**不等于**安全验收通过。
6. **多角色权限的人工浏览器验证** —— 未做。
7. **交付文档、接口文档、设计稿反向更新** —— 按先前指示交 Codex/GPT，本轮未写。
8. **工作室官网问题的根因** —— 只定位到系统代理，未查明代理为何失败（见第 5 节）。
9. 学院正式材料（名单、政策、联系方式、二维码、备案号）仍未到位，相关位置仍为【演示】或占位。

## 7. Git 与提交

- 分支 `codex/site-development`，提交 **`8e636e1`**（导航与子板块修复）。
  提交与推送结果在归档回执时一并执行，最终哈希见仓库 `git log`。
- 改动集中在 `frontend/src/`（CSS、footer、document 模板）、`frontend/scripts/`（build-site.js
  与检查脚本）、`backend/templates/site/`（list、collection、新增 news_tabs）与重新生成的 72 个页面。
- 拉取远端后 `origin/main` 与 `origin/codex/site-development` 均无新提交，本轮**无冲突**，
  **未强推、未覆盖队友改动**。
- **未入库**：数据库、凭据、`sandbox/`（含本轮探测脚本 `probe_studio*.cjs`）与本地测试依赖。
- **线上版本 = 提交版本**：仓库内 318 个候选运行文件与线上 release 逐一哈希比对，
  **226 个（部署包全部内容）归一化换行后 0 处差异**。
