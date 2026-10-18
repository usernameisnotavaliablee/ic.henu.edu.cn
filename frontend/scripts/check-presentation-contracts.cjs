// Regression tests for content identity, rendered navigation, slots and owned output cleanup.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createRegistry} = require('./lib/columns');
const columns = require('../src/data/columns');
const {createTemplates, render, escape} = require('./lib/templates');
const {createWriter, hash, compileStyles, collectResources} = require('./lib/artifacts');
const root = path.resolve(__dirname,'../..');
const scratch = path.join(root,'sandbox/tmp');
fs.mkdirSync(scratch,{recursive:true});
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
 const dir=fs.mkdtempSync(path.join(scratch,'owned-output-test-'));
 const manifest=path.join(dir,'manifest.json');
 const file=name=>path.join(dir,'frontend/preview/assets',name);
 let writer=createWriter(dir,manifest);
 writer.write(file('text.txt'),'first\r\nsecond\r');
 writer.write(file('binary.bin'),Buffer.from([0,13,10,255]));
 assert.equal(fs.readFileSync(file('text.txt'),'utf8'),'first\nsecond\n');
 assert.deepEqual(fs.readFileSync(file('binary.bin')),Buffer.from([0,13,10,255]));
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
 fs.symlinkSync(dir,path.join(dir,'frontend/preview/link'),'junction');
 assert.throws(()=>writer.write(path.join(dir,'frontend/preview/link/blocked.txt'),'blocked'),/Symlink/);
 fs.writeFileSync(manifest,JSON.stringify({version:1,outputs:{'frontend/preview/../../private.txt':'x'}}));
 assert.throws(()=>createWriter(dir,manifest),/Unowned/);
 fs.rmSync(dir,{recursive:true,force:true});
});
test('Resource edits invalidate their version without hand-editing templates',()=>{
 const dir=fs.mkdtempSync(path.join(scratch,'resource-version-test-'));
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
 fs.symlinkSync(dir,path.join(dir,'css/.linked-cache'),'junction');
 assert.throws(()=>collectResources(dir),/Symlink/);
 fs.rmSync(dir,{recursive:true,force:true});
});
test('Build bytes and versions ignore line endings and local noise; resource edits still invalidate',()=>{
 const dir=fs.mkdtempSync(path.join(scratch,'build-consistency-'));
 const file=name=>path.join(dir,name);
 const write=(name,body)=>{fs.mkdirSync(path.dirname(file(name)),{recursive:true});fs.writeFileSync(file(name),body);};
 try {
  for(const folder of ['src','scripts','licenses']) fs.cpSync(path.join(root,'frontend',folder),file('frontend/'+folder),{recursive:true});
  write('docs/assets/site-media/additional-media.json',fs.readFileSync(path.join(root,'docs/assets/site-media/additional-media.json')));
  const binary=Buffer.from([0,13,10,255]);
  write('frontend/src/assets/raw.bin',binary);
  write('frontend/src/assets/lines.svg','<svg>\n</svg>\n');
  write('frontend/src/assets/lines.txt','first\nsecond\n');
  const licenses=Object.fromEntries(fs.readdirSync(file('frontend/licenses')).map(name=>[name,hash(fs.readFileSync(file('frontend/licenses/'+name)))]));
  const build=()=>{
   execFileSync(process.execPath,[file('frontend/scripts/build-site.js')],{cwd:dir,stdio:'pipe'});
   const manifest=JSON.parse(fs.readFileSync(file('frontend/build-manifest.json'),'utf8'));
   for(const [name,fingerprint] of Object.entries(manifest.outputs)) {
    const body=fs.readFileSync(file(name));
    assert.equal(hash(body),fingerprint,name);
    if(/\.(?:html|css|js|json|txt|svg)$/.test(name)) assert(!body.includes(13),name+' must use LF');
   }
   const html=fs.readFileSync(file('frontend/preview/index.html'),'utf8');
   for(const [name,fingerprint] of Object.entries(manifest.resources)) {
    assert.equal(manifest.outputs['frontend/preview/'+name],fingerprint,name);
    if(/^(css|js)\//.test(name)) assert(html.includes(name+'?v='+fingerprint.slice(0,12)),name);
   }
   assert(!fs.readFileSync(file('frontend/preview/css/style.css'),'utf8').includes('@import'));
   return manifest;
  };
  const before=build();
  assert(Object.keys(before.inputs).every(name=>name==='docs/assets/site-media/additional-media.json' || name.startsWith('frontend/src/') || /^frontend\/scripts\/(?:build-site\.js$|(?:lib|adapters)\/.*\.[cm]?js$)/.test(name)));
  assert(before.inputs['docs/assets/site-media/additional-media.json']);
  assert(before.inputs['frontend/scripts/adapters/django.js']);
  for(const name of Object.keys(before.inputs).filter(name=>/\.(?:[cm]?js|css|html|json|svg|txt)$/.test(name))) {
   fs.writeFileSync(file(name),fs.readFileSync(file(name),'utf8').replace(/\r\n?/g,'\n').replace(/\n/g,'\r\n'));
  }
  assert(!createTemplates(file('frontend/src/templates')).read('document.html').includes('\r'));
  assert.deepEqual(build(),before,'CRLF checkout must reproduce all LF input/output/resource hashes');
  for(const name of [
   'src/.DS_Store','src/templates/Thumbs.db','src/css/style.css~','src/css/#style.css#',
   'src/css/.style.css.swp','src/css/style.css.swo','src/js/main.js.tmp','src/assets/desktop.ini',
   'src/data/__pycache__/site.pyc','src/js/.cache/cached.js','src/assets/node_modules/cached.js',
   'scripts/lib/.cache/cached.js','scripts/adapters/django.js.bak','scripts/lib/notes.md',
   'scripts/check-unused.cjs','scripts/fixtures/unused.js',
  ]) write('frontend/'+name,'ignored\r\n');
  fs.appendFileSync(file('frontend/scripts/check-presentation-contracts.cjs'),'\r\n// acceptance-only edit\r\n');
  assert.deepEqual(build(),before,'local noise and acceptance scripts must not change the manifest');
  fs.appendFileSync(file('frontend/src/css/components/foundation.css'),'\r\n/* resource edit */\r\n');
  const changed=build();
  assert.notEqual(changed.inputs['frontend/src/css/components/foundation.css'],before.inputs['frontend/src/css/components/foundation.css']);
  for(const name of Object.keys(before.resources)) {
   if(name==='css/style.css') assert.notEqual(changed.resources[name],before.resources[name],name);
   else assert.equal(changed.resources[name],before.resources[name],name);
  }
  assert.deepEqual(fs.readFileSync(file('frontend/preview/assets/raw.bin')),binary);
  for(const [name,fingerprint] of Object.entries(licenses)) assert.equal(hash(fs.readFileSync(file('frontend/licenses/'+name))),fingerprint,name);
 } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
console.log(`${checks.length} presentation contract checks passed`);
