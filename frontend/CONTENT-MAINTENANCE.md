# 内容接入与维护对照

2026-10-15，依据[已确认方案](../docs/前端开发确认方案_20261015.md)。实施及验收状态只记在 [STATUS](../STATUS.md)。本文件是前端数据输入契约，不是已上线的 REST API，也不是博达组件语法。

## 数据流与修改入口

平台已发布数据 → 平台适配器 → 以下展示对象 → 共享组件 → 页面。当前静态适配器用 `src/data` 的对象；旧 Django 适配器读取发布快照；博达适配器尚未实施。浏览器脚本只操作 DOM，不接触数据库，也不发送发布请求。

| 页面位置 | 唯一输入位置与主要字段 | 空值、排序及点击规则 | 后续博达维护对象（具体字段待实测） |
|---|---|---|---|
| 栏目、菜单、面包屑 | `src/data/columns.js`：id、parentId、url、sections、navigation、storageKey、legacyKeys、aliasOf | 名称和层级从同一声明投影；旧地址兼容；普通栏目入口保留 | 栏目树及模板绑定 |
| 院名、徽标、院训、页脚 | `site.js`：name、college、english、brand.logo/logoAlt/motto/footerEnglish/filing | 默认校徽可替换；不填虚构备案；页脚工作室设计保留 | 站点资料或公共头尾组件 |
| 首页轮播 | `site.js`：slides[]；id、image、alt、title、eyebrow、text、note、theme、order、enabled | 稳定 id 不随位置变；enabled=false 排除；按 order；数量生成总数和圆点；装饰图无跳转 | 图片列表及启用/排序 |
| 首页区块标题、说明、图片、入口 | `home.js`：headings、research、education、topics、facultyNote；关联栏目只填稳定 column ID | 不在 HTML 中复制栏目地址；科研三卡整块文字区跳转，图片不跳，来源独立链接 | 首页图文和栏目推荐组件 |
| 学院简介、管理机构说明 | `entries.js.blocks[storageKey]`；published、visible、sections、image/imageAlt、caption、sourceLabel/sourceUrl | 无正式内容显示栏目介绍及整理中提示；正文图片放入共享图文侧栏，缺图回退 `overview.js` 的校园示意图，不重复输出 | 单篇介绍或固定图文 |
| 机构成员、科研、团队、仪器、团学、制度等集合 | `entries.js.collections[storageKey]`；见下方 ContentRecord | 概览最多三条，栏目页列出已发布记录，单击独立详情；空时说明栏目用途并提示整理中；制度按发布日期倒序 | 栏目文章/机构名录/仪器条目 |
| 空栏目的介绍文案 | `empty-content.json`：message、descriptions[稳定内容key或人才类别ID] | 共享组件在无内容时显示；正式内容优先，不创建假教师、活动、制度或业务条目 | 模板的空数据分支；不需要录为文章 |
| 新闻、通知 | `site.js.news/notices`；slug、published、visible、title、summary、date、image、imageAlt、caption、sections、sourceLabel/sourceUrl、attachments | 首页新闻最多四条、通知三条；日期倒序；详情保留全文；layoutOnly=true 是旧版式样例；无正式输入时静态审核使用独立preview-content演示，不作为平台发布内容 | 新闻资料源，首页/列表/详情共用 |
| 教师资料 | `teachers.js`；见下方 Teacher | 一人一份资料、一个详情；未分类保留完整名录；首页最多三位 | 教师资料源 |
| 人才类别与获评年份 | `faculty-categories.json`＋`faculty-memberships.json` | 六类排序固定；先筛选可见教师再判空。国家级两类 showWhenEmpty=true，空时保留标题及整理中提示；其余空组隐藏。显式 enabled=false 仍隐藏 | 人才类别与教师关联；多称号实现方式待核实 |
| 联系方式 | `site.js.contact`：address、phone、email | 暂缺标明待提供，不伪造；仅展示公开联系方式 | 站点资料 |
| 公众号和官网二维码 | `site.js.qr.wechat/website`：enabled、image、name、caption | 联系页与页脚仅公众号缺图时保留虚线占位；官网缺图不显示卡片，有图后显示。enabled=false仍隐藏 | 站点图片字段 |
| 校内/校外友情链接 | `friendly-links.js`：id、name、url、group、order、enabled | 分 internal/external，按 order；无有效 URL/禁用则不展示；联系页两组抽屉默认收起，点击展开；页脚工作室原入口保留 | 两组链接列表，抽屉交互无需增加数据字段 |

