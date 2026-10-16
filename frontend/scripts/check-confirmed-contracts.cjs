const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createFaculty}=require('./lib/faculty');
const {collectionRecords,sectionBody,qrPanel,renderLinks,safeHref,visibleSlides}=require('./lib/content');
const registry=require('./lib/columns');
const {teachers,memberships,categories,renderer}=require('./fixtures/confirmed-requirements.cjs');
const checks=[];const test=(name,fn)=>{fn();checks.push(name);};
const data={teachers,categories,memberships};
const faculty=createFaculty(data);
test('Approved menus expose admissions directly and retain old content identities',()=>{
 const source=require('../src/data/columns');
 const expected={about:['school-introduction','academic-committee','organization'],research:['research-directions','platforms','groups','research-progress','academic-exchanges','ic-world','instruments'],education:['undergraduate-admissions','graduate-admissions','disciplines','curriculum','engineering-accreditation','employment-guidance','community'],faculty:['faculty-talents','faculty-teachers','faculty-directory'],news:['news','notices','media'],party:['party-news','party-learning']};
 for(const [id,children] of Object.entries(expected))assert.deepEqual(source.navigation.find(n=>n.id===id).children.map(n=>n.id),children);
 for(const [i,id] of ['undergraduate-admissions','graduate-admissions','employment-guidance'].entries()) {
  const node=registry.byId.get(id);assert.equal(node.parentId,'education');assert.equal(node.storageKey,`admissions.section-${i+1}`);assert.equal(node.url,`admissions-section-${i+1}.html`);
  assert.equal(registry.resolveHref(`admissions.html#section-${i+1}`),node.url);
 }
});
test('Review demos yield to supplied data and never revive withdrawn entries',()=>{
 const {articleItems,collectionItems,demoNote}=require('./lib/preview-content');
 assert.equal(articleItems([],'news').length,4);
 const real={slug:'real-news',title:'已审定新闻',published:true};
 assert.deepEqual(articleItems([real],'news'),[real]);
 assert.equal(articleItems([{...real,visible:false}],'news').length,0);
 const media=registry.collections.find(c=>c.id==='media-reports');
 assert.equal(collectionItems(media,{}).length,3);
 assert.equal(collectionItems(media,{[media.key]:[{id:'withdrawn',visible:false,published:true}]}).length,0);
 assert.match(demoNote(articleItems([],'news')),/相关内容正在整理中/);
 assert.equal(demoNote([real]),'');
 const catalog=fs.readFileSync(path.resolve(__dirname,'../../backend/content-catalog.json'),'utf8');
 assert(!catalog.includes('demo-media-') && !catalog.includes('news-preview-1'));
});
test('Approved six titles in priority order; ordinary teachers separate',()=>assert.deepEqual(faculty.sections('talent').map(s=>s.id),['national-leading','national-young','provincial-professor','yellow-river-mingde','university-professor','hundred-talents']));
test('Multiple awards reference one teacher/detail but carry independent years',()=>{
 const [leading,young]=faculty.sections('talent');
 assert.equal(leading.teachers[0].href,young.teachers[0].href);assert.equal(leading.teachers[0].awardYear,2020);assert.equal(young.teachers[0].awardYear,2015);
 assert(!renderer.card(young.teachers[1],'portrait').includes('（）'));
});
test('Highest title outranks manual order; home unique and capped at three',()=>{
 const reversed=createFaculty({...data,teachers:teachers.map(t=>({...t,order:100-t.order}))});
 assert.deepEqual(reversed.home.map(t=>t.id),['a','b','c']);assert.equal(new Set(reversed.home.map(t=>t.id)).size,3);
});
test('Manual order within a rank; stable ID resolves ties',()=>{
 const same=createFaculty({...data,memberships:[],teachers:[...teachers].reverse()});
 assert.deepEqual(same.home.map(t=>t.id),['a','b','c']);
 assert.deepEqual(createFaculty({...data,memberships:[],teachers:teachers.map(t=>({...t,order:0})).reverse()}).home.map(t=>t.id),['a','b','c']);
});
test('Draft/withdrawn teachers disappear before empty group calculation',()=>{
 const result=createFaculty({...data,teachers:teachers.map(t=>({...t,visible:t.id!=='a',published:t.id!=='b'}))});
 assert(result.sections('talent').filter(s=>s.display==='portrait').every(s=>s.teachers.length===0));assert(!result.home.some(t=>['a','b'].includes(t.id)));
});

