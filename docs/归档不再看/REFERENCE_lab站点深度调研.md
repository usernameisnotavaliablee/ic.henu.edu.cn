# lab.henu.edu.cn 站点深度调研

> 调研对象：https://lab.henu.edu.cn/
> 调研时间：2026-10-12
> 调研方式：curl 抓源码 + 响应头分析 + 路径探测 + DNS/证书检查（未登录后台）
> 结论先行：**该站是河南大学纳米科学与材料工程学院官网，跑在博达（Webber/VSB9）校级站群上，与 www/mse/news 等子站共用同一 IP 前置。此事实直接印证 ic.henu.edu.cn「优先走校级站群」的技术路线。**

---

## 1. 站点身份

| 项 | 值 |
|---|---|
| 域名 | lab.henu.edu.cn（"lab" 实为学院缩写，非实验室） |
| 站点名称 | 河南大学纳米科学与材料工程学院 |
| 页面标题 | `<title>河南大学纳米科学与材料工程学院</title>` |
| 语言 | 中文（`zw/` 目录）+ English（`yw.htm`，双语分站） |
| 编码 | UTF-8（页面声明，响应头 `Content-Language: zh-CN`） |

页脚联系信息：

- 地址：中国郑州河南大学龙子湖校区、开封河南大学金明校区
- 邮编：475004 ｜ 电话：0371-22687375 ｜ 研招办：0371-22687369
- E-mail：Yuanban2023@163.com
- 技术支持：**蓝创科技**（页面制作/实施方，郑州蓝创——本地建站服务商）

---

## 2. 备案与合规

| 项 | 值 | 来源 |
|---|---|---|
| ICP 备案 | **豫ICP备05002499号-1** | www.henu.edu.cn 主站页脚 |
| 公安备案 | **豫公网安备 41020302000011号** | www.henu.edu.cn 主站页脚 |
| lab 子站页脚 | **未悬挂备案号**（仅版权所有 + 技术支持） | 实测首页页脚 |

注意点：

- 备案挂在 `henu.edu.cn` 主域上，子站共用。lab 子站页脚没有放备案号——严格按《非经营性互联网信息服务备案管理办法》，子站页脚也应悬挂，这是个合规瑕疵（但校级站群普遍如此，ICP 备案按主域覆盖）。
- CSP 头中放行 `*.conac.cn`（中网/政务和公益机构域名注册）——说明学校纳入了事业单位域名管理体系。

## 3. 托管与网络

| 项 | 值 |
|---|---|
| 解析 IP | **58.212.123.41** |
| IP 归属 | AS4134 CHINANET（中国电信骨干；地理位置登记为江苏南京） |
| 同 IP 域名 | `www.henu.edu.cn` / `mse.henu.edu.cn` / `news.henu.edu.cn` / `lab.henu.edu.cn` **全部解析到同一 IP** |
| HTTP→HTTPS | **不做跳转**，80/443 均返回 200（两协议皆可访问，属安全瑕疵） |
| Server 头 | `WebServer/X.X.X`（刻意隐藏，非标准 nginx/Apache 指纹）→ 前置为统一 WAF/站群网关 |
| 证书 | `*.henu.edu.cn` 通配符，GoGetSSL RSA DV（廉价 DV 证书），有效期 2026-09-15 → 2027-04-01（约 6 个月短周期，自动续签节奏） |
| 缓存 | `Cache-Control: private, max-age=600`、ETag、`Vary: User-Agent`（服务端按 UA 出 PC/移动版） |

推断：全校 `*.henu.edu.cn` 站点统一经一个电信机房的前置网关（WAF + 反向代理）进出，后端是校站群集群。**服务器不在河南本地，在学校租用的统一站群机房/云上**。

### 安全响应头（首页实测）

```
Content-Security-Policy: default-src 'self' data: blob: *.henu.edu.cn *.bcebos.com
  *.conac.cn *.eol.cn *.staticfile.net *.edu.cn *.staticfile.org *.jiathis.com
  *.baidu.com *.bshare.cn *.qq.com *.kaipuyun.cn 'unsafe-inline' 'unsafe-eval';
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer-when-downgrade
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: master-only
```

