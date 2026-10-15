const {escape,createTemplates} = require('./templates');
const emptyCopy = require('../../src/data/empty-content.json');
const emptyTemplates = createTemplates(require('node:path').resolve(__dirname,'../../src/templates'));
const EMPTY_TEXT = emptyCopy.message;
const emptyContent = (key='') => emptyTemplates.render('components/empty-state.html', {description:emptyCopy.descriptions[key]?`<p class="empty-state-description">${escape(emptyCopy.descriptions[key])}</p>`:'',message:escape(EMPTY_TEXT)}).trim();
function visibleSlides(slides) {
  const ids=new Set();
  for(const slide of slides) {
    if(!/^home\.slide-[a-z0-9-]+$/.test(slide.id || '') || ids.has(slide.id)) throw new Error(`Invalid/duplicate slide identity: ${slide.id}`);
    ids.add(slide.id);
  }
  return slides.filter(s=>s.enabled!==false).sort((a,b)=>(a.order??0)-(b.order??0));
}
function safeHref(value, {external = false} = {}) {
  if (!value || typeof value !== 'string' || /[\s\\<>"\x00-\x1f]/.test(value)) return '';
  if (/^https?:\/\//i.test(value)) { try { const url = new URL(value); return url.username || url.password ? '' : value; } catch { return ''; } }
  return !external && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value) && !value.split('/').includes('..') ? value : '';
}
function sectionBody(sections = []) {
  return sections.map(s=>{
    const paragraphs=(s.paragraphs || []).filter(p=>String(p).trim());
    const items=(s.items || []).filter(p=>String(p).trim());
    if (!paragraphs.length && !items.length) return '';
    return `<section class="profile-section">${s.title?`<h2>${escape(s.title)}</h2>`:''}${paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}${items.length?`<ul>${items.map(p=>`<li>${escape(p)}</li>`).join('')}</ul>`:''}</section>`;
  }).join('');
}
function recordBody(record = {}) {
  const body = sectionBody(record.sections);
  const image = safeHref(record.image) ? `<figure class="article-photo"><img src="${escape(record.image)}" alt="${escape(record.imageAlt)}" width="1000" height="600" loading="lazy">${record.caption?`<figcaption>${escape(record.caption)}</figcaption>`:''}</figure>`:'';
  const attachments = (record.attachments || []).filter(a=>safeHref(a.url)).map(a=>`<li><a href="${escape(a.url)}">${escape(a.name)}</a></li>`).join('');
  const service = safeHref(record.serviceUrl,{external:true});
  const source = safeHref(record.sourceUrl,{external:true});
  return image + (body || emptyContent()) + (attachments ? `<section class="profile-section"><h2>附件</h2><ul>${attachments}</ul></section>` : '') + (service ? `<a class="external-service" href="${escape(service)}" target="_blank" rel="noopener">${escape(record.serviceLabel || '访问服务平台')}</a>` : '') + (source?`<p class="profile-source">来源：<a href="${escape(source)}" target="_blank" rel="noopener">${escape(record.sourceLabel || source)}</a></p>`:'');
}
function collectionRecords(c, source) {
  const ids = new Map();
  for (const key of c.legacyKeys) for (const r of source[key] || []) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(r.id || '')) throw new Error(`Invalid content identity: ${r.id}`);
    if (r.date && (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || new Date(r.date).toISOString().slice(0,10)!==r.date)) throw new Error(`Invalid publication date: ${r.id}`);
    if (ids.has(r.id)) {
      if (JSON.stringify(ids.get(r.id)) !== JSON.stringify(r)) throw new Error(`Conflicting content identity: ${r.id}`);
    } else ids.set(r.id,r);
  }
  return [...ids.values()].filter(r=>r.published===true && r.visible!==false).map(r=>({...r,url:`content-${r.id}.html`}))
    .sort((a,b)=>(c.sort==='date-desc'?0:(a.order??100)-(b.order??100)) || (b.date||'').localeCompare(a.date||'') || a.id.localeCompare(b.id));
}
function renderLinks(links) {
  return '<div class="friendly-links">' + [['internal','校内链接','CAMPUS LINKS'],['external','校外链接','EXTERNAL LINKS']].map(([group,label,english])=>{
    const items=links.filter(l=>l.group===group && l.enabled!==false && safeHref(l.url,{external:true})).sort((a,b)=>a.order-b.order || a.id.localeCompare(b.id));
    return items.length ? `<section aria-labelledby="links-${group}"><details class="link-drawer" data-disclosure><summary id="links-${group}"><span class="link-drawer-label"><span class="link-drawer-title">${label}</span><span class="link-drawer-english" aria-hidden="true">${english}</span></span><span class="link-drawer-icon" aria-hidden="true"></span></summary><div class="link-drawer-panel"><ul>${items.map(l=>`<li><a href="${escape(l.url)}" target="_blank" rel="noopener">${escape(l.name)}</a></li>`).join('')}</ul></div></details></section>`:'';
  }).join('')+'</div>';
}
function qrPanel(data, kind='wechat', {placeholder=true}={}) {
  if (!data?.enabled) return '';
  const hasImage=!!safeHref(data.image);
  if (!hasImage && !placeholder) return '';
  const visual=hasImage ? `<img class="wechat-code" src="${escape(data.image)}" alt="${escape(data.name)}二维码" width="120" height="120" loading="lazy">` : '<div class="wechat-placeholder">二维码<br>待提供</div>';
  return `<aside class="wechat-panel${kind==='website'?' website-code':''}" aria-label="${escape(data.name)}">${visual}<div><p class="wechat-title">${escape(data.name)}</p><p class="wechat-caption">${escape(hasImage?data.caption:'正式二维码待补充')}</p></div></aside>`;
}
module.exports = {EMPTY_TEXT,emptyContent,safeHref,sectionBody,recordBody,collectionRecords,renderLinks,qrPanel,visibleSlides};