test('Empty national groups remain in order; other empty groups stay hidden',()=>{
 const result=createFaculty({...data,memberships:[]});
 assert.deepEqual(result.sections('talent').map(s=>s.id),['national-leading','national-young']);
 for(const section of result.sections('talent')) {
  const html=renderer.section(section);assert(html.includes('相关内容正在整理中'));
  assert(!html.includes('<img') && !html.includes('class="faculty-person'));
 }
});
test('Unclassified/legacy categories keep full directory, never infer ordinary status',()=>{
 const result=createFaculty({...data,memberships:[{teacherId:'a',categoryId:'other-talent'}]});
 assert.equal(result.teachers.length,5);assert.equal(result.sections('talent').length,2);assert(result.sections('talent').every(s=>s.teachers.length===0));assert.equal(result.sections('regular').length,0);assert.equal(result.teachers[0].legacyCategories[0].categoryId,'other-talent');
});
test('Disabled categories do not affect home ranking or visible blocks',()=>{
 const result=createFaculty({...data,categories:categories.map(c=>({...c,enabled:c.group==='regular'}))});assert.equal(result.home[0].id,'e');assert.equal(result.sections('talent').length,0);
});
test('Missing teacher, duplicated identities/relations and malformed years fail',()=>{
 assert.throws(()=>createFaculty({...data,teachers:[...teachers,teachers[0]]}),/identity/);
 assert.throws(()=>createFaculty({...data,memberships:[...memberships,memberships[0]]}),/Duplicate/);
 assert.throws(()=>createFaculty({...data,memberships:[{teacherId:'missing',categoryId:'national-leading'}]}),/Unknown/);
 assert.throws(()=>createFaculty({...data,memberships:[{...memberships[0],year:'20xx'}]}),/year/);
});
test('Three internal displays have the required image and summary boundaries',()=>{
 assert.match(renderer.card(faculty.teachers[0],'portrait'),/teacher-intro/);
 assert(!renderer.card(faculty.teachers[0],'compact').includes('teacher-intro'));
 assert(!renderer.card(faculty.teachers[0],'names').includes('<img'));
 assert(!renderer.card(faculty.teachers[0],'home').includes('faculty-person'));
});
test('Optional teacher sections do not emit empty headings',()=>assert.equal(sectionBody([{title:'Empty',paragraphs:[' '],items:[]}]),''));
test('Academic committee parallel to administration; four admin children',()=>{
 assert.equal(registry.byId.get('academic-committee').parentId,'about');
 assert.deepEqual(registry.byId.get('organization').sections.map(s=>s.id),['leadership','administrative-offices','professors-committee','trade-union']);
});

test('Research overview previews existing groups without another related link',()=>{
 const research=registry.byId.get('research');
 assert(research.sections.some(s=>s.id==='group-directory' && s.reference===true));
 const html=fs.readFileSync(path.resolve(__dirname,'../preview/science-innovation.html'),'utf8');
 assert(html.includes('data-collection="research-groups.section-1"'));
 assert(!/<nav class="overview-related"[^>]*>[\s\S]*?href="research-groups.html"[\s\S]*?<\/nav>/.test(html));
});
test('Unified regulations keep three historic storage keys and URLs',()=>{
 const c=registry.collections.find(c=>c.id==='student-regulations');assert.equal(c.legacyKeys.length,3);
 for(const url of ['regulations.html','regulations-section-1.html','regulations-section-2.html','regulations.html#section-1'])assert.equal(registry.resolveHref(url),'student-regulations.html');
 assert.deepEqual(registry.route('regulations.html').parents.map(p=>p.href),['talent-cultivation.html','community.html']);
});
test('Merged regulations use publication date, not uploaded date or manual order',()=>{
 const c=registry.collections.find(c=>c.id==='student-regulations');
 const rows=collectionRecords(c,{'community.section-3':[{id:'old',date:'2020-01-01',uploadedAt:'2026-10-15',published:true,order:0}], 'regulations.section-1':[{id:'new',date:'2026-01-01',uploadedAt:'2026-01-01',published:true,order:100}]});assert.deepEqual(rows.map(r=>r.id),['new','old']);
});
test('Hidden/draft content is not listed and conflicting IDs fail',()=>{
 const c=registry.collections[0];assert.equal(collectionRecords(c,{[c.key]:[{id:'draft'},{id:'hidden',published:true,visible:false}]}).length,0);
 assert.throws(()=>collectionRecords(c,{[c.key]:[{id:'same',title:'a'},{id:'same',title:'b'}]}),/Conflicting/);
});
test('QR visibility and URL protocol validation',()=>{
 assert(qrPanel({enabled:true,image:''}).includes('wechat-placeholder'));assert.equal(qrPanel({enabled:true,image:''},'website',{placeholder:false}),'');assert.equal(qrPanel({enabled:false,image:'assets/henu-logo.png'}),'');assert(!safeHref('javascript:alert(1)'));assert(!safeHref('//evil.test/path'));
 assert(qrPanel({enabled:true,image:'assets/henu-logo.png',name:'Test'}).includes('wechat-code'));
 assert(!renderLinks([{id:'x',group:'internal',name:'bad',url:'javascript:alert(1)',order:0}]).includes('href='));
});
test('Slide identity survives reordering; zero/one/many and disabled records',()=>{
 const slides=[{id:'home.slide-a',order:2},{id:'home.slide-b',order:1},{id:'home.slide-c',order:0,enabled:false}];
 assert.deepEqual(visibleSlides(slides).map(s=>s.id),['home.slide-b','home.slide-a']);
 assert.equal(visibleSlides([]).length,0);assert.equal(visibleSlides(slides.slice(0,1)).length,1);
 assert.throws(()=>visibleSlides([...slides,slides[0]]),/duplicate/);
});
const output=path.resolve(process.env.IC_TEST_OUTPUT || 'sandbox/frontend-checks');fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'confirmed-contracts.json'),JSON.stringify({passed:true,count:checks.length,checks,scope:'pure models and renderers; isolated fixtures only'},null,2));
console.log(`Confirmed requirements: ${checks.length} contract checks passed`);