- CSP 白名单含 `*.kaipuyun.cn`（开普云——提供政府/高校网站**云监测**服务，说明学校购买了网站监测）和百度统计、jiathis/bshare 分享组件（历史遗留白名单）。
- `'unsafe-inline' 'unsafe-eval'` 放行——CSP 实际防护力有限，主要为兼容旧内联脚本。

---

## 4. 后端 / CMS 系统

**判定：西安博达软件「博达网站群管理平台」（VSB 系，业内称 VSB9/Webber）——高校站群市占率最高的产品。**

证据链（均实测于页面源码）：

| 特征 | 出处 |
|---|---|
| `/system/resource/js/...` 系统资源路径 | jquery、ajax.js、base64.js、dynclicks.js 等 |
| `/system/resource/js/vsbscreen.min.js`（`id="_vsbscreen" devices="pc|mobile|pad"`） | VSB 标志性多屏适配脚本 |
| `index.vsb.css` | VSB 模板样式命名 |
| `<!--#begineditable name="漂浮广告一" action="webber.wbst.com.image.ColumnImage" ...-->` | Webber 组件标签（webber.wbst = 博达组件 action） |
| `_sitegray/_sitegray.js` | VSB 标配全站变灰脚本（哀悼日模式，基于 James Padolsey grayscale.js） |
| `info/1158/6262.htm` 文章 URL 结构（栏目ID/文章ID） | VSB 经典 URL 模式 |
| `_showDynClicks/_showDynClickBatch(..., "wbnews", ...)` | wbnews 新闻表点击量统计接口 |
| `<meta name="pageType" content="1/3">` | VSB 页面类型元标（1=首页，3=文章页） |
| 版权组件注释 `<!-- 版权内容请在本组件"内容配置-版权"处填写 -->` | VSB 可视化组件编辑模式 |

### 后台管理

- 入口探测：`/system/` → 200，返回 GBK 编码「系统提示：您需要登录后才可访问系统」页（含 auth.css）→ **后台管理端就部署在站群内 `/system/` 路径下，登录后进入**；登录界面本身不在公网直接暴露（需从站群统一控制台或带鉴权入口进入）。
- `/admin/`、`/sso/`、`/system/login.jsp` 均 404——无独立暴露的登录页。
- 内容编辑模式：可视化组件式（页面上 `begineditable/endeditable` 注释圈出每个可编辑区块：轮播、栏目、版权、漂浮广告），编辑在后台画布上拖拽配置，发布时**生成静态 HTML**——整站页面是静态化产物（Last-Modified 头 + ETag 可证）。
- 动态能力保留在服务端组件：点击量统计（dynclicks→wbnews）、站内搜索（见下）。

### 站内搜索（新版 AOP 架构）

搜索不走传统 CGI，是博达新一代 AOP 前端应用：

- 首页内嵌 Vue + axios 调用 `POST /aop_component//webber/search/test` 做联想；
- 结果页 `/aop_views/search/modules/resultpc/soso.html`（标题「智能搜索」）；
- 技术栈：`vue.min.js` + `vue-i18n` + `vue-datepicker-local` + `Fingerprint2.js`（浏览器指纹，用于搜索风控）+ `base64.js`，样式 `soso.css?v=1.4.0`；
- 支持按日期筛选、多语言提示——功能比老式 jsp 检索强一档。

---

## 5. 前端技术栈

**渲染模式：服务端静态化 HTML + jQuery 时代交互层；搜索等局部用 Vue2 组件。无 SPA、无构建产物（无 webpack/vite 指纹）、无 CSS 框架。**

### JS 库清单（首页实测加载）

