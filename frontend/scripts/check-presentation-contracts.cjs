// Regression tests for content identity, rendered navigation, slots and owned output cleanup.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createRegistry} = require('./lib/columns');
const columns = require('../src/data/columns');
const {createTemplates, render, escape} = require('./lib/templates');
const {createWriter, hash, compileStyles, collectResources} = require('./lib/artifacts');
const root = path.resolve(__dirname,'../..');
const registry = createRegistry(columns);
const checks=[];
const test=(name,fn)=>{fn(); checks.push(name); console.log('PASS '+name);};
test('Reordering columns keeps existing content keys, URLs and parent chains',()=>{
 const reversed=createRegistry({...columns,nodes:[...columns.nodes].reverse()});
 for(const c of registry.collections) {
  const other=reversed.collections.find(n=>n.id===c.id);
  assert.deepEqual(other,c);
 }
});
test('Legacy platform/group section aliases still share one destination',()=>{
 for(const name of ['research-platforms','research-groups']) {
  assert.equal(registry.resolveHref(name+'.html#section-2'),name+'-section-1.html');
 }
 assert.equal(registry.resolveHref('about.html#section-2'),'management.html');
 assert.equal(registry.resolveHref('about.html#section-3'),'management-leadership.html');
});
test('Bad identities, cycles and ambiguous URLs fail before rendering',()=>{
 const add=node=>({...columns,nodes:[...columns.nodes,node]});
 assert.throws(()=>createRegistry(add({...columns.nodes[0]})),/Duplicate/);
 assert.throws(()=>createRegistry(add({id:'bad',url:'bad.html',parentId:'bad'})),/cycle/);
 assert.throws(()=>createRegistry(add({id:'bad',url:'bad.html',parentId:'missing'})),/parent/);
});
test('All collection menu destinations are current before hover; other collections keep their top-level parent',()=>{
 let checked=0;
 for(const c of registry.collections){
  const html=fs.readFileSync(path.join(root,'frontend/preview',c.url),'utf8');
  const nav=html.match(/<nav id="main-nav"[\s\S]*?<\/nav>/)[0];
  if(nav.includes(`href="${c.url}"`)) { assert(nav.includes(`href="${c.url}" aria-current="page"`),c.url); checked++; }
  else assert(nav.includes(`href="${c.active}" aria-current="page"`),c.url);
 }
 assert(checked >= 17);
});
test('Employment and teacher detail retain complete hierarchy',()=>{
 assert.deepEqual(registry.detail('employment-guidance','招聘会').parents.map(p=>p.href),['talent-cultivation.html','admissions-section-3.html']);
 assert.deepEqual(registry.detail('faculty','程纲').parents.map(p=>p.href),['faculty.html']);
 const html=fs.readFileSync(path.join(root,'frontend/preview/teacher-cheng-gang.html'),'utf8');
 assert.match(html,/<nav class="breadcrumb"[^>]*>.*?href="faculty.html">师资队伍<.*?程纲/s);
});
test('Main preview breadcrumbs do not alter dynamic news hierarchy',()=>{
 const names=parents=>parents.map(p=>p.label);
 assert.deepEqual(names(registry.route('notices.html').previewParents),['新闻通知','新闻通知']);
 assert.deepEqual(names(registry.route('notices.html').parents),['新闻通知']);
 assert.deepEqual(names(registry.detail('news','新闻详情').previewParents),['新闻通知','学院新闻']);
 assert.deepEqual(names(registry.detail('news','新闻详情').parents),['学院新闻']);
 assert.deepEqual(names(registry.detail('notices','通知详情').parents),['新闻通知','通知公告']);
 assert(!registry.detail('notices','通知详情').previewParents);
});
test('Slots are explicit, independent of placeholder whitespace and fail on missing names',()=>{
 const templates=createTemplates(path.join(root,'frontend/src/templates'));
 const marker=templates.slot('qr','\n <aside>待提供</aside>\n','{% include "site/wechat.html" %}');
 assert.equal(templates.resolve('a'+marker+'b','django'),'a{% include "site/wechat.html" %}b');
 assert.throws(()=>templates.resolve('<!--slot:missing-->','django'),/Unknown/);
 assert.throws(()=>templates.slot('qr','',''),/duplicate/);
 assert.throws(()=>render('{{title}}',{}),/Missing/);
 assert.equal(escape('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
});
test('Dynamic templates bind site fields and content independently of static text',()=>{
 const html=fs.readFileSync(path.join(root,'backend/templates/site/generated/about.html'),'utf8');
 assert(html.includes('{{ site_info.motto }}'));
 assert(html.includes('{% include "site/wechat.html" %}'));
 assert(html.includes("{% content_block 'about.section-1' as entry %}"));
 assert(!html.includes('<!--slot:'));
 for(const name of ['teachers','collection_items']) {
  const card=fs.readFileSync(path.join(root,'backend/templates/site/generated',name+'.html'),'utf8');
  assert(card.includes('data-media') && card.includes('data-media-status'));
 }
});
test('Generated style has no runtime imports and resource versions match bytes',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'frontend/build-manifest.json')));
 const html=fs.readFileSync(path.join(root,'frontend/preview/index.html'),'utf8');
 assert.equal(manifest.pageCount,fs.readdirSync(path.join(root,'frontend/preview')).filter(f=>f.endsWith('.html')).length);
 assert(manifest.pageCount >= 89, 'confirmed additions and old URL compatibility');
 for(const [name,fingerprint] of Object.entries(manifest.resources)) {
  assert.equal(hash(fs.readFileSync(path.join(root,'frontend/preview',name))),fingerprint,name);
  if(/^(css|js)\//.test(name)) assert(html.includes(name+'?v='+fingerprint.slice(0,12)),name);
 }
 assert(!compileStyles(path.join(root,'frontend/src/css/style.css')).includes('@import'));
});
test('Removed owned outputs are cleaned; unknown and locally modified outputs survive',()=>{
 const dir=fs.mkdtempSync(path.join(root,'sandbox/owned-output-test-'));
 const manifest=path.join(dir,'manifest.json');
 const file=name=>path.join(dir,'frontend/preview/assets',name);
 let writer=createWriter(dir,manifest);
 writer.write(file('removed.txt'),'generated');
 writer.write(file('changed.txt'),'generated');
 writer.finish({});
 fs.writeFileSync(file('changed.txt'),'manual changes');
 fs.writeFileSync(file('unknown.txt'),'personal');
 writer=createWriter(dir,manifest);
 const result=writer.finish({});
 assert(!fs.existsSync(file('removed.txt')));
 assert.equal(fs.readFileSync(file('changed.txt'),'utf8'),'manual changes');
 assert.equal(fs.readFileSync(file('unknown.txt'),'utf8'),'personal');
 assert.deepEqual(result.preserved,['frontend/preview/assets/changed.txt']);
 fs.writeFileSync(manifest,JSON.stringify({version:1,outputs:{'frontend/preview/../../private.txt':'x'}}));
 assert.throws(()=>createWriter(dir,manifest),/Unowned/);
});
test('Resource edits invalidate their version without hand-editing templates',()=>{
 const dir=fs.mkdtempSync(path.join(root,'sandbox/resource-version-test-'));
 for(const folder of ['css','js','assets']) fs.mkdirSync(path.join(dir,folder));
 fs.mkdirSync(path.join(dir,'css/components'));
 fs.writeFileSync(path.join(dir,'css/style.css'),'@import "./components/example.css";');
 fs.writeFileSync(path.join(dir,'css/components/example.css'),'.title {color: blue}');
 fs.writeFileSync(path.join(dir,'js/main.js'),'const test = 1;');
 const before=collectResources(dir);
 fs.writeFileSync(path.join(dir,'css/components/example.css'),'.title {color: red}');
 const after=collectResources(dir);
 assert.notEqual(hash(before.get('css/style.css')),hash(after.get('css/style.css')));
 assert.equal(hash(before.get('js/main.js')),hash(after.get('js/main.js')));
 assert(!after.has('css/components/example.css'));
});
console.log(`${checks.length} presentation contract checks passed`);
