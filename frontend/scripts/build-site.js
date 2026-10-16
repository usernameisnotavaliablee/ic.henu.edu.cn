// 参考并改编低空 scripts/build-site.js：保留配置/模板/正文分离与 render 函数。
// 本版在构建时直接输出公共头尾，不依赖浏览器 JS 挂载；不执行参考包的构建。
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const output = path.join(root, 'preview');
const site = require('../src/data/site');
const facultyCategories = require('../src/data/faculty-categories.json');
const {createFaculty} = require('./lib/faculty');
const faculty = createFaculty({teachers:site.teachers,categories:facultyCategories,memberships:site.facultyMemberships});
const {emptyContent,recordBody,sectionBody,renderLinks,qrPanel,safeHref} = require('./lib/content');
const entries = require('../src/data/entries');
const {articleItems,collectionItems,demoNote} = require('./lib/preview-content');
const previewNews=articleItems(site.news,'news'), previewNotices=articleItems(site.notices,'notices');
const homeNews = previewNews.slice(0,4), homeNotices = previewNotices.slice(0,3);
const collections = require('../src/data/collections');
const collectionFor = key => collections.find(c => c.legacyKeys.includes(key));
const registry = require('./lib/columns');
const django = require('./adapters/django');
const collectionHref = registry.resolveHref;
const {hash, walk, collectResources, createWriter} = require('./lib/artifacts');
const resources = collectResources(src);
const writer = createWriter(path.resolve(root, '..'), path.join(root, 'build-manifest.json'));
const resourceVersions = Object.fromEntries([...resources].map(([name, body]) => [name, hash(body)]));
const assetUrl = name => name + '?v=' + resourceVersions[name].slice(0, 12);
const read = relative => fs.readFileSync(path.join(src, relative), 'utf8');
const {escape, render, createTemplates} = require('./lib/templates');
const components = createTemplates(path.join(src, 'templates'));
const dynamicPages = new Map();
const renderComponent = (name, values) => components.render('components/' + name + '.html', values);
const media = values => renderComponent('media', {loading: 'lazy', status: mediaStatus, ...values});
const facultyRenderer = require('./lib/faculty-renderer').createFacultyRenderer(renderComponent,media);
const pages = new Map();
const contentSlots = [];
const previewNote = '<p class="page-note">内部预览：此处为内容占位，待学院审核后替换，不代表已发布的正式信息。</p>';
const managementLinks = '<nav class="overview-related management-entry" aria-label="管理机构栏目">' + registry.byId.get('organization').sections.map(({id})=>{const n=registry.byId.get(id);return `<a href="${n.url}">${escape(n.title)}</a>`;}).join('') + '</nav>';
const articleHref = item => `${item.slug}.html`;
const teacherHref = teacher => teacher.href || `teacher-${teacher.slug}.html`;
const mediaStatus = components.read('components/media-status.html').trim();
// 骨架尺寸随 HTML 一起生成；JS 只负责加载状态，无 JS 时仍显示原图和替代文字。
function loadingMedia(html) {
  return html.replace(/<img\b[^>]*>/g, img => (img.includes('class="hero-image"') || img.includes('data-framed') || img.includes('data-no-media')) ? img : `<span class="media-frame" data-media>${img}${mediaStatus}</span>`);
}
// 管理站不收 SVG；芯片示意与 main 一致使用静态 JPG。
function chipArt(mode = 'wide') {
  return `<div class="chip-visual chip-visual--${mode}" aria-hidden="true"><img src="assets/chip-banner.jpg" data-no-media alt="" width="1600" height="800"></div>`;
}
const teacherCards = teachers => teachers.map(t=>facultyRenderer.card(t)).join('\n');
const qrCodes = qrPanel(site.qr.wechat) + qrPanel(site.qr.website,'website',{placeholder:false});
const routeCatalog = {};
const explicitRoutes = new Map();
function crumbs(file, title, active) {
  const route = explicitRoutes.get(file) || registry.route(file) || {parents: [], active};
  routeCatalog[file.replace('.html', '')] = {...route, id: route.id || file.replace('.html', ''), title, english: ''};
  return (route.previewParents || route.parents).map(p => `<a href="${escape(p.href)}">${escape(p.label)}</a><span aria-hidden="true"> / </span>`).join('') + `<span aria-current="page">${escape(route.breadcrumbLabel || title)}</span>`;
}

