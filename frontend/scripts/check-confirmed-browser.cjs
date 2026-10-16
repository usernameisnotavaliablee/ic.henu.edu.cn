const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(process.env.IC_TEST_MODULES,'playwright'));
const {stateFixture}=require('./fixtures/confirmed-requirements.cjs');
const base=process.argv[2].replace(/\/$/,'');
const output=path.resolve(process.env.IC_TEST_OUTPUT || 'sandbox/frontend-checks');
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'faculty-states.html'),stateFixture(pathToFileURL(path.resolve(__dirname,'../preview')+path.sep).href));
const report={scope:'Edge simulated viewports and isolated renderer fixtures; no business data or Boda publishing',checks:[],errors:[]};
const check=(name,ok)=>{assert(ok,name);report.checks.push(name);};
(async()=>{
 const browser=await chromium.launch({channel:process.env.IC_BROWSER_CHANNEL || 'msedge',headless:true});
 try {
  for(const width of [1440,768,390,320]) {
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.route('**/faculty-states.html',r=>r.fulfill({contentType:'text/html',body:stateFixture(base+'/')}));
   await page.goto(base+'/faculty-states.html');
   check(`${width} six nonempty talent blocks and ordinary group`,await page.locator('.faculty-section').count()===7);
   check(`${width} ordinary teacher has no image`,await page.locator('#regular img').count()===0);
   const geometry=await page.locator('#national-leading .media-frame,#provincial-professor .media-frame').evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,radius:getComputedStyle(e).borderRadius})));
   check(`${width} portrait 3:4; compact circular`,Math.abs(geometry[0].w/geometry[0].h-.75)<.01 && geometry[1].w===geometry[1].h && geometry[1].radius==='50%');
   check(`${width} per-title years rendered independently`,(await page.locator('#national-leading h3').textContent()).includes('2020') && (await page.locator('#national-young h3').first().textContent()).includes('2015'));
   check(`${width} home selection unique and capped`,await page.locator('#test-home-faculty .faculty-card').count()===3);
   check(`${width} populated layout no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(output,`faculty-states-${width}.png`),fullPage:true});
   await page.goto(base+'/index.html');
   check(`${width} no quicklinks or vacancies`,await page.locator('.quick-links,.faculty-vacancies').count()===0);
   check(`${width} four clearly marked demo news with trailing preparation note`,await page.locator('.news-select').count()===4 && (await page.locator('.news-select h3').allTextContents()).every(t=>t.startsWith('【演示】')) && (await page.locator('#home-news .collection-empty-state').textContent()).includes('相关内容正在整理中'));
   check(`${width} three demo notices with dates`,await page.locator('.editorial-notices li').count()===3 && (await page.locator('.notice-type').allTextContents()).every(t=>/2026-10-\d{2}/.test(t)));
   check(`${width} footer has one honest QR placeholder`,await page.locator('.footer-wechat .wechat-placeholder').count()===1 && await page.locator('.footer-wechat .wechat-code').count()===0);
   check(`${width} first three real teachers in confirmed order`,JSON.stringify(await page.locator('.faculty-card h3').allTextContents())===JSON.stringify(['程纲','郑海务','张锦龙']));
   for(let i=0;i<3;i++) {
    const figure=page.locator('.visual-topics figure').nth(i);await figure.scrollIntoViewIfNeeded();
    const hits=await figure.evaluate(el=>{
     const img=el.querySelector('img').getBoundingClientRect(),text=el.querySelector('figcaption').getBoundingClientRect(),source=el.querySelector('.topic-source').getBoundingClientRect();
     const at=(x,y)=>document.elementFromPoint(x,y)?.closest('a');
     return {image:!!at(img.left+img.width/2,img.top+img.height/2),blank:at(text.right-5,text.bottom-5)?.className,source:at(source.left+source.width/2,source.top+source.height/2)?.className};
    });
    check(`${width} topic ${i} image inert; full text region links separately from source`,!hits.image && hits.blank==='topic-destination' && hits.source==='topic-source');
    await figure.locator('.topic-destination').focus();
    check(`${width} topic ${i} keyboard focus`,await figure.locator('.topic-destination').evaluate(e=>document.activeElement===e));
   }
   await page.locator('.topic-destination').first().press('Enter');await page.waitForURL('**/science-innovation-section-1.html');
   check(`${width} text destination navigates`,await page.locator('.page-banner h1').textContent()==='研究方向');
   await page.goto(base+'/faculty-talents.html');
   check(`${width} empty national groups stay; other empty groups hidden`,JSON.stringify(await page.locator('.faculty-section').evaluateAll(es=>es.map(e=>e.id)))===JSON.stringify(['national-leading','national-young']) && await page.locator('.collection-empty-state').count()===2 && await page.locator('.faculty-person').count()===0);
   if(width===1440 || width===390)await page.screenshot({path:path.join(output,`faculty-empty-${width}.png`),fullPage:true});
   await page.goto(base+'/contact.html');
   check(`${width} two link groups; only WeChat has a QR placeholder`,await page.locator('.friendly-links section').count()===2 && await page.locator('.friendly-links a').count()===11 && await page.locator('.contact-qr-codes .wechat-placeholder').count()===1 && await page.locator('.contact-qr-codes img, .contact-qr-codes .website-code').count()===0);
   for(const file of ['news.html','notices.html','media-section-1.html']) {
    await page.goto(base+'/'+file);
    const links=page.locator('.article-list a,.collection-item');
    check(`${width} ${file} demos before preparation note`,await links.count()>=3 && (await page.locator('main').textContent()).includes('相关内容正在整理中'));
    await links.first().click();
    await page.waitForLoadState('load');
    check(`${width} ${file} full demo detail with date and body`,(await page.locator('.page-banner h1').textContent()).startsWith('【演示】') && (await page.locator('.article').textContent()).includes('2026-10-15') && (await page.locator('.article').textContent()).includes('虚构的版式演示'));
    check(`${width} ${file} detail no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   }
   await page.close();
  }
  check('no script errors',report.errors.length===0);report.passed=true;
 } catch(e){report.passed=false;report.error=e.message;throw e;}
 finally{await browser.close();fs.writeFileSync(path.join(output,'confirmed-browser.json'),JSON.stringify(report,null,2));}
 console.log(`Confirmed browser: ${report.checks.length} checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