| 文件 | 用途 |
|---|---|
| `js/3min.js` | **jQuery（混淆改名版）**——源码即 jQuery 本体混淆 |
| `/system/resource/js/jquery/jquery-latest.min.js` | 系统层 jQuery |
| `js/jquery.SuperSlide.js` | 焦点图/轮播插件（国产 SuperSlide 2.x） |
| `js/zturn.js` | 3D 翻转轮播（研究平台/课题组卡片用） |
| `js/index.js` | 回顶部、导航交互等站点脚本 |
| `/system/resource/js/vsbscreen.min.js` | PC/移动/平板三端适配分发 |
| `/system/resource/js/dynclicks.js` `counter.js` `ajax.js` `base64.js` `centerCutImg.js` | VSB 系统组件：点击统计、计数器、ajax、图片裁剪 |
| `/system/resource/vue/*` | Vue2 + axios + bluebird + polyfill + Element UI（`element/index.js` + `index.css`）+ token.js —— 为搜索/表单类组件准备的整包 |

页面还内嵌大段 IE 时代遗留代码（`attachEvent` 兼容、`DXImageTransform.Microsoft.Alpha` 滤镜 iframe 遮罩 trick）——模板年代久远但仍在服役。

### 样式

- 5 套响应式 CSS：`css/index.css` + `index_ipad.css` / `index_medium.css` / `index_small.css` / `index_phone.css`（配合 vsbscreen 按设备出不同样式表，`Vary: User-Agent`）；
- `index.vsb.css` 为系统层；
- 无 Tailwind/Bootstrap 等框架指纹，手写 BEM-less 命名（`.titleline .blueline` 等）。

### 字体（实测全站）

- **正文字体：`"Microsoft YaHei", sans-serif`（含 `!important` 强刷）**——即微软雅黑，依赖用户系统字体，**无任何 webfont（无 @font-face、无 woff/ttf 加载）**；
- 局部内联样式出现一次 `font-family:宋体`（表格正文遗留）；
- 英文/数字走 sans-serif 兜底。

→ 对 ic.henu.edu.cn 的含义：站群模板惯例就是「系统雅黑 + 宋体」，若想要思源宋/思源黑等 webfont 需要在站群模板层申请自定义，技术上可行（CSP `default-src 'self'` 允许本站字体文件）。

### 图标与图像

- 图标全部为**切图 PNG**（`images/icon_search2_n.png`、`jt_left_n.png` 等，无 iconfont/SVG sprite）；
- 轮播大图 `images/banner111~777.jpg` + `__local/` 路径下的 VSB 上传资源；
- `images/ewm_n.png` 二维码、`bottomlogo_n.png` 页脚校名图。

---

## 6. 前端页面组成

### 首页板块（自上而下）

1. 顶部工具条：校名 logo + 站内搜索框（Vue 联想）+ 中/English 切换
2. 主导航（下拉二级）：见栏目树
3. Banner 轮播（7 张，SuperSlide）
4. 图片新闻 Photo News（图片轮播区）
5. 新闻速递 News Express + 通知公告 Notices
6. 学术交流 Exchange + 研究进展 Research Progress
7. 研究平台 Platforms + 课题组 Groups（zturn 3D 卡片轮播）
8. 友情链接/校内链接下拉（`<select>` 跳转：中国材料研究学会、国家知识产权局、河南大学、大型仪器平台、教务处、实验室与设备管理处、人事处、科学技术研究院）
9. 页脚：地址/邮编/电话/邮箱/版权/技术支持
10. 漂浮元素：回顶部按钮、2 个被注释掉的漂浮广告组件（VSB 组件残留）

首页直出 59 个 `info/` 文章链接——VSB 静态化把最新文章标题全量写进首页。

### 栏目树（导航实测）

```
首页
├─ 学院概况：简介 | 学术委员会 | 管理机构 | 先贤风采
├─ 师资队伍：高层次人才 | 教师名单
├─ 科学研究：科研机构 | 技术部 | 大型仪器 | （研究进展/学术交流挂在首页板块）
├─ 制度建设：工作条例 | 规章制度
├─ 人才培养：本科生培养方案 | 研究生培养方案
├─ 招生就业：本科生招生 | 研究生招生 | 就业创业
├─ 师生园地：团学建设 | 管理制度 | 学子风采 | 教授足球队
├─ 纳米天地：纳米简介 | 纳米进展
├─ 媒体掠影
└─ English（yw.htm 独立英文站）
```

