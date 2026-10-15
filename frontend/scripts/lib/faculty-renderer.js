const {escape} = require('./templates');
const {emptyContent} = require('./content');
function createFacultyRenderer(renderComponent, media) {
  function card(t, display = 'home') {
    const title = escape(t.name) + (t.awardYear ? `（${escape(t.awardYear)}）` : '');
    const image = t.image ? media({src:escape(t.image),alt:escape(t.name+'照片'),width:display==='portrait'?240:100,height:display==='portrait'?320:132}) : '';
    if (display === 'home') return renderComponent('teacher-card', {href:escape(t.href),title,subtitle:escape(t.title),summary:escape(t.summary || t.intro),image});
    return renderComponent('faculty-person', {href:escape(t.href),title,display,
      image:display==='names'?'':image, subtitle:display==='names'?'':`<p class="teacher-title">${escape(t.title)}</p>`,
      summary:display==='portrait' && (t.summary || t.intro) ? `<p class="teacher-intro">${escape(t.summary || t.intro)}</p>` : ''});
  }
  const section = s => renderComponent('faculty-section', {id:escape(s.id),title:escape(s.label),description:'',display:s.display,cards:s.teachers.map(t=>card(t,s.display)).join('') || emptyContent(s.id)});
  return {card,section};
}
module.exports = {createFacultyRenderer};
