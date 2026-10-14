// 参考并改编低空 scripts/build-site.js：保留配置/模板/正文分离与 render 函数。
// 本版在构建时直接输出公共头尾，不依赖浏览器 JS 挂载；不执行参考包的构建。
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const output = path.join(root, 'preview');
const site = require('../src/data/site');
const collections = require('../src/data/collections');
const collectionFor = key => collections.find(c => c.legacyKeys.includes(key));
const collectionHref = href => {
  const [page, anchor] = href.split('#');
  return anchor ? collectionFor(page.replace('.html', '') + '.' + anchor)?.url || href : href;
};
require('./build-chip-art');
const read = relative => fs.readFileSync(path.join(src, relative), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function render(template, values) {
  return template.replace(/{{([a-zA-Z0-9_]+)}}/g, (match, key) => {
    if (!(key in values)) throw new Error(`Missing template value: ${key}`);
    return values[key];
  });
}

const pages = new Map();
const contentSlots = [];
const previewNote = '<p class="page-note">内部预览：此处为内容占位，待学院审核后替换，不代表已发布的正式信息。</p>';
const articleHref = item => `${item.slug}.html`;
const teacherHref = teacher => `teacher-${teacher.slug}.html`;
const mediaStatus = '<span class="media-status" data-media-status hidden><span class="media-spinner" aria-hidden="true"></span><span data-media-label>图片加载中…</span></span>';
// 骨架尺寸随 HTML 一起生成；JS 只负责加载状态，无 JS 时仍显示原图和替代文字。
function loadingMedia(html) {
  return html.replace(/<img\b[^>]*>/g, img => img.includes('class="hero-image"') ? img : `<span class="media-frame" data-media>${img}${mediaStatus}</span>`);
}
let chipId = 0;
function chipArt(mode = 'wide') {
  const prefix = `chip-${++chipId}-`;
  const svg = read('templates/partials/chip-art.svg').replace(/id="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}${id})`);
  return `<div class="chip-visual chip-visual--${mode}" data-chip-visual aria-hidden="true">${svg}</div>`;
}
function teacherCards() {
  return site.teachers.map(teacher => `<a class="faculty-card" href="${teacherHref(teacher)}"><img src="${escape(teacher.image)}" alt="${escape(teacher.name)}照片" width="100" height="132" loading="lazy"><div><h3>${escape(teacher.name)}</h3><p class="teacher-title">${escape(teacher.title)}</p><p class="teacher-intro">${escape(teacher.intro)}</p><span class="teacher-link">查看教师介绍</span></div></a>`).join('\n');
}

const teacherVacancies = '<div class="faculty-vacancies" aria-label="待补充教师资料">' + Array.from({ length: 3 }, () => '<div class="faculty-vacancy"><span aria-hidden="true">＋</span><p>教师资料待补充</p><small>更多师资信息将陆续更新</small></div>').join('') + '</div>';
const wechatPlaceholder = '<aside class="wechat-panel" aria-label="学院微信公众号"><div class="wechat-placeholder">二维码<br>待提供</div><div><p class="wechat-title">学院微信公众号</p><p class="wechat-caption">账号及二维码待学院确认</p></div></aside>';
const routeCatalog = {};
function crumbs(file, title, active) {
  const parents = [];
  const navName = new Map(site.navigation);
  const collection = collections.find(c => c.url === file);
  if (collection) {
    if (collection.page !== active) parents.push({ href: active, label: navName.get(active) });
    parents.push({ href: collection.page, label: site.pages[collection.page].title });
  }
  if (!collection && active !== file && navName.has(active)) parents.push({ href: active, label: navName.get(active) });
  if (file.startsWith('news-')) parents.push({ href: 'news.html', label: '学院新闻' });
  if (file.startsWith('notice-')) parents.push({ href: 'notices.html', label: '通知公告' });
  if (file === 'notices.html') parents.push({ href: 'news.html', label: '新闻通知' });
  routeCatalog[file.replace('.html', '')] = { title, english: '', active, parents };
  return parents.map(p => `<a href="${escape(p.href)}">${escape(p.label)}</a><span aria-hidden="true"> / </span>`).join('') + `<span aria-current="page">${escape(title)}</span>`;
}

function navigationItems(items, active, prefix = 'nav', depth = 0, currentFile = active) {
  return items.map(([href, label, nested], i) => {
    const children = depth === 0 ? site.subNavigation[href] : nested;
    const id = `${prefix}-${i}`;
    // 顶层看 active（所属的一级栏目），子菜单看当前实际页面。
    // 否则「通知公告」「媒体掠影」这类 active 指向 news.html 的页面，会错误高亮「学院新闻」。
    const current = depth === 0 ? href === active : href === currentFile;
    const submenu = children?.length ? `<button class="subnav-toggle" type="button" aria-controls="${id}" aria-expanded="false" aria-label="展开${escape(label)}子栏目"><span aria-hidden="true">${depth ? '›' : '+'}</span></button>` : '';
    const links = children?.length ? `<ul class="subnav" id="${id}" aria-label="${escape(label)}子栏目">${navigationItems(children, active, id, depth + 1, currentFile)}</ul>` : '';
    return `<li class="nav-item"><div class="nav-item-heading"><a href="${escape(collectionHref(href))}"${current ? ' aria-current="page"' : ''}>${escape(label)}</a>${submenu}</div>${links}</li>`;
  }).join('\n');
}
function sitemapItems(items) {
  return '<ul>' + items.map(([url, name, nested]) => `<li><a href="${escape(url)}">${escape(name)}</a>${nested?.length ? sitemapItems(nested) : ''}</li>`).join('') + '</ul>';
}
function page(file, title, content, active = file) {
  const navigation = navigationItems(site.navigation, active, 'nav', 0, file);
  const shared = Object.fromEntries(Object.entries({ name: site.name, college: site.college, english: site.english, ...site.contact }).map(([key, value]) => [key, escape(value)]));
  const html = render(read('templates/document.html'), {
    title: escape(`${title} - ${site.name}（内部预览）`),
    pageKind: file === 'index.html' ? 'home' : 'inner',
    description: escape(`${site.name}基础前端预览，内容和素材待审定。`),
    header: render(read('templates/partials/header.html'), { ...shared, navigation, headerState: file === 'index.html' ? '' : ' is-compact' }),
    footer: render(read('templates/partials/footer.html'), shared), content: loadingMedia(content.replace(/href="([^"]+)"/g, (_, href) => `href="${collectionHref(href)}"`)),
    pageScripts: '',
  });
  if (/{{[a-zA-Z0-9_]+}}/.test(html)) throw new Error(`Unresolved template value in ${file}`);
  pages.set(file, `<!-- 自动生成：修改 src/ 后运行 node scripts/build-site.js。 -->\n${html}`);
}

function inner(file, title, english, body, active = file) {
  const breadcrumb = crumbs(file, title, active);
  routeCatalog[file.replace('.html', '')].english = english;
  page(file, title, render(read('templates/page.html'), { chipArt: chipArt(), heading: escape(title), english: escape(english), breadcrumb, body }), active);
}

const dynamicSlides = [];
const slideDefaults = {};
const slides = site.slides.map((slide, i) => {
  const isChip = slide.theme === 'chip';
  const visual = isChip ? chipArt() : `<img class="hero-image" src="${escape(slide.image)}" alt="${escape(slide.alt)}" width="1600" height="560" decoding="async">${mediaStatus}`;
  const html = `<div class="hero-slide hero-slide--${escape(slide.theme)}"${isChip ? '' : ' data-media'} data-slide data-title="${escape(slide.title)}" role="group" aria-roledescription="幻灯片" aria-label="第 ${i + 1} 张，共 ${site.slides.length} 张"${i ? ' hidden' : ''}>${visual}<div class="container hero-copy"><p class="hero-eyebrow">${escape(slide.eyebrow)}</p><h2>${escape(slide.title)}</h2><p class="hero-description">${escape(slide.text)}</p></div><p class="hero-note">${escape(slide.note)}</p></div>`;
  const key = `home.slide-${i + 1}`;
  slideDefaults[key] = { key, title: slide.title, subtitle: slide.eyebrow, summary: slide.text, body: slide.note, image: isChip ? '' : slide.image.replace('assets/', ''), image_alt: slide.alt };
  const live = field => `{{ slide.${field} }}`;
  let dynamic = html;
  for (const [tag, value, field] of [['h2', slide.title, 'title'], ['p class="hero-eyebrow"', slide.eyebrow, 'subtitle'], ['p class="hero-description"', slide.text, 'summary'], ['p class="hero-note"', slide.note, 'body']]) {
    dynamic = dynamic.replace(`<${tag}>${escape(value)}`, `<${tag}>{% if slide.is_visible %}${live(field)}{% else %}${escape(value)}{% endif %}`);
  }
  dynamic = dynamic.replace(`data-title="${escape(slide.title)}"`, `data-title="{% if slide.is_visible %}{{ slide.title }}{% else %}${escape(slide.title)}{% endif %}"`);
  if (isChip) dynamic = dynamic.replace(' data-slide ', '{% if slide.is_visible and slide.image %} data-media{% endif %} data-slide ');
  dynamic = dynamic.replace(visual, `{% if slide.is_visible and slide.image %}<img class="hero-image" src="/assets/{{ slide.image }}" alt="{{ slide.image_alt }}" width="1600" height="560">${mediaStatus}{% else %}${visual}{% endif %}`);
  dynamicSlides.push(`{% content_block '${key}' as slide %}` + dynamic);
  return html;
}).join('\n');
const homeParts = {
  slides,
  researchArt: chipArt('detail'),
  slideCount: String(site.slides.length).padStart(2, '0'),
  dots: site.slides.map((slide, i) => `<button type="button" data-dot aria-label="查看第 ${i + 1} 张：${escape(slide.title)}" aria-pressed="${i === 0}"></button>`).join(''),
  featuredNews: site.news.map((item, i) => `<a class="news-picture" data-news-panel href="${articleHref(item)}"${i ? ' hidden' : ''}><img src="${escape(item.image)}" alt="${escape(item.imageAlt)}" width="720" height="480" loading="lazy"><span class="picture-note">示意配图 · 待替换</span><div class="picture-caption"><span>学院新闻 / ${String(i + 1).padStart(2, '0')}</span><h3>${escape(item.title)}</h3></div></a>`).join(''),
  newsList: site.news.map((item, i) => `<li><a class="news-select${i ? '' : ' is-active'}" data-news-select href="${articleHref(item)}"><div><h3>${escape(item.title)}</h3><span>日期待提供</span></div><p>${escape(item.summary)}</p></a></li>`).join(''),
  noticeList: site.notices.map((item, i) => `<li><a href="${articleHref(item)}"><span class="notice-index" aria-hidden="true">0${i + 1}</span><div><p class="notice-type">通知公告 / 日期待提供</p><h3>${escape(item.title)}</h3><p class="notice-summary">${escape(item.summary)}</p></div></a></li>`).join(''),
  teachers: teacherCards() + teacherVacancies,
};
const homeContent = parts => `<h1 class="sr-only">${escape(site.name)}</h1>` + render(read('content/home.html'), parts);
function newsTabs(active) {
  return '<nav class="list-tabs" aria-label="资讯分类">' + [['news.html', '学院新闻'], ['notices.html', '通知公告'], ['media.html', '媒体掠影']].map(([url, title]) => `<a href="${url}"${url === active ? ' aria-current="page"' : ''}>${title}</a>`).join('') + '</nav>';
}
function collectionPreview(c) {
  return `<section class="collection-preview overview-section${c.position % 2 === 0 ? ' overview-section--muted' : ''}" id="${c.anchor}" data-overview-section data-collection="${c.key}"><span class="section-watermark section-watermark--${c.position % 2 === 0 ? 'left' : 'right'}" aria-hidden="true">${c.watermark}</span><div class="container"><div class="editorial-heading"><div><span lang="en">${c.watermark}</span><h2>${escape(c.title)}</h2></div><a href="${c.url}">查看全部</a></div>${previewItems(c, c.url)}</div></section>`;
}
function previewItems(c, href) {
  const covers = ['oscilloscope-waveform.jpg', 'microscopy-instruments.jpg', 'wafer-closeup.jpg'];
  return `<div class="collection-items collection-items--${c.layout}">` + Array.from({ length: 3 }, (_, i) => `<a class="collection-item" href="${href}">${c.layout === 'cards' ? `<img src="assets/${covers[i]}" alt="学科配图示意，非学院设施或成果" width="640" height="360" loading="lazy">` : ''}<div class="collection-item-copy"><span class="collection-meta">版式占位 · 日期待提供</span><h3>${escape(c.title)} · 内容位置 ${String(i + 1).padStart(2, '0')}</h3><p>这里展示该条内容的简要介绍，发布后可点击查看独立详情。</p><span class="collection-read">${href === c.url ? '进入栏目' : '查看详情版式'}</span></div></a>`).join('') + '</div>';
}
page('index.html', '首页', homeContent(homeParts));

for (const [file, config] of Object.entries(site.pages)) {
  const pageImages = { 'about.html': 'campus-building.jpg', 'science-innovation.html': 'cleanroom-lcn.jpg', 'talent-cultivation.html': 'wafer-display.jpg', 'public-service.html': 'campus-gate.jpg', 'careers.html': 'campus-landscape.jpg' };
  const isScience = file === 'science-innovation.html';
  const photoLabel = isScience ? 'LCN光刻洁净室，校外实验室示意' : file === 'talent-cultivation.html' ? '晶圆与器件展品，科普示意' : '校园视觉示意，非本学院楼宇';
  const photograph = pageImages[file] ? `<figure class="page-photo"><img src="assets/${pageImages[file]}" alt="${photoLabel}" width="1269" height="714"><figcaption>${photoLabel} · <a href="image-credits.html">图片来源与授权</a></figcaption></figure>` : '';
  const sections = config.sections.map((section, i) => {
    let body = `<p>${escape(section)}资料待提供。</p>`;
    if (file === 'science-innovation.html' && i === 0) body = '<p>学院正式研究方向待审定。先保留研究平台与课题组入口，后续按学院材料补充。</p><div class="research-topics"><a href="research-platforms.html"><h3>研究平台</h3><p>平台名称、研究方向与介绍待提供。</p><span>查看研究平台</span></a><a href="research-groups.html"><h3>课题组</h3><p>团队名称、成员及简介待提供。</p><span>查看课题组</span></a></div>';
    if (file === 'research-platforms.html') body = i === 0 ? '<p>学院研究平台信息待补充，平台名称与归属以审定材料为准。</p><div class="research-topics"><section><h3>研究平台（待提供）</h3><p>此卡片为版式占位，不代表已成立的平台。</p></section></div>' : '<p>待补充平台简介、研究方向、设施图片与经审定的联系信息。</p>';
    if (file === 'research-groups.html') body = i === 0 ? '<p>课题组信息待补充，团队名称、负责人、成员及排序以审定材料为准。</p><div class="research-topics"><section><h3>课题组（待提供）</h3><p>此卡片为版式占位，不将教师姓名自动认定为已成立的学院课题组。</p></section></div>' : '<p>待补充团队简介、研究内容及经审定的联系信息。现阶段可先查看教师个人简介。</p><a class="back-link" href="faculty.html">查看教师名录</a>';
    if (file === 'talent-cultivation.html' && i === 1) body += '<div class="research-topics"><a href="admissions.html#section-1"><h3>本科生招生</h3><p>招生信息待学校与学院审定。</p></a><a href="admissions.html#section-2"><h3>研究生招生</h3><p>招生目录与报考信息待提供。</p></a><a href="admissions.html#section-3"><h3>就业指导</h3><p>就业指导与服务信息待提供。</p></a><a href="community.html"><h3>师生园地</h3><p>师生活动与学生风采待提供。</p></a></div>';
    if (file === 'public-service.html') body = '<div class="research-topics"><a href="regulations.html"><h3>制度建设与办事流程</h3><p>规章制度与办事指引待提供。</p></a><a href="https://www.henu.edu.cn/" target="_blank" rel="noopener"><h3>学校官网</h3><p>了解河南大学资讯与校园服务。</p></a><a href="site-map.html"><h3>网站导航</h3><p>查看学院网站全部栏目与师资入口。</p></a><a href="contact.html"><h3>联系学院</h3><p>学院联系方式待统一发布。</p></a></div>';
    const key = `${file.replace('.html', '')}.section-${i + 1}`;
    const collection = collectionFor(key);
    if (collection) {
      // 保留旧锚点；平台概览与介绍归同一个集合，不生成重复正文。
      const html = key === collection.key ? collectionPreview(collection) : `<span id="section-${i + 1}" class="legacy-anchor"></span>`;
      contentSlots.push({ key, label: config.title + ' / ' + section, anchor: `section-${i + 1}`, html, collection: collection.key });
      return html;
    }
    if (file === 'about.html') {
      const watermark = ['INTRODUCTION', 'ORGANIZATION', 'LEADERSHIP'][i];
      const muted = i % 2 === 1;
      const html = `<section class="overview-section${muted ? ' overview-section--muted' : ''}" id="section-${i + 1}" data-overview-section data-content-key="${key}"><span class="section-watermark section-watermark--${muted ? 'left' : 'right'}" aria-hidden="true">${watermark}</span><div class="container"><div class="editorial-heading"><div><span lang="en">${watermark}</span><h2>${escape(section)}</h2></div></div><div class="overview-prose">${body}</div>${i === 0 ? photograph : ''}</div></section>`;
      contentSlots.push({ key, label: config.title + ' / ' + section, anchor: `section-${i + 1}`, html, overview: true, title: section, watermark, muted });
      return html;
    }
    const html = `<section class="placeholder-block" id="section-${i + 1}" data-content-key="${key}"><h2>${escape(section)}</h2>${body}</section>`;
    contentSlots.push({ key, label: config.title + ' / ' + section, anchor: `section-${i + 1}`, html });
    return html;
  }).join('');
  const relatedPages = { 'science-innovation.html': [['research-platforms.html', '研究平台'], ['research-groups.html', '课题组']], 'talent-cultivation.html': [['admissions.html', '招生就业'], ['community.html', '师生园地']], 'public-service.html': [['regulations.html', '制度建设与办事流程'], ['site-map.html', '网站导航'], ['contact.html', '联系学院']] };
  const links = (relatedPages[file] || []).map(([href, title]) => `<a href="${href}"><h3>${title}</h3><span>进入栏目</span></a>`).join('');
  const isOverview = file === 'about.html' || collections.some(c => c.page === file);
  const related = (relatedPages[file] || []).map(([href, title]) => `<a href="${href}">${title}</a>`).join('');
  const overview = (file === 'media.html' ? newsTabs(file) : '') + previewNote + `<div class="overview-sections">${sections}</div>` + (related ? `<nav class="overview-related" aria-label="相关栏目"><span>相关栏目</span>${related}</nav>` : '');
  inner(file, config.title, config.english, isOverview ? overview : (file === 'media.html' ? newsTabs(file) : '') + photograph + previewNote + (links ? `<nav class="research-topics" aria-label="相关栏目">${links}</nav>` : '') + sections, config.active || file);
}

for (const c of collections) {
  c.active = site.pages[c.page].active || c.page;
  const siblings = collections.filter(other => other.page === c.page);
  const side = siblings.length > 1 ? `<aside class="collection-sidebar"><h2>${escape(site.pages[c.page].title)}</h2><nav aria-label="同级栏目">${siblings.map(s => `<a href="${s.url}"${s.key === c.key ? ' aria-current="page"' : ''}>${escape(s.title)}</a>`).join('')}</nav></aside>` : '';
  const detailFile = `layout-${c.slug}.html`;
  const empty = '<p class="page-note">本地版式预览：以下是布局占位，不是已发布的业务内容。运行版从后台读取真实条目。</p>' + previewItems(c, detailFile);
  inner(c.url, c.title, '', `${c.page === 'media.html' ? newsTabs('media.html') : ''}<div class="${side ? 'collection-layout' : 'collection-single'}">${side}<div>${empty}</div></div>`, c.active);
  c.parents = routeCatalog[c.slug].parents;
  inner(detailFile, c.title + '详情版式', '', `<article class="article"><p class="page-note">此页面只用于检查栏目到详情的层级。正式正文由后台录入。</p><h2>内容标题待填写</h2><p class="article-meta">日期待填写 · 来源待填写</p><p>这里展示完整内容；列表页只展示标题、摘要和配图，不再直接铺开全文。</p>${c.key === 'science-innovation.section-1' ? '<h2>相关课题组</h2><p>在后台为多个课题组选择这个研究方向后，这里显示相应卡片。</p><a href="research-groups-section-1.html">查看课题组列表</a>' : ''}<a class="back-link" href="${c.url}">返回${escape(c.title)}</a></article>`, c.active);
  // 详情版式明确显示中间层级，静态占位不进入服务端业务路由。
  const chain = [...c.parents, {href: c.url, label: c.title}].map(p => `<a href="${p.href}">${escape(p.label)}</a><span aria-hidden="true"> / </span>`).join('');
  pages.set(detailFile, pages.get(detailFile).replace(/(<nav class="breadcrumb"[^>]*>)[\s\S]*?<\/nav>/, `$1<a href="index.html">首页</a><span aria-hidden="true"> / </span>${chain}<span aria-current="page">详情版式</span></nav>`));
  delete routeCatalog[detailFile.replace('.html', '')];
}

for (const [file, title, items, slot] of [['news.html', '学院新闻', site.news, 'news-list'], ['notices.html', '通知公告', site.notices, 'notice-list']]) {
  const tabs = newsTabs(file);
  const list = `<ul class="article-list" data-boda-slot="${slot}">${items.map(item => `<li><a href="${articleHref(item)}"><h2>${escape(item.title)}</h2><p>${escape(item.summary)}</p><span class="preview-label">发布日期待提供 · 内容占位</span></a></li>`).join('')}</ul>`;
  inner(file, title, file === 'news.html' ? 'NEWS' : 'NOTICES', tabs + previewNote + list, 'news.html');
  for (const item of items) {
    const picture = item.image ? `<figure class="article-photo"><img src="${escape(item.image)}" alt="${escape(item.imageAlt)}" width="1000" height="600"><figcaption>演示配图，不代表新闻现场</figcaption></figure>` : '';
    inner(articleHref(item), item.title, 'INFORMATION', `<article class="article">${previewNote}<h2>${escape(item.title)}</h2><p class="article-meta">发布日期：待提供　来源：待提供</p>${picture}<div class="article-content" data-boda-slot="article-content"><p>${escape(item.summary)}</p><p>正文待提供。本页仅用于确认文章排版。</p></div><a class="back-link" href="${file}">返回${title}</a></article>`, 'news.html');
  }
}

const facultyNote = '<p class="page-note">以下为教师个人简介。照片、职称与简介来自已整理的公开资料，待学院及本人核对。</p>';
inner('faculty.html', '师资队伍', 'FACULTY', facultyNote + '<div class="faculty-grid" id="faculty-list">' + teacherCards() + '</div>' + teacherVacancies);
for (const teacher of site.teachers) {
  const sections = teacher.sections.map(s => `<section class="profile-section"><h2>${escape(s.title)}</h2>${(s.paragraphs || []).map(p => `<p>${escape(p)}</p>`).join('')}${s.items ? `<ul>${s.items.map(p => `<li>${escape(p)}</li>`).join('')}</ul>` : ''}</section>`).join('');
  const contacts = ['email', 'secondaryEmail', 'phone', 'group'].filter(k => teacher[k]).map(k => `<p>${({ email: '电子邮箱', secondaryEmail: '其他邮箱', phone: '联系电话', group: '课题组主页' })[k]}：${k === 'group' ? `<a href="${escape(teacher[k])}" target="_blank" rel="noopener">${escape(teacher[k])}</a>` : escape(teacher[k])}</p>`).join('');
  inner(teacherHref(teacher), teacher.name, 'FACULTY', facultyNote + `<div class="teacher-profile"><aside><img src="${escape(teacher.image)}" alt="${escape(teacher.name)}照片" width="180" height="234"><p class="teacher-title">${escape(teacher.title)}</p><p>${escape(teacher.field)}</p></aside><div><section class="profile-section"><h2>个人简介</h2><p>${escape(teacher.intro)}</p></section>${sections}${contacts ? `<section class="profile-section"><h2>联系方式</h2>${contacts}</section>` : ''}<p class="profile-source">资料来源：<a href="${escape(teacher.source)}" target="_blank" rel="noopener">${escape(teacher.sourceLabel)}</a>。展示内容待本人确认为准。</p><a class="back-link" href="faculty.html">返回教师名录</a></div></div>`, 'faculty.html');
}

inner('contact.html', '联系我们', 'CONTACT', previewNote + `<div class="contact-layout"><dl class="contact-list"><div><dt>学院名称</dt><dd>${escape(site.name)}</dd></div>${[['办公地址', site.contact.address], ['公开电话', site.contact.phone], ['电子邮箱', site.contact.email]].map(([key, value]) => `<div><dt>${key}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>${wechatPlaceholder}</div>`);
inner('site-map.html', '网站导航', 'SITE MAP', '<div class="site-map-grid">' + site.navigation.map(([href, label]) => `<section><h2><a href="${escape(href)}">${escape(label)}</a></h2>${sitemapItems(site.subNavigation[href] || [])}</section>`).join('') + '</div>', 'public-service.html');
// 404 预览页。后台 404 走 backend/templates/site/error.html，不进路由目录与服务端模板；SVG 两处同一份。
const errorFace = `<div class="error-face" aria-hidden="true">
  <svg class="face" viewBox="0 0 320 380">
    <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="25">
      <g class="face__eyes" transform="translate(0,112.5)">
        <g transform="translate(15,0)"><polyline class="face__eye-lid" points="37,0 0,120 75,120"/><polyline class="face__pupil" points="55,120 55,155" stroke-dasharray="35 35"/></g>
        <g transform="translate(230,0)"><polyline class="face__eye-lid" points="37,0 0,120 75,120"/><polyline class="face__pupil" points="55,120 55,155" stroke-dasharray="35 35"/></g>
      </g>
      <rect class="face__nose" x="132.5" y="112.5" width="55" height="155" rx="4" ry="4"/>
      <g transform="translate(65,334)" stroke-dasharray="102 102"><path class="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0"/><path class="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30"/></g>
    </g>
  </svg>
</div>`;
inner('404.html', '页面未找到', '404', errorFace + '<p class="error-kicker">页面走丢了</p><p class="error-desc">页面不存在，或内容尚未批准预览。</p><p class="error-links"><a class="back-link" href="index.html">返回首页</a> <a class="back-link" href="site-map.html">网站导航</a></p>');
delete routeCatalog['404'];

const media = require('../src/data/media');
inner('image-credits.html', '图片来源与授权', 'IMAGE CREDITS', '<p class="page-note">图片用于内部网站演示。校园、人物与学科示意分别标注；校外技术图片不代表本学院设施或成果。</p><div class="credit-list">' + media.map(item => `<section class="credit-item" id="${escape(item.id)}"><a href="assets/${escape(item.id)}.jpg"><img src="assets/${escape(item.id)}.jpg" alt="${escape(item.title)}" width="240" height="180" loading="lazy"></a><div><h2>${escape(item.title)}</h2><p>${escape(item.description)}</p><p>摄影：${escape(item.author)} / Wikimedia Commons</p><p><a href="${escape(item.source)}" target="_blank" rel="noopener">原始文件页</a> · <a href="${escape(item.licenseUrl)}" target="_blank" rel="noopener">${escape(item.license)}</a></p><p>处理：等比例缩放、JPEG压缩；部分页面以CSS裁切展示。可点击缩略图取得本站图片副本。</p></div></section>`).join('') + '</div><section class="profile-section"><h2>校园与教师图片</h2><p>河南大学校徽及校园图片来自用户提供的低空学院参考包，正式使用待学院确认。三位教师照片来自已归档的公开介绍；张锦龙照片取自河南师范大学讲座新闻，郑海务照片取自河南大学物理与电子学院教师页，程纲照片取自河南大学纳米科学与材料工程学院高层次人才页。</p><p>教师资料来源见各教师详情。芯片为本项目原创SVG学科示意，信号光流参考MIT许可的Magic UI Animated Beam机制，未使用第三方图片，不代表真实芯片版图。</p><a class="back-link" href="faculty.html">查看师资资料与来源</a></section>', 'public-service.html');

fs.mkdirSync(output, { recursive: true });
// 只写本工程生成的已知文件，不递归清空目录，避免误删队友的其他文件。
for (const [file, html] of pages) fs.writeFileSync(path.join(output, file), html, 'utf8');
function copyDirectory(source, destination) {
  // 避免部分 Windows Node 版本 cpSync 原生目录复制的 EIO 问题。
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
    else throw new Error(`Unsupported asset type: ${entry.name}`);
  }
}
for (const folder of ['css', 'js', 'assets']) copyDirectory(path.join(src, folder), path.join(output, folder));
fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`已生成 ${pages.size} 个预览页面：${path.join(output, 'index.html')}`);

// 从同一套模板生成 Django 预览外框；不解析或改写博达模板。
const server = path.resolve(root, '../backend');
const templates = path.join(server, 'templates/site/generated');
fs.mkdirSync(templates, { recursive: true });
const serverLinks = html => html.replace(/(href|src)="(?!https?:|mailto:|\/|#|\{)([^"]+)"/g, '$1="/$2"');
const dynamicShared = { name: '{{ site_info.name }}', college: '{{ site_info.college }}', english: '{{ site_info.english }}', address: "{{ site_info.address|default:'待提供' }}", phone: "{{ site_info.phone|default:'待提供' }}", email: "{{ site_info.email|default:'待提供' }}" };
function serverChrome(html) {
  let footer = render(read('templates/partials/footer.html'), dynamicShared);
  footer = footer.replace(wechatPlaceholder, '{% include "site/wechat.html" %}');
  // 同源标识图片；空值继续使用河大校徽。
  footer = footer.replace('src="assets/henu-logo.png"', 'src="/assets/{{ site_info.image }}"');
  footer = footer.replace('alt="河南大学校徽"', 'alt="{{ site_info.image_alt|default:\'河南大学校徽\' }}"');
  footer = footer.replace('明德 · 新民 · 止于至善', '{{ site_info.motto }}');
  footer = footer.replace('河南大学 · 集成电路与微纳电子学院', '河南大学 · {{ site_info.college }}').replace('School of Integrated Circuits<br>and Micro-Nano Electronics', '{{ site_info.english }}').replace('正式网站备案与平台信息待学校配置', "{{ site_info.body|default:'正式网站备案与平台信息待学校配置' }}");
  html = html.replace(/<footer class="site-footer"[\s\S]*?<\/footer>/, footer);
  html = html.replace(/(<a class="brand"[\s\S]*?<\/a>)/, brand => brand.replace('src="assets/henu-logo.png"', 'src="/assets/{{ site_info.image }}"').replace('alt="河南大学校徽"', 'alt="{{ site_info.image_alt|default:\'河南大学校徽\' }}"').replaceAll(escape(site.college), '{{ site_info.college }}').replace(escape(site.english), '{{ site_info.english }}'));
  html = html.replace('<span class="brand-motto" aria-hidden="true">明德 · 新民 · 止于至善</span>', '<span class="brand-motto" aria-hidden="true">{{ site_info.motto }}</span>');
  return serverLinks(html);
}
for (const [file, html] of pages) {
  if (file.startsWith('layout-') || file === '404.html') continue;
  let dynamic = html;
  for (const slot of contentSlots) {
    if (slot.collection) {
      if (slot.key === slot.collection) dynamic = dynamic.replace(loadingMedia(slot.html), `{% collection_preview '${slot.collection}' %}`);
    } else if (slot.overview) {
      dynamic = dynamic.replace(loadingMedia(slot.html), `{% content_block '${slot.key}' as entry %}{% if entry %}{% include "site/overview_content_block.html" with anchor="${slot.anchor}" heading="${slot.title}" watermark="${slot.watermark}" muted=${slot.muted ? 'True' : 'False'} %}{% else %}${loadingMedia(slot.html)}{% endif %}`);
    } else dynamic = dynamic.replace(loadingMedia(slot.html), `{% content_block '${slot.key}' as entry %}{% if entry %}{% include "site/content_block.html" with anchor="${slot.anchor}" %}{% else %}${loadingMedia(slot.html)}{% endif %}`);
  }
  fs.writeFileSync(path.join(templates, file), '{% load content_slots %}\n' + serverChrome(dynamic));
}
const staticHome = pages.get('index.html');
const include = name => `{% include "site/${name}.html" %}`;
page('index.html', '首页', homeContent({ ...homeParts, slides: dynamicSlides.join('\n'), newsList: include('home_news'), featuredNews: include('home_pictures'), noticeList: include('home_notices'), teachers: include('teachers') + include('vacancies') }));
fs.writeFileSync(path.join(templates, 'home.html'), '{% load content_slots %}\n' + serverChrome(pages.get('index.html')));
fs.writeFileSync(path.join(server, 'templates/site/vacancies.html'), teacherVacancies);
pages.set('index.html', staticHome);
inner('frame.html', '{{ page_heading }}', '{{ page_english }}', '{% block body %}{% endblock %}', 'news.html');
let frame = pages.get('frame.html').replace(/(<nav class="breadcrumb"[^>]*>)[\s\S]*?<\/nav>/, '$1<a href="index.html">首页</a><span aria-hidden="true"> / </span>{% for parent in breadcrumbs %}<a href="{{ parent.href }}">{{ parent.label }}</a><span aria-hidden="true"> / </span>{% endfor %}<span aria-current="page">{{ page_heading }}</span></nav>');
frame = frame.replace(/(<a href="([^"]+\.html)") aria-current="page"/g, '$1');
// 顶层导航按 active_page 高亮；子菜单按当前请求路径 request.path 高亮。
// 两者都用 active_page 时，「通知公告」「媒体掠影」（其 active 都指向 news.html）
// 的子菜单会错误高亮「学院新闻」。
{
  const navStart = frame.indexOf('<nav id="main-nav"');
  const navEnd = frame.indexOf('</nav>', navStart);
  let subDepth = 0;
  const nav = frame.slice(navStart, navEnd).replace(
    /<ul class="subnav"|<\/ul>|<li class="nav-item"><div class="nav-item-heading"><a href="([^"]+\.html)"/g,
    (match, href) => {
      if (match === '<ul class="subnav"') { subDepth += 1; return match; }
      if (match === '</ul>') { subDepth = Math.max(0, subDepth - 1); return match; }
      const condition = subDepth > 0 ? `request.path == "/${href}"` : `active_page == "${href}"`;
      return `<li class="nav-item"><div class="nav-item-heading"><a href="${href}"{% if ${condition} %} aria-current="page"{% endif %}`;
    });
  frame = frame.slice(0, navStart) + nav + frame.slice(navEnd);
}
fs.writeFileSync(path.join(templates, 'frame.html'), serverChrome(frame));
const teacherBody = t => ['## 个人简介', t.intro, ...t.sections.flatMap(s => ['## ' + s.title, ...(s.paragraphs || []), ...(s.items || [])]), '## 联系方式', ...['email', 'secondaryEmail', 'phone', 'group'].filter(k => t[k]).map(k => ({ email: '电子邮箱', secondaryEmail: '其他邮箱', phone: '联系电话', group: '课题组主页' })[k] + '：' + t[k])].join('\n\n');
fs.writeFileSync(path.join(server, 'content-catalog.json'), JSON.stringify({
  slots: Object.fromEntries([...contentSlots.map(s => [s.key, s.label]), ...Object.keys(slideDefaults).map((key, i) => [key, `首页轮播 / 第${i + 1}张`])]), routes: routeCatalog, defaults: slideDefaults, collections,
  site: { college: site.college, english: site.english, motto: '明德 · 新民 · 止于至善', image: 'henu-logo.png', address: '', phone: '', email: '', account_name: '', qr_image: '' },
  teachers: site.teachers.map((t, i) => ({ key: 'teacher-' + t.slug, title: t.name, subtitle: t.title + ' · ' + t.field, summary: t.intro, body: teacherBody(t), image: t.image.replace('assets/', ''), image_alt: t.name + '照片', source_url: t.source, source_label: t.sourceLabel, sort_order: i, is_visible: true })),
}, null, 2) + '\n');
fs.writeFileSync(path.join(server, 'seed-content.json'), JSON.stringify({ news: site.news, notices: site.notices }, null, 2) + '\n');