正式业务内容通过平台后台维护。静态输入对象用于开发、审核和平台适配，不是让日常维护人员直接改 JavaScript。三档人才测试数据只在 `scripts/fixtures` 和 `sandbox`，不进入正式资料源。按用户追加要求，本地新闻/通知/媒体掠影使用 `src/data/preview-content.js` 的独立【演示】条目：四条新闻、三条通知、三条媒体，含日期、摘要及正文，列表末尾提示整理中。`lib/preview-content.js` 只为静态审核选择演示；存在正式输入（包括草稿/撤下）时不补入。演示不进入 content-catalog、seed 或业务库；学校上线应替换为已审核平台内容，不能直接将审核HTML当作正式内容发布。

## Teacher、Category、Membership

```js
// 示意结构，不是实际学院名单。发布之前须有审定材料。
const teacher = {
  id: 'stable-person-id', slug: 'stable-person-id',
  name: '姓名', title: '职称', summary: '可选卡片摘要', intro: '完整个人简介',
  image: 'assets/approved-portrait.jpg', field: '研究领域', order: 10,
  published: true, visible: true,
  sections: [{title:'研究与教学', paragraphs:['经审定正文'], items:[]}],
  email:'', secondaryEmail:'', phone:'', group:'', source:'', sourceLabel:''
};
const membership = {teacherId:'stable-person-id', categoryId:'national-young', year:2015};
```

`id` 是稳定身份，不以姓名或数组位置代替。当前三位资料已有明确 id、slug、order。本地已有教师默认可见；平台适配时必须显式传入发布和可见状态。摘要取 summary，未填时取 intro，但只在卡片截断，详情不裁剪。可选章节没有段落/条目就不输出标题。

类别统一包含 `id / label / group / priority / display / enabled`：

| priority | id | 名称 | display |
|---|---|---|---|
| 1 | national-leading | 国家级领军人才 | portrait |
| 2 | national-young | 国家级青年人才 | portrait |
| 3 | provincial-professor | 河南省特聘教授 | compact |
| 4 | yellow-river-mingde | 河南大学“黄河学者”/明德特聘教授 | compact |
| 5 | university-professor | 河南大学校特聘教授 | compact |
| 6 | hundred-talents | 河南大学百人计划 | compact |
| 100 | regular | 普通教师 | names |

前六类 group=talent，最后一类 group=regular。获评年份属于关系，选填四位年；不输出空括号。同一个 teacherId/categoryId 不可重复，缺失教师引用会阻止构建。旧 `other-talent` 关系记录保留为 legacyCategories，仍可在完整名录访问，不擅自归入新的六类。未分类不是普通教师。

`scripts/lib/faculty.js` 唯一负责筛选、分组、排序、首页去重。首页按最高有效分类优先级、人工 order、稳定 id 排序取三人；国家级内页 3:4 大照片＋三行摘要，后四类圆形小照片＋姓名职称，普通教师只列姓名。首页和完整教师名录沿用原卡片。现三位 order 为程纲 10、郑海务 20、张锦龙 30；正式称号关系目前为空，绝不根据旧履历自动填称号。

## ContentRecord 与正文

```js
{
  id:'stable-record-id', title:'标题', summary:'列表摘要',
  published:true, visible:true, date:'2026-10-15', order:100,
  image:'assets/approved-photo.jpg', imageAlt:'图片替代文字', caption:'图注',
  sections:[{title:'可选小标题', paragraphs:['一段正文'], items:['列表项']}],
  sourceLabel:'审定来源', sourceUrl:'https://official.example/',
  attachments:[{name:'附件名称',url:'assets/approved-file.pdf'}],
  serviceLabel:'预约平台', serviceUrl:'https://official.example/'
}
```

