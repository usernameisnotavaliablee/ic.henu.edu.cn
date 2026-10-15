const {escape} = require('./templates');
const {safeHref} = require('./content');
function homeParts(config, registry) {
  const column = id => {const c=registry.byId.get(id); if(!c) throw new Error(`Unknown home column: ${id}`); return c;};
  const result = {facultyNote:escape(config.facultyNote)};
  for (const [key,h] of Object.entries(config.headings)) result[key+'Heading'] = `<div><span>${escape(h.english)}</span><h2 id="${key}-title">${escape(h.title)}</h2></div><a href="${escape(column(h.column).url)}">${escape(h.linkLabel)}</a>`;
  for (const key of ['research','education']) {
    const f = config[key];
    result[key+'Copy'] = `<p class="feature-intro">${escape(f.intro)}</p><p class="muted">${escape(f.summary)}</p>` + f.rows.map((r,i)=>`<a class="feature-row" href="${escape(column(r.column).url)}"><span class="feature-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div><h3>${escape(column(r.column).title)}</h3><p>${escape(r.summary)}</p></div></a>`).join('') + (f.links.length ? `<div class="research-links">${f.links.map(id=>`<a href="${escape(column(id).url)}">${escape(column(id).title)}</a>`).join('')}</div>`:'');
    result[key+'Image'] = safeHref(f.image) ? `<img src="${escape(f.image)}" alt="${escape(f.alt)}" width="1600" height="1067" loading="lazy">` : '';
    if (key==='research' && safeHref(f.image)) result[key+'Image'] = `<div class="chip-visual chip-visual--detail" aria-hidden="true"><img src="${escape(f.image)}" data-no-media alt="" width="1600" height="800"></div>`;
    result[key+'Caption'] = escape(f.caption)+`<span>${escape(f.note)}</span>`;
  }
  result.visualTopics=config.topics.filter(t=>t.enabled!==false).map(t=>`<figure>${safeHref(t.image)?`<img src="${escape(t.image)}" alt="${escape(t.alt)}" width="1400" height="1000" loading="lazy">`:''}<figcaption class="topic-copy"><h3><a class="topic-destination" href="${escape(column(t.column).url)}"><span class="topic-label">${escape(t.title)}</span></a></h3><p>${escape(t.caption)}${safeHref(t.source)?` · <a class="topic-source" href="${escape(t.source)}">图片来源</a>`:''}</p></figcaption></figure>`).join('');
  return result;
}
module.exports={homeParts};
