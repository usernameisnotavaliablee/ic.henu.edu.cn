// Inventory every generated page, then exercise each shared interaction family in Edge.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.IC_TEST_MODULES,'playwright'));
const {stateFixture}=require('./fixtures/confirmed-requirements.cjs');
const base=process.argv[2].replace(/\/$/,''),output=path.resolve(process.env.IC_TEST_OUTPUT || 'sandbox/frontend-checks');
const preview=path.resolve(__dirname,'../preview');
const report={scope:'all static pages inventoried; shared components tested in Edge desktop/touch simulation, not physical devices',pages:[],families:{},checks:[],errors:[]};
const check=(name,ok)=>{assert(ok,name);report.checks.push(name);};
const families=['.main-nav a','.brand','.site-footer a','.news-select','.news-picture','.editorial-notices a','.feature-row','.faculty-card','.faculty-person','.topic-destination','.topic-source','.editorial-heading > a','.article-list a','.collection-item','.faculty-tabs a','.friendly-links a','.list-tabs a','.breadcrumb a','.collection-sidebar a','.overview-related a','.research-links a','.site-map-grid a','.back-link','.profile-source a','.profile-section a','.credit-item a','.skip-link'];
const framedLinks='.editorial-heading > a,.list-tabs a,.faculty-tabs a,.friendly-links a,.management-entry a';
(async()=>{
 const browser=await chromium.launch({channel:process.env.IC_BROWSER_CHANNEL || 'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  for(const file of fs.readdirSync(preview).filter(f=>f.endsWith('.html')).sort()) {
   await page.goto(base+'/'+file,{waitUntil:'domcontentloaded'});
   await page.waitForLoadState('load');
   const linePolicy=await page.locator(framedLinks).evaluateAll(es=>({count:es.length,invalid:es.filter(e=>getComputedStyle(e).getPropertyValue('--interaction-underline').trim()!=='none').map(e=>e.textContent.trim())}));
   assert.deepEqual(linePolicy.invalid,[],`${file}: framed link policy`);
   (report.framedLinks ||= []).push({file,count:linePolicy.count});
   const inventory=await page.locator('a[href]').evaluateAll((links,groups)=>{
    const result={};for(const a of links){const type=groups.find(g=>a.matches(g)) || 'plain-text-link';result[type]=(result[type]||0)+1;}return result;
   },families);
   report.pages.push({file,links:inventory});
   for(const [key,count] of Object.entries(inventory))report.families[key]=(report.families[key]||0)+count;
  }
  check('every generated HTML inventoried',report.pages.length===fs.readdirSync(preview).filter(f=>f.endsWith('.html')).length);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.route('**/faculty-states.html',r=>r.fulfill({contentType:'text/html',body:stateFixture(base+'/')}));
  const cases=[
   ['index.html','.news-select','h3',1.055],['index.html','.news-picture:not([hidden])','img',1.06],
   ['index.html','.editorial-notices a','h3',1.055],['index.html','.feature-row','h3',1.055],
   ['index.html','.faculty-card',':scope > div',1.035],['index.html','.topic-destination','.topic-label',1.055],
   ['index.html','.topic-source',null,1.04],['index.html','.editorial-heading > a',null,1.04],
   ['index.html','.research-links a',null,1.04],['news.html','.article-list a','h2',1.055],
   ['news.html','.list-tabs a',null,1.04],['media-section-1.html','.collection-item','h3',1.055],
   ['faculty.html','.faculty-tabs a',null,1.04],['faculty.html','.faculty-card',':scope > div',1.035],['contact.html','.friendly-links a',null,1.04],
   ['student-regulations.html','.breadcrumb a',null,1.04],['student-regulations.html','.collection-sidebar a',null,1.04],
   ['about.html','.overview-related a',null,1.04],['site-map.html','.site-map-grid a',null,1.04],
   ['404.html','.back-link',null,1.04],
   ['faculty-states.html','.faculty-person--portrait',':scope > div',1.035],
   ['faculty-states.html','.faculty-person--compact',':scope > div',1.035],
   ['faculty-states.html','.faculty-person--names',':scope > div',1.035],
  ];
  let current='';
  for(const [file,selector,child,scale] of cases){
   if(current!==file){await page.goto(base+'/'+file);current=file;}
   const link=page.locator(selector).first(),target=child?link.locator(child).first():link;
   await link.evaluate(el=>{const drawer=el.closest('details');if(drawer && !drawer.open)drawer.querySelector('summary').click();});
   if(selector==='.friendly-links a')await page.waitForTimeout(400);
   await page.mouse.move(0,0);await link.scrollIntoViewIfNeeded();await page.waitForTimeout(350);
   // Home section entrance animation is independent of the link animation.
   await link.evaluate(e=>{const section=e.closest('.home-section');if(section){section.classList.add('has-entered');section.classList.remove('is-reveal-ready');}});
   await page.waitForTimeout(1100); // Let the separate 900 ms header contraction settle first.
   const documentBox=el=>{const r=el.getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};};
   const cardBefore=selector==='.faculty-card' ? await link.evaluate(documentBox) : null;
   const photoBefore=cardBefore ? await link.locator('.media-frame').evaluate(documentBox) : null;
   const trace=target.evaluate(el=>new Promise(resolve=>{
    const rows=[],start=performance.now();function frame(now){const s=getComputedStyle(el);rows.push({scale:s.transform==='none'?1:new DOMMatrix(s.transform).a,color:s.color});if(now-start<700)requestAnimationFrame(frame);else resolve(rows);}requestAnimationFrame(frame);
   }));
   await link.hover();const frames=await trace;
   (report.traces ||= []).push({file,selector,hovered:await link.evaluate(e=>e.matches(':hover')),frames});
   check(`${file} ${selector} reaches original scale`,Math.abs(frames.at(-1).scale-scale)<.002);
   check(`${file} ${selector} animates through intermediate sizes`,frames.filter(f=>f.scale>1.001 && f.scale<scale-.001).length>=2);
   check(`${file} ${selector} no page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const usesOriginalLine=await link.evaluate((el,s)=>el.matches(s),framedLinks);
   if(usesOriginalLine)check(`${file} ${selector} hover adds no second underline`,await link.evaluate(e=>getComputedStyle(e).textDecorationLine==='none'));
   if(cardBefore) {
    const after=await link.evaluate(documentBox);
    check(`${file} teacher card remains stationary ${JSON.stringify({before:cardBefore,after})}`,['x','y','width','height'].every(k=>Math.abs(cardBefore[k]-after[k])<.5) && await link.evaluate(e=>getComputedStyle(e).transform==='none'));
    const photoAfter=await link.locator('.media-frame').evaluate(documentBox);
    check(`${file} teacher photo frame grows with photo`,['width','height'].every(k=>Math.abs(photoAfter[k]/photoBefore[k]-1.04)<.002));
    check(`${file} teacher photo is not scaled twice`,await link.locator('img').evaluate(e=>getComputedStyle(e).transform==='none' && Math.abs(new DOMMatrix(getComputedStyle(e.closest('.media-frame')).transform).a-1.04)<.002));
    check(`${file} all teacher copy shares one transform`,await link.evaluate(e=>[...e.querySelectorAll('h3,.teacher-title,.teacher-intro,.teacher-link')].every(n=>n.parentElement===e.querySelector(':scope > div') && getComputedStyle(n).transform==='none')));
    check(`${file} teacher border expands with copy`,await link.evaluate(e=>Math.abs(new DOMMatrix(getComputedStyle(e,'::before').transform).a-1.035)<.002));
    await page.locator('.faculty-grid,.faculty-people--home').first().screenshot({path:path.join(output,`${file.replace('.html','')}-teachers-hover.png`)});
   }
   await page.mouse.move(0,0);await page.waitForTimeout(650);await link.focus();
   check(`${file} ${selector} keyboard focus visible`,await link.evaluate(el=>el.matches(':focus-visible') && getComputedStyle(el).outlineStyle!=='none'));
   if(usesOriginalLine)check(`${file} ${selector} keyboard adds no second underline`,await link.evaluate(e=>getComputedStyle(e).textDecorationLine==='none'));
   await page.evaluate(()=>document.activeElement.blur());
  }
  await page.goto(base+'/index.html');
  const topic=page.locator('.topic-destination').first();await topic.scrollIntoViewIfNeeded();await topic.hover();await page.waitForTimeout(350);
  const bounds=await topic.evaluate(el=>{const area=el.closest('figcaption').getBoundingClientRect();const hit=document.elementFromPoint(area.right-5,area.bottom-5)?.closest('a');return hit===el;});
  check('topic full text hit region remains stable while label zooms',bounds);
  check('nonclickable research image stays unscaled',await page.locator('.visual-topics img').first().evaluate(el=>getComputedStyle(el).transform==='none'));
  await page.screenshot({path:path.join(output,'hover-topics-desktop.png'),fullPage:false});
  await page.locator('.footer-support').hover();
  check('footer retains main color/underline without whole-footer zoom',await page.locator('.footer-support').evaluate(el=>getComputedStyle(el).transform==='none' && getComputedStyle(el).color==='rgb(255, 255, 255)'));
  await page.locator('.main-nav > ul > li a').first().hover();
  check('navigation retains main stationary feedback',await page.locator('.main-nav > ul > li a').first().evaluate(el=>getComputedStyle(el).transform==='none'));
  await page.emulateMedia({reducedMotion:'reduce'});await topic.scrollIntoViewIfNeeded();await topic.hover();
  check('reduced motion has feedback without zoom',await topic.locator('.topic-label').evaluate(el=>getComputedStyle(el).transform==='none' && getComputedStyle(el).textDecorationLine.includes('underline')));
  await page.close();
  const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
  await touch.goto(base+'/index.html');await touch.evaluate(()=>document.addEventListener('click',e=>e.preventDefault()));
  check('touch device does not advertise hover',await touch.evaluate(()=>!matchMedia('(hover: hover)').matches));
  const mobileTopic=touch.locator('.topic-destination').first();await mobileTopic.scrollIntoViewIfNeeded();await mobileTopic.tap();
  check('touch tap does not leave title enlarged',await mobileTopic.locator('.topic-label').evaluate(el=>getComputedStyle(el).transform==='none'));
  check('touch page has no overflow',await touch.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await touch.close();check('no page errors',report.errors.length===0);report.passed=true;
 }catch(e){report.passed=false;report.error=e.stack;throw e;}
 finally{await browser.close();fs.writeFileSync(path.join(output,'hover-audit.json'),JSON.stringify(report,null,2));}
 console.log(`Hover audit: ${report.pages.length} pages, ${Object.keys(report.families).length} link families, ${report.checks.length} checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
