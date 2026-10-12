// 参考并改编低空 scripts/build-site.js：保留配置/模板/正文分离与 render 函数。
// 本版在构建时直接输出公共头尾，不依赖浏览器 JS 挂载；不执行参考包的构建。
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const output = path.join(root, 'preview');
const site = require('../src/data/site');
const read = relative => fs.readFileSync(path.join(src, relative), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function render(template, values) {
  return template.replace(/{{([a-zA-Z0-9_]+)}}/g, (match, key) => {
    if (!(key in values)) throw new Error(`Missing template value: ${key}`);
    return values[key];
  });
}

const pages = new Map();
const previewNote = '<p class="page-note">内部预览：此处为内容占位，待学院审核后替换，不代表已发布的正式信息。</p>';
const articleHref = item => `${item.slug}.html`;
const teacherHref = teacher => `teacher-${teacher.slug}.html`;
function teacherCards() {
  return site.teachers.map(teacher => `<a class="faculty-card" href="${teacherHref(teacher)}"><img src="${escape(teacher.image)}" alt="${escape(teacher.name)}照片（待审核）" width="100" height="132" loading="lazy"><div><h3>${escape(teacher.name)}</h3><p>教师资料待审核</p><span class="teacher-link">查看资料 →</span></div></a>`).join('\n');
}

function page(file, title, content, active = file) {
  const navigation = site.navigation.map(([href, label]) => `<li><a href="${escape(href)}"${href === active ? ' aria-current="page"' : ''}>${escape(label)}</a></li>`).join('\n');
  const shared = Object.fromEntries(Object.entries({ name: site.name, college: site.college, english: site.english, ...site.contact }).map(([key, value]) => [key, escape(value)]));
  const html = render(read('templates/document.html'), {
    title: escape(`${title} - ${site.name}（内部预览）`),
    description: escape(`${site.name}基础前端预览，内容和素材待审定。`),
    header: render(read('templates/partials/header.html'), { ...shared, navigation }),
    footer: render(read('templates/partials/footer.html'), shared), content,
  });
  if (/{{[a-zA-Z0-9_]+}}/.test(html)) throw new Error(`Unresolved template value in ${file}`);
  pages.set(file, `<!-- 自动生成：修改 src/ 后运行 node scripts/build-site.js。 -->\n${html}`);
}

function inner(file, title, english, body, active = file) {
  page(file, title, render(read('templates/page.html'), { heading: escape(title), english: escape(english), breadcrumb: `<span aria-current="page">${escape(title)}</span>`, body }), active);
}

const slides = site.slides.map((slide, i) => `<div class="hero-slide hero-slide--${escape(slide.theme)}" data-slide data-title="${escape(slide.title)}" role="group" aria-roledescription="幻灯片" aria-label="第 ${i + 1} 张，共 ${site.slides.length} 张"${i ? ' hidden' : ''}><img class="hero-image" src="${escape(slide.image)}" alt="${escape(slide.alt)}" width="1600" height="560"${i ? '' : ' fetchpriority="high"'}><div class="container hero-copy"><p class="hero-eyebrow">${escape(slide.eyebrow)}</p><h2>${escape(slide.title)}</h2><p class="hero-description">${escape(slide.text)}</p></div><p class="hero-note">${escape(slide.note)}</p></div>`).join('\n');
const featured = site.news[0];
page('index.html', '首页', `<h1 class="sr-only">${escape(site.name)}</h1>` + render(read('content/home.html'), {
  slides,
  slideCount: String(site.slides.length).padStart(2, '0'),
  dots: site.slides.map((slide, i) => `<button type="button" data-dot aria-label="查看第 ${i + 1} 张：${escape(slide.title)}" aria-pressed="${i === 0}"></button>`).join(''),
  featuredNews: `<a class="featured-news" href="${articleHref(featured)}"><img class="news-image" src="assets/chip-banner.svg" alt="图片新闻配图占位，芯片示意图" width="640" height="360" loading="lazy"><span class="preview-label">图片新闻 · 内容占位</span><h3>${escape(featured.title)}</h3><p>${escape(featured.summary)}</p></a>`,
  newsList: site.news.slice(1).map(item => `<li><a href="${articleHref(item)}"><h3>${escape(item.title)}</h3><span>发布日期待提供</span></a></li>`).join(''),
  noticeList: site.notices.map(item => `<li><a href="${articleHref(item)}"><span class="notice-date" aria-hidden="true"><i>—</i>待提供</span><h3>${escape(item.title)}</h3></a></li>`).join(''),
  teachers: teacherCards(),
}));

for (const [file, config] of Object.entries(site.pages)) {
  inner(file, config.title, config.english, previewNote + config.sections.map((section, i) => `<section class="placeholder-block" id="section-${i + 1}"><h2>${escape(section)}</h2><p>${escape(section)}资料待提供。</p></section>`).join(''));
}

for (const [file, title, items, slot] of [['news.html', '学院新闻', site.news, 'news-list'], ['notices.html', '通知公告', site.notices, 'notice-list']]) {
  const tabs = `<nav class="list-tabs" aria-label="资讯分类"><a href="news.html"${file === 'news.html' ? ' aria-current="page"' : ''}>学院新闻</a><a href="notices.html"${file === 'notices.html' ? ' aria-current="page"' : ''}>通知公告</a></nav>`;
  const list = `<ul class="article-list" data-boda-slot="${slot}">${items.map(item => `<li><a href="${articleHref(item)}"><h2>${escape(item.title)}</h2><p>${escape(item.summary)}</p><span class="preview-label">发布日期待提供 · 内容占位</span></a></li>`).join('')}</ul>`;
  inner(file, title, file === 'news.html' ? 'NEWS' : 'NOTICES', tabs + previewNote + list, 'news.html');
  for (const item of items) {
    inner(articleHref(item), title, 'INFORMATION', `<article class="article">${previewNote}<h2>${escape(item.title)}</h2><p class="article-meta">发布日期：待提供　来源：待提供</p><div class="article-content" data-boda-slot="article-content"><p>${escape(item.summary)}</p><p>正文待提供。本页仅用于确认文章排版。</p></div><a class="back-link" href="${file}">← 返回${title}</a></article>`, 'news.html');
  }
}

inner('faculty.html', '师资队伍', 'FACULTY', previewNote + '<p class="section-note">暂用已收集的三位教师资料，名单、照片及简历以学院审定版本为准。</p><div class="faculty-grid">' + teacherCards() + '</div>');
for (const teacher of site.teachers) {
  inner(teacherHref(teacher), teacher.name, 'FACULTY', previewNote + `<div class="teacher-profile"><img src="${escape(teacher.image)}" alt="${escape(teacher.name)}照片（待审核）" width="180" height="234"><div><section class="placeholder-block"><h2>个人简介</h2><p>现有简历底稿待学院审核，审核后在此展示。</p></section><section class="placeholder-block"><h2>研究方向与教学</h2><p>研究方向、课程及公开联系方式待审定。</p></section><a class="back-link" href="faculty.html">← 返回师资队伍</a></div></div>`, 'faculty.html');
}
inner('contact.html', '联系我们', 'CONTACT', previewNote + `<dl class="contact-list"><div><dt>学院名称</dt><dd>${escape(site.name)}</dd></div>${[['办公地址', site.contact.address], ['公开电话', site.contact.phone], ['电子邮箱', site.contact.email]].map(([key, value]) => `<div><dt>${key}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`);

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