另有「课题组」页群：`zw/ktz/` 下每位 PI 一个静态页（`b_f_Bai_F.htm` 等 18 个，命名规则 `姓全拼_首字母.htm`）。

### 页面类型（meta pageType）

- `pageType=1`：首页
- `pageType=3`：文章页（`info/<栏目ID>/<文章ID>.htm`，含点击量统计脚本）
- 栏目列表页：`zw/**.htm`（分页 `xxx/1.htm` 递增）

---

## 7. 运维与杂项

- **全站变灰**：`_sitegray.js` 已部署（哀悼日一键变灰，校宣传统一要求）。
- **无障碍**：仅 viewport/alt 基础水平，未见 aria/无障碍改造。
- **robots.txt**：无（404）。
- **sitemap**：无独立 sitemap.xml。
- **SEO**：meta keywords/description 齐备（VSB 自动生成）。
- **更新频率**：首页 `Last-Modified: 2026-10-09`（调研前 3 天），站点活跃维护中。
- **跨站联动**：科研机构-技术部 链接指向 `mse.henu.edu.cn`（材料学院站）——学院间页面互通靠直接外链。

---

## 8. 对 ic.henu.edu.cn 的启示（结论）

1. **走站群=走博达 VSB**。lab/mse/www/news 全在同一平台同一 IP，学校站群已是既成事实——申请子站等于在这套 Webber 后台里开一个新站点，**零备案成本**（主域备案覆盖）、零服务器成本、自带 HTTPS/WAF/搜索/统计/变灰/双语机制。
2. **能做/不能做的边界**：
   - ✅ 栏目、文章、轮播、图片、漂浮窗、友情链接、版权信息——后台可视化配；
   - ✅ 字体、配色、版式——需让站群管理员/蓝创这类实施方改模板（子站管理员多半只能改内容，模板归校级管理员）；
   - ⚠️ 自定义 JS/CSS、webfont、特殊交互——原则上可行（`unsafe-inline` 都放行）但要走校级审批；
   - ❌ 自建数据库/后端接口/登录系统——站群不开放，只有静态化 + 系统自带组件（搜索、点击统计、留言板等）。
3. **设计参考**：lab 站的「中文 zw/ + English yw/ 双语目录 + 5 套响应式 CSS + 雅黑字体」就是校站群学院站的标准形态；ic 学院站大概率拿到同款模板或新一代模板（此站模板偏旧，IE 遗留代码多）。
4. **可借鉴栏目**：学院概况/师资队伍/科研/制度/培养/招生就业/师生园地 的六段式是河大学院站通用骨架，素材清单可直接对齐。
5. **联系人线索**：页脚「技术支持：蓝创科技」——该校站群学院的实施多由蓝创科技承建，申请子站时信息化办大概率也会对接它或同类厂商。

---

## 附录：探测记录

```bash
# 响应头 / 证书 / IP
curl -sI https://lab.henu.edu.cn/           # Server: WebServer/X.X.X + 全套安全头
openssl s_client -connect lab.henu.edu.cn:443  # *.henu.edu.cn GoGetSSL DV
dig +short lab.henu.edu.cn                # 58.212.123.41（www/mse/news 同 IP）

# 后台探测
curl -sI https://lab.henu.edu.cn/system/  # 200 → GBK「您需要登录后才可访问系统」
# robots.txt /admin/ /sso/ /system/login.jsp → 404

# 关键页面存档（本次调研抓取，存 /tmp，未入库）
# /tmp/lab_index.html (52KB) /tmp/lab_article.html /tmp/lab_list.html
# /tmp/lab_soso.html（智能搜索）/tmp/lab_system.html（后台拦截页）
```