function navigationItems(items, active, prefix = 'nav', depth = 0, currentFile = active, target = 'preview') {
  return items.map(([href, label, nested], i) => {
    const children = depth === 0 ? site.subNavigation[href] : nested;
    const id = `${prefix}-${i}`;
    // 顶层看 active（所属的一级栏目），子菜单看当前实际页面。
    // 否则「通知公告」「媒体掠影」这类 active 指向 news.html 的页面，会错误高亮「学院新闻」。
    const current = depth === 0 ? href === active : collectionHref(href) === currentFile;
    const submenu = children?.length ? `<button class="subnav-toggle" type="button" aria-controls="${id}" aria-expanded="false" aria-label="展开${escape(label)}子栏目"><span aria-hidden="true">${depth ? '›' : '+'}</span></button>` : '';
    const links = children?.length ? `<ul class="subnav" id="${id}" aria-label="${escape(label)}子栏目">${navigationItems(children, active, id, depth + 1, currentFile, target)}</ul>` : '';
    return `<li class="nav-item"><div class="nav-item-heading"><a href="${escape(collectionHref(href))}"${target === 'django-frame' ? django.currentAttribute(collectionHref(href), depth) : current ? ' aria-current="page"' : ''}>${escape(label)}</a>${submenu}</div>${links}</li>`;
  }).join('\n');
}
function sitemapItems(items) {
  return '<ul>' + items.map(([url, name, nested]) => `<li><a href="${escape(url)}">${escape(name)}</a>${nested?.length ? sitemapItems(nested) : ''}</li>`).join('') + '</ul>';
}
function page(file, title, content, active = file, options = {}) {
  for (const target of ['preview', 'django']) {
    const dynamic = target === 'django';
    const shared = dynamic ? django.chrome() : {
      ...Object.fromEntries(Object.entries({name: site.name, college: site.college, english: site.english, ...site.contact}).map(([key,value])=>[key,escape(value)])),
      ...Object.fromEntries(Object.entries(site.brand).map(([key,value])=>[key,escape(value)])),
      footerEnglish: escape(site.brand.footerEnglish).replace(/\n/g,'<br>'), wechat: qrCodes,
    };
    const html = render(read('templates/document.html'), {
      title: options.frame ? '{{ page_heading }} - ' + escape(site.name) : escape(`${title} - ${site.name}（内部预览）`),
      ...Object.fromEntries(['style','fonts'].map(name => [name + 'Url', assetUrl('css/' + name + '.css')])),
      ...Object.fromEntries(['scroll-reset','media-loading','header-motion','page-transition','navigation','disclosures','main'].map(name => [name.replaceAll('-', '_') + 'Url', assetUrl('js/' + name + '.js')])),
      pageKind: file === 'index.html' ? 'home' : 'inner', description: escape(`${site.name}基础前端预览，内容和素材待审定。`),
      header: render(read('templates/partials/header.html'), {...shared, navigation: navigationItems(site.navigation, active, 'nav', 0, file, options.frame && dynamic ? 'django-frame' : target), headerState: file === 'index.html' ? '' : ' is-compact'}),
      footer: render(read('templates/partials/footer.html'), shared),
      content: loadingMedia(components.resolve(content, target).replace(/href="([^"{]+)"/g, (_, href) => `href="${collectionHref(href)}"`)), pageScripts: '',
    });
    if (/{{[a-zA-Z0-9_]+}}/.test(html)) throw new Error(`Unresolved template value in ${file}`);
    if (dynamic) dynamicPages.set(file, html);
    else pages.set(file, `<!-- 自动生成：修改 src/ 后运行 node frontend/scripts/build-site.js。 -->\n${html}`);
  }
}

function inner(file, title, english, body, active = file) {
  const breadcrumb = crumbs(file, title, active);
  routeCatalog[file.replace('.html', '')].english = english;
  page(file, title, render(read('templates/page.html'), { chipArt: chipArt(), heading: escape(title), english: escape(english), breadcrumb, body }), active);
}

const dynamicSlides = [];
const slideDefaults = {};
const visibleSlides = require('./lib/content').visibleSlides(site.slides);
const slides = visibleSlides.map((slide, i) => {
  const isChip = slide.theme === 'chip';
    const visual = isChip ? `<div class="chip-visual chip-visual--wide" aria-hidden="true"><img src="${escape(slide.image)}" data-no-media alt="" width="1600" height="800"></div>` : `<img class="hero-image" src="${escape(slide.image)}" alt="${escape(slide.alt)}" width="1600" height="560" decoding="async">${mediaStatus}`;
  const key = slide.id;
  slideDefaults[key] = {key, title: slide.title, subtitle: slide.eyebrow, summary: slide.text, body: slide.note, image: isChip ? '' : slide.image.replace('assets/', ''), image_alt: slide.alt};
  const values = {theme: escape(slide.theme), mediaAttribute: isChip ? '' : ' data-media', title: escape(slide.title), index: i + 1, count: visibleSlides.length, hidden: i ? ' hidden' : '', visual, eyebrow: escape(slide.eyebrow), text: escape(slide.text), note: escape(slide.note)};
  dynamicSlides.push(django.slide(values, {key, isChip, mediaStatus}, renderComponent));
  return renderComponent('slide', values);
}).join('\n');
const homeParts = {
  ...require('./lib/home-renderer').homeParts(require('../src/data/home'),registry),
  slides,
  researchArt: chipArt('detail'),
  slideCount: String(visibleSlides.length).padStart(2, '0'),
  newsNote:demoNote(homeNews), noticeNote:demoNote(homeNotices),
  newsCount: `${homeNews.length?'01':'00'} / ${String(homeNews.length).padStart(2,'0')}`,
  dots: visibleSlides.map((slide, i) => `<button type="button" data-dot aria-label="查看第 ${i + 1} 张：${escape(slide.title)}" aria-pressed="${i === 0}"></button>`).join(''),
  featuredNews: homeNews.map((item, i) => `<a class="news-picture" data-news-panel href="${articleHref(item)}"${i ? ' hidden' : ''}>${item.image?`<img src="${escape(item.image)}" alt="${escape(item.imageAlt)}" width="720" height="480" loading="lazy">`:''}<div class="picture-caption"><span>学院新闻 / ${String(i + 1).padStart(2, '0')}</span><h3>${escape(item.title)}</h3></div></a>`).join(''),
  newsList: homeNews.map((item, i) => `<li><a class="news-select${i ? '' : ' is-active'}" data-news-select href="${articleHref(item)}"><div><h3>${escape(item.title)}</h3><span>${escape(item.date || '')}</span></div><p>${escape(item.summary)}</p></a></li>`).join('') || `<li>${emptyContent()}</li>`,
  noticeList: homeNotices.map((item, i) => `<li><a href="${articleHref(item)}"><span class="notice-index" aria-hidden="true">0${i + 1}</span><div><p class="notice-type">通知公告${item.date?' / '+escape(item.date):''}</p><h3>${escape(item.title)}</h3><p class="notice-summary">${escape(item.summary)}</p></div></a></li>`).join('') || `<li>${emptyContent()}</li>`,
  teachers: teacherCards(faculty.home) || emptyContent(),
};
const homeContent = parts => `<h1 class="sr-only">${escape(site.name)}</h1>` + render(read('content/home.html'), parts);
function newsTabs(active) {
  return '<nav class="list-tabs" aria-label="资讯分类">' + site.subNavigation['news.html'].map(([url, title]) => `<a href="${url}"${url === active ? ' aria-current="page"' : ''}>${escape(title)}</a>`).join('') + '</nav>';
}
function collectionPreview(c, about = false) {
  return `<section class="collection-preview overview-section${about?' about-section':''}${c.position % 2 === 0 ? ' overview-section--muted' : ''}" id="${c.anchor}" data-overview-section data-collection="${c.key}"><span class="section-watermark section-watermark--${c.position % 2 === 0 ? 'left' : 'right'}" aria-hidden="true">${c.watermark}</span><div class="container"><div class="editorial-heading"><div><span lang="en">${c.watermark}</span><h2>${escape(c.title)}</h2></div><a href="${c.url}">查看全部</a></div>${previewItems(c, c.url)}</div></section>`;
}
function previewItems(c, href) {
  const records = collectionItems(c,entries.collections);
  if (!records.length) return emptyContent(c.key);
  return `<div class="collection-items collection-items--${c.layout}">` + records.slice(0,href===c.url?3:undefined).map(item=>renderComponent('collection-card', {
    href:escape(item.url),image:c.layout==='cards' && item.image ? media({src:escape(item.image),alt:escape(item.imageAlt),width:640,height:360}):'',
    meta:escape(item.date || ''),title:escape(item.title),summary:escape(item.summary),action:'查看详情',
  })).join('')+'</div>'+demoNote(records);
}
function contentSlot(slot) {
  if (!slot.reference) contentSlots.push(slot);
  const dynamic = django.contentSlot(slot);
  return components.slot(slot.slotName || slot.key, slot.html, dynamic);
}
page('index.html', '首页', homeContent(homeParts));

for (const [file, config] of Object.entries(site.pages)) {
  const overviewMedia = require('../src/data/overview');
  const sections = config.sections.map((section, i) => {
    const {key, anchor, id: sectionId, reference} = config.sectionDefinitions[i];
    const entry = entries.blocks[key];
    const publishedEntry = entry?.published && entry.visible !== false;
    const body = publishedEntry ? recordBody(file === 'about.html' ? {...entry,image:''} : entry) : emptyContent(key);
    const image = file === 'about.html' && publishedEntry && safeHref(entry.image) ? {image:entry.image,alt:entry.imageAlt,caption:entry.caption} : overviewMedia[key];
    const photograph = image ? `<figure class="overview-photo">${media({src:escape(image.image),alt:escape(image.alt),width:1269,height:714})}${image.caption || image.source?`<figcaption>${escape(image.caption)}${safeHref(image.source)?` · <a href="${escape(image.source)}">图片来源与授权</a>`:''}</figcaption>`:''}</figure>` : '';
    const collection = collectionFor(key);
    if (collection) {
      // 保留旧锚点；平台概览与介绍归同一个集合，不生成重复正文。
      const html = key === collection.key ? collectionPreview({...collection,anchor,position:i+1},file==='about.html') : `<span id="${anchor}" class="legacy-anchor"></span>`;
      return contentSlot({key, label: config.title + ' / ' + section, anchor, html, collection: collection.key,position:i+1,about:file==='about.html',reference,slotName:reference?file.replace('.html','')+'.reference.'+key:undefined});
    }
    if (file === 'about.html') {
      const watermark = registry.byId.get(sectionId).watermark;
      const muted = i % 2 === 1;
      const organization = sectionId === 'organization';
      const html = renderComponent('overview-block', {anchor,key,mutedClass:muted?' overview-section--muted':'',side:muted?'left':'right',watermark,title:escape(section),action:organization?'<a href="management.html">查看全部</a>':'',body,photo:photograph,related:organization?managementLinks:''});
      return contentSlot({key, label: config.title + ' / ' + section, anchor, html, overview: true, title: section, watermark, muted, organization, fallbackMedia:overviewMedia[key]}) + (organization ? '<span id="section-3" class="legacy-anchor"></span>' : '');
    }
    const html = `<section class="placeholder-block" id="${anchor}" data-content-key="${key}"><h2>${escape(section)}</h2>${body}</section>`;
    return contentSlot({key, label: config.title + ' / ' + section, anchor, html});
  }).join('');
  const visibleChildren = registry.nodes.filter(n=>n.parentId===registry.byUrl.get(file).id && n.listed!==false && !['alias','section'].includes(n.kind) && !config.sectionDefinitions.some(s=>s.id===n.id || (s.reference && registry.byId.get(s.id).parentId===n.id)));
  const related = visibleChildren.filter(n=>n.id!=='service-guides').map(n=>`<a href="${n.url}">${escape(n.title)}</a>`).join('');
  const overview = (file === 'media.html' ? newsTabs(file) : '') + previewNote + `<div class="overview-sections">${sections}</div>` + (related ? `<nav class="overview-related" aria-label="相关栏目"><span>相关栏目</span>${related}</nav>` : '');
  inner(file, config.title, config.english, overview, config.active || file);
}

for (const c of collections) {
  const siblings = collections.filter(other => other.page === c.page && other.listed).sort((a,b)=>a.position-b.position);
  const side = siblings.length > 1 ? `<aside class="collection-sidebar"><h2>${escape(site.pages[c.page].title)}</h2><nav aria-label="同级栏目">${siblings.map(s => `<a href="${s.url}"${s.key === c.key ? ' aria-current="page"' : ''}>${escape(s.title)}</a>`).join('')}</nav></aside>` : '';
  const detailFile = `layout-${c.slug}.html`;
  const empty = previewItems(c, detailFile);
  inner(c.url, c.title, '', `${c.page === 'media.html' ? newsTabs('media.html') : ''}<div class="${side ? 'collection-layout' : 'collection-single'}">${side}<div>${empty}</div></div>`, c.active);
  for (const record of collectionItems(c,entries.collections)) {
    if (pages.has(record.url)) throw new Error(`Content URL collision: ${record.url}`);
    explicitRoutes.set(record.url,registry.detail(c.id,record.title));
    inner(record.url,record.title,'',`<article class="article"><p class="article-meta">${escape(record.date || '')}${record.sourceLabel?' · '+escape(record.sourceLabel):''}</p>${recordBody(record)}<a class="back-link" href="${c.url}">返回${escape(c.title)}</a></article>`,c.active);
    if(record.previewOnly) { dynamicPages.delete(record.url);delete routeCatalog[record.url.replace('.html','')]; }
  }
  c.parents = routeCatalog[c.slug].parents;
  explicitRoutes.set(detailFile, {...registry.detail(c.id, c.title + '详情版式'), breadcrumbLabel: '详情版式'});
  inner(detailFile, c.title + '详情版式', '', `<article class="article"><p class="page-note">此页面只用于检查栏目到详情的层级。正式正文由后台录入。</p><h2>内容标题待填写</h2><p class="article-meta">日期待填写 · 来源待填写</p><p>这里展示完整内容；列表页只展示标题、摘要和配图，不再直接铺开全文。</p>${c.key === 'science-innovation.section-1' ? '<h2>相关课题组</h2><p>在后台为多个课题组选择这个研究方向后，这里显示相应卡片。</p><a href="research-groups-section-1.html">查看课题组列表</a>' : ''}<a class="back-link" href="${c.url}">返回${escape(c.title)}</a></article>`, c.active);
  delete routeCatalog[detailFile.replace('.html', '')];
}

for (const [file, title, items, slot] of [['news.html', '学院新闻', previewNews, 'news-list'], ['notices.html', '通知公告', previewNotices, 'notice-list']]) {
  const tabs = newsTabs(file);
  const list = `<ul class="article-list" data-boda-slot="${slot}">${items.map(item => `<li><a href="${articleHref(item)}"><h2>${escape(item.title)}</h2><p>${escape(item.summary)}</p><span class="preview-label">${escape(item.date || '')}</span></a></li>`).join('') || `<li>${emptyContent()}</li>`}</ul>`+demoNote(items);
  inner(file, title, file === 'news.html' ? 'NEWS' : 'NOTICES', tabs + previewNote + list, 'news.html');
  for (const item of items.filter(item=>item.visible!==false && (item.published===true || item.layoutOnly))) {
    const picture = item.image ? `<figure class="article-photo"><img src="${escape(item.image)}" alt="${escape(item.imageAlt)}" width="1000" height="600"><figcaption>演示配图，不代表新闻现场</figcaption></figure>` : '';
    explicitRoutes.set(articleHref(item), registry.detail(file === 'news.html' ? 'news' : 'notices', item.title));
    const article = item.layoutOnly ? previewNote + `<h2>${escape(item.title)}</h2><p class="article-meta">发布日期：待提供　来源：待提供</p>${picture}<p>${escape(item.summary)}</p><p>正文待提供。本页仅用于确认文章排版。</p>` : `<p class="article-meta">${escape(item.date || '')}${item.sourceLabel?' · '+escape(item.sourceLabel):''}</p>${recordBody(item)}`;
    inner(articleHref(item), item.title, 'INFORMATION', `<article class="article"><div class="article-content" data-boda-slot="article-content">${article}</div><a class="back-link" href="${file}">返回${title}</a></article>`, 'news.html');
    if(item.previewOnly) {dynamicPages.delete(articleHref(item));delete routeCatalog[item.slug];}
  }
}

const facultyNote = '<p class="page-note">以下为教师个人简介。照片、职称与简介来自已整理的公开资料，待学院及本人核对。</p>';

const facultyPages = registry.nodes.filter(n => Object.hasOwn(n, 'facultyFilter')).map(n => [n.url, n.title, n.facultyFilter]);
for (const [file,title,group] of facultyPages) {
  const tabs = '<nav class="faculty-tabs" aria-label="师资分类">' + facultyPages.map(([href,label]) => '<a href="' + href + '"' + (href === file ? ' aria-current="page"' : '') + '>' + (href === 'faculty.html' ? '教师名录' : label) + '</a>').join('') + '</nav>';
  const groups = group ? faculty.sections(group) : faculty.teachers.length ? [{id:'faculty-list',label:'教师名录',display:'home',teachers:faculty.teachers}] : [];
  const body = groups.map(s=>facultyRenderer.section(s)).join('') || emptyContent('faculty.'+group);
  inner(file,title,'FACULTY',facultyNote + tabs + body,'faculty.html');
}
for (const teacher of faculty.teachers) {
  const sections = sectionBody(teacher.sections);
  const source = safeHref(teacher.source,{external:true}) ? `<p class="profile-source">资料来源：<a href="${escape(teacher.source)}" target="_blank" rel="noopener">${escape(teacher.sourceLabel || teacher.source)}</a>。展示内容待本人确认为准。</p>` : '';
  const contacts = ['email', 'secondaryEmail', 'phone', 'group'].filter(k => teacher[k]).map(k => `<p>${({ email: '电子邮箱', secondaryEmail: '其他邮箱', phone: '联系电话', group: '课题组主页' })[k]}：${k === 'group' ? `<a href="${escape(teacher[k])}" target="_blank" rel="noopener">${escape(teacher[k])}</a>` : escape(teacher[k])}</p>`).join('');
  explicitRoutes.set(teacherHref(teacher), registry.detail('faculty', teacher.name));
  inner(teacherHref(teacher), teacher.name, 'FACULTY', facultyNote + `<div class="teacher-profile"><aside>${teacher.image?`<img src="${escape(teacher.image)}" alt="${escape(teacher.name)}照片" width="180" height="234">`:""}<p class="teacher-title">${escape(teacher.title)}</p><p>${escape(teacher.field)}</p></aside><div>${teacher.intro?`<section class="profile-section"><h2>个人简介</h2><p>${escape(teacher.intro)}</p></section>`:""}${sections}${contacts ? `<section class="profile-section"><h2>联系方式</h2>${contacts}</section>` : ''}${source}<a class="back-link" href="faculty.html">返回教师名录</a></div></div>`, 'faculty.html');
}

const friendlyLinksHtml = renderLinks(site.friendlyLinks);
inner('contact.html', '联系我们', 'CONTACT', previewNote + `<div class="contact-layout"><dl class="contact-list"><div><dt>学院名称</dt><dd>${escape(site.name)}</dd></div>${[['办公地址', site.contact.address], ['公开电话', site.contact.phone], ['电子邮箱', site.contact.email]].map(([key,value])=>`<div><dt>${key}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>${qrCodes?`<div class="contact-qr-codes">${qrCodes}</div>`:''}</div>` + friendlyLinksHtml);
inner('site-map.html', '网站导航', 'SITE MAP', '<div class="site-map-grid">' + site.navigation.map(([href, label]) => `<section><h2><a href="${escape(href)}">${escape(label)}</a></h2>${sitemapItems(site.subNavigation[href] || [])}</section>`).join('') + '</div>', '');
// 静态404与Django错误页共用表情、文案层次及返回入口；不将404加入内容路由目录。
inner('404.html', '页面未找到', '404', renderComponent('error-body', {
  heading: '页面走丢了', message: '页面不存在，或内容尚未批准预览。', homeUrl: 'index.html', sitemapUrl: 'site-map.html',
}));
delete routeCatalog['404'];

const mediaCredits = require('../src/data/media');
inner('image-credits.html', '图片来源与授权', 'IMAGE CREDITS', '<p class="page-note">图片用于内部网站演示。校园、人物与学科示意分别标注；校外技术图片不代表本学院设施或成果。</p><div class="credit-list">' + mediaCredits.map(item => `<section class="credit-item" id="${escape(item.id)}"><a href="assets/${escape(item.id)}.jpg"><img src="assets/${escape(item.id)}.jpg" alt="${escape(item.title)}" width="240" height="180" loading="lazy"></a><div><h2>${escape(item.title)}</h2><p>${escape(item.description)}</p><p>摄影：${escape(item.author)} / Wikimedia Commons</p><p><a href="${escape(item.source)}" target="_blank" rel="noopener">原始文件页</a> · <a href="${escape(item.licenseUrl)}" target="_blank" rel="noopener">${escape(item.license)}</a></p><p>处理：等比例缩放、JPEG压缩；部分页面以CSS裁切展示。可点击缩略图取得本站图片副本。</p></div></section>`).join('') + '</div><section class="profile-section"><h2>校园与教师图片</h2><p>河南大学校徽及校园图片来自用户提供的低空学院参考包，正式使用待学院确认。三位教师照片来自已归档的公开介绍；张锦龙照片取自河南师范大学讲座新闻，郑海务照片取自河南大学物理与电子学院教师页，程纲照片取自河南大学纳米科学与材料工程学院高层次人才页。</p><p>教师资料来源见各教师详情。芯片图为本项目原创矢量示意转为 JPG 的静态学科配图，未使用第三方芯片图片，不代表真实芯片版图。</p><a class="back-link" href="faculty.html">查看师资资料与来源</a></section>', '');

// Old URLs resolve to the current column without duplicating editable content.
for (const alias of registry.nodes.filter(n=>n.kind==='alias')) {
  const target = registry.byId.get(alias.aliasOf);
  for (const map of [pages,dynamicPages]) map.set(alias.url,map.get(target.url));
  routeCatalog[alias.url.replace('.html','')] = {...routeCatalog[target.url.replace('.html','')],aliasOf:target.id};
  if (/-section-\d+\.html$/.test(alias.url)) pages.set('layout-'+alias.url,pages.get('layout-'+target.url));
}
fs.mkdirSync(output, { recursive: true });
// 只写本工程生成的已知文件，不递归清空目录，避免误删队友的其他文件。
for (const [file, html] of pages) writer.write(path.join(output, file), html, 'utf8');
for (const [name, body] of resources) writer.write(path.join(output, name), body);
writer.write(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`已生成 ${pages.size} 个预览页面：${path.join(output, 'index.html')}`);

// 从同一套模板生成 Django 预览外框；不解析或改写博达模板。
const server = path.resolve(root, '../backend');
const templates = path.join(server, 'templates/site/generated');
fs.mkdirSync(templates, { recursive: true });
writer.write(path.join(templates, 'error_body.html'), renderComponent('error-body', {
  heading: '{{ error_heading }}', message: '{{ message }}', homeUrl: '/', sitemapUrl: '/site-map.html',
}));
const serverLinks = html => html.replace(/(href|src)="(?!https?:|mailto:|\/|#|\{)([^"]+)"/g, '$1="/$2"');
for (const [file, html] of dynamicPages) {
  if (file.startsWith('layout-') || file === '404.html') continue;
  writer.write(path.join(templates, file), '{% load content_slots %}\n' + serverLinks(html));
}
const staticHome = pages.get('index.html');
const include = name => `{% include "site/${name}.html" %}`;
page('index.html', '首页', homeContent({ ...homeParts, newsCount:"{% if news %}01{% else %}00{% endif %} / {{ news|length|stringformat:'02d' }}",newsNote:'',noticeNote:'',slides: dynamicSlides.join('\n'), newsList: include('home_news'), featuredNews: include('home_pictures'), noticeList: include('home_notices'), teachers: include('teachers') }));
writer.write(path.join(templates, 'home.html'), '{% load content_slots %}\n' + serverLinks(dynamicPages.get('index.html')));
writer.write(path.join(templates, 'index.html'), '{% load content_slots %}\n' + serverLinks(dynamicPages.get('index.html')));
writer.write(path.join(templates, 'vacancies.html'), '<!-- Vacancies retired: render actual teachers only. -->');
writer.write(path.join(templates, 'friendly_links.html'), friendlyLinksHtml);
writer.write(path.join(templates, 'overview_management_links.html'), serverLinks(managementLinks));
writer.write(path.join(templates, 'media_status.html'), mediaStatus);
pages.set('index.html', staticHome);
const dynamicBreadcrumb = '{% for parent in breadcrumbs %}<a href="{{ parent.href }}">{{ parent.label }}</a><span aria-hidden="true"> / </span>{% endfor %}<span aria-current="page">{{ page_heading }}</span>';
page('frame.html', '{{ page_heading }}', render(read('templates/page.html'), {chipArt: chipArt(), heading: '{{ page_heading }}', english: '{{ page_english }}', breadcrumb: dynamicBreadcrumb, body: '{% block body %}{% endblock %}'}), '', {frame: true});
writer.write(path.join(templates, 'frame.html'), serverLinks(dynamicPages.get('frame.html')));
for (const [name, html] of Object.entries(django.cards(renderComponent, media))) writer.write(path.join(templates, name + '.html'), html);
const teacherBody = t => {
  const contacts=['email','secondaryEmail','phone','group'].filter(k=>t[k]).map(k=>({email:'电子邮箱',secondaryEmail:'其他邮箱',phone:'联系电话',group:'课题组主页'})[k]+'：'+t[k]);
  return [...(t.intro?['## 个人简介',t.intro]:[]),...(t.sections || []).filter(s=>(s.paragraphs || []).some(p=>String(p).trim()) || (s.items || []).some(p=>String(p).trim())).flatMap(s=>[...(s.title?['## '+s.title]:[]),...(s.paragraphs || []),...(s.items || [])]),...(contacts.length?['## 联系方式',...contacts]:[])].join('\n\n');
};
writer.write(path.join(server, 'content-catalog.json'), JSON.stringify({
  facultyCategories, emptyContent: require('../src/data/empty-content.json'),
  slots: Object.fromEntries([...contentSlots.map(s => [s.key, s.label]), ...collections.flatMap(c=>c.legacyKeys.map(key=>[key,c.title+(key===c.key?'':'（兼容旧位置）')])), ...Object.keys(slideDefaults).map((key, i) => [key, `首页轮播 / 第${i + 1}张`])]), routes: routeCatalog, defaults: slideDefaults, collections,
  site: { college: site.college, english: site.english, motto: site.brand.motto, image: site.brand.logo.replace('assets/', ''), address: '', phone: '', email: '', account_name: '', qr_image: '', website_qr_image: '' },
  teachers: faculty.teachers.map((t, i) => ({ key: 'teacher-' + t.slug, title: t.name, subtitle: t.title + ' · ' + t.field, summary: t.summary || t.intro, body: teacherBody(t), image: (t.image || '').replace('assets/', ''), image_alt: t.name + '照片', source_url: t.source, source_label: t.sourceLabel, sort_order: t.order ?? i, is_visible: true, awards:t.awards })),
}, null, 2) + '\n');
writer.write(path.join(server, 'seed-content.json'), JSON.stringify({ news: site.news, notices: site.notices }, null, 2) + '\n');

const inputs = Object.fromEntries([...walk(src), ...walk(path.join(root, 'scripts')).filter(file => !file.includes('__pycache__') && !file.endsWith('.pyc'))].map(file => [path.relative(path.resolve(root, '..'), file).split(path.sep).join('/'), hash(fs.readFileSync(file))]));
writer.finish({inputs, resources: resourceVersions, pageCount: pages.size - 1});