以上域名与文件名仅解释字段，不作为页面默认数据。附件文件需由平台实际提供；当前静态资源构建只收已有 assets，Django 上传/附件模型尚未实现。模板不接收任意原始 HTML；文字经转义，段落/列表用共享渲染器输出，外链接受 HTTP/HTTPS。平台富文本需要在适配层转换或按平台机制清理，不能直接绕过这里的输入契约。

集合数据以 storageKey 或已有 legacyKeys 输入，按稳定 id 合并；同 id 有冲突内容会拒绝构建。普通集合先 order、再 date 倒序、再 id；制度 date 倒序为首要规则，上传时间不参与。空日期排末尾，不显示伪造日期。静态详情生成 `content-<id>.html`；Django 仍使用已有 `entry-*` / `record-*` 地址，博达使用平台实际详情 URL。适配器负责 URL 映射，不把这三种地址混写为已上线接口。

## 旧地址与现有 Django 的边界

| 旧地址/数据 | 本轮处理 |
|---|---|
| management-committee.html / management.section-2 | 地址、数据不变，父级改为学院概况 |
| about.section-3 / management-leadership.html | 仍是管理机构下领导班子 |
| regulations.html、regulations-section-1/2.html | 兼容显示统一制度列表，父级人才培养 → 师生园地 |
| regulations.section-1/2、community.section-3 | 按阅读映射合并；未批量改数据库、未复制正文 |
| public-service.html、public-service-section-1.html | 保留旧服务指南阅读页；不在导航/概览新增服务菜单 |
| site-map.html、404.html | 保留功能性入口及 404 的网站导航链接 |
| layout-* | 旧版式地址兼容；不作为业务列表条目，也不通过Django暴露未发布详情 |
| news-preview-*、notice-preview-*、content-demo-media-* | 静态审核演示详情；不进入业务目录或seed，Django无发布记录时返回404 |

本轮 Django 仅改展示兼容：读取新栏目目录、兼容旧集合归属/分类值、首页取前三人、按类别 showWhenEmpty 处理空态、二维码条件显示、共享三档组件和友情链接抽屉。不增加数据库字段或迁移，不更新已有业务库。旧管理表单仍只能给教师选一个 teacher_category，不能维护多称号与获评年份；新前端能力不能写成后台已完成。旧轮播仍按槽位编辑，撤下回退默认；前端 enabled/order 契约不表示旧后台已支持这些操作。

## 收集材料与接入验收

Word 资料收集统一包含：资料标识/标题、所属栏目、正文、发布日期、图片与替代说明、来源与使用许可、审核人/确认日期。教师另填职称、简介摘要、完整履历、每个称号与年份、人工顺序；机构另填成员/职务/分工；课题组另填负责人/方向/成员；仪器另填规格/用途/共享规则/核准服务 URL；制度另填适用对象、附件及生效日期（与发布日期分开）。没有资料保留空值，不把“暂无”“无”塞进每个可选段落。

先按统一字段收集 Word，再由维护人员在博达录入/粘贴、预览、发布。自动解析和批量导入未实现。本研招生与就业指导已提到人才培养直接下级；招生与培养最终拆分命名、博达实施分工继续暂缓。旧admissions.html仅作兼容概览，读取同一集合。科研页课题组大区块读取research-groups.section-1，不另维护副本。

后续平台验收需实际跑通：新增新闻 → 首页/列表/详情一致；修改草稿不提前公开；发布后同步；撤下后移除；教师多称号/年份/排序；国家级空类保留、其余空类隐藏；二维码增删；图片附件；移动端。用户目前只验证 `icme.henu.edu.cn` 整站界面预览，这些动态链路尚未确认。

## 可复跑验证

- `node frontend/scripts/check-confirmed-contracts.cjs`：数据关系、排序、判空、身份、日期、URL 与轮播数量。
- `node frontend/scripts/check-frontend.cjs`：统一离线/浏览器入口，环境按 frontend/README.md 使用已有依赖。
- `frontend/scripts/check-django-presentation.py`：新建隔离测试库和内存夹具，不读写实际业务库。
- `scripts/fixtures/confirmed-requirements.cjs`：多称号/三档有内容的隔离样式页，使用正式渲染器生成。供审核的副本链接见 review.html，不能加入生产内容。
