// Django preview adapter only. The component templates and column definitions contain no ORM/HTTP assumptions.
function chrome() {
  return {name:'{{ site_info.name }}', college:'{{ site_info.college }}', english:'{{ site_info.english }}',
    logo:'/assets/{{ site_info.image }}', logoAlt:"{{ site_info.image_alt|default:'河南大学校徽' }}",
    motto:'{{ site_info.motto }}', footerEnglish:'{{ site_info.english }}',
    filing:"{{ site_info.body|default:'正式网站备案与平台信息待学校配置' }}", wechat:'{% include "site/wechat.html" %}{% include "site/website_qr.html" %}'};
}
function currentAttribute(href, depth) {
  return `{% if ${depth === 0 ? `active_page == "${href}"` : `request.path == "/${href}"`} %} aria-current="page"{% endif %}`;
}
function contentSlot(slot) {
  if (slot.collection) return slot.key === slot.collection ? `{% collection_preview '${slot.collection}' %}` : slot.html;
  const component = slot.overview ? 'overview_content_block' : 'content_block';
  const parameters = slot.overview ? ` heading="${slot.title}" watermark="${slot.watermark}" muted=${slot.muted ? 'True' : 'False'}` : '';
  return `{% content_block '${slot.key}' as entry %}{% if entry %}{% include "site/${component}.html" with anchor="${slot.anchor}"${parameters} %}{% else %}${slot.html}{% endif %}`;
}
function slide(values, {key,isChip,mediaStatus}, renderComponent) {
  const live=(field,fallback)=>`{% if slide.is_visible %}{{ slide.${field} }}{% else %}${fallback}{% endif %}`;
  return `{% content_block '${key}' as slide %}` + renderComponent('slide', {
    ...values, mediaAttribute:isChip ? '{% if slide.is_visible and slide.image %} data-media{% endif %}' : ' data-media',
    title:live('title',values.title), eyebrow:live('subtitle',values.eyebrow), text:live('summary',values.text), note:live('body',values.note),
    visual:`{% if slide.is_visible and slide.image %}<img class="hero-image" src="/assets/{{ slide.image }}" alt="{{ slide.image_alt }}" width="1600" height="560">${mediaStatus}{% else %}${values.visual}{% endif %}`,
  });
}
function cards(renderComponent, media) {
  return {
    faculty_sections:'{% for section in faculty_sections %}' + renderComponent('faculty-section', {id:'{{ section.id }}',title:'{{ section.label }}',description:'{{ section.description }}',cards:'{% if section.teachers %}{% include "site/teachers.html" with teachers=section.teachers %}{% else %}<div class="collection-empty-state"><p>名单待学院审定，后续陆续更新。</p></div>{% endif %}'}) + '{% endfor %}',
    teachers:'{% for teacher in teachers %}' + renderComponent('teacher-card', {
      href:'/{{ teacher.key }}.html',title:'{{ teacher.title }}',subtitle:'{{ teacher.subtitle }}',summary:'{{ teacher.summary }}',
      image:'{% if teacher.image %}' + media({src:'/assets/{{ teacher.image }}',alt:'{{ teacher.title }}照片',width:100,height:132}) + '{% endif %}',
    }) + '{% endfor %}',
    collection_items:'<div class="collection-items collection-items--{{ collection.layout }}">{% for item in items %}' + renderComponent('collection-card', {
      href:'/{{ item.url }}',title:'{{ item.title }}',summary:'{{ item.summary|truncatechars:140 }}',action:'查看详情',
      meta:"{{ item.date|default:'日期待提供' }}{% if item.source_label %} · {{ item.source_label }}{% endif %}",
      image:'{% if collection.layout == \'cards\' %}{% if item.image %}' + media({src:'/assets/{{ item.image }}',alt:'{{ item.image_alt }}',width:640,height:360}) + '{% else %}<div class="collection-cover" aria-hidden="true">{{ collection.title }}</div>{% endif %}{% endif %}',
    }) + '{% empty %}<div class="collection-empty-state"><p>暂无已发布内容，资料将陆续更新。</p></div>{% endfor %}</div>',
  };
}
module.exports={chrome,currentAttribute,contentSlot,slide,cards};
