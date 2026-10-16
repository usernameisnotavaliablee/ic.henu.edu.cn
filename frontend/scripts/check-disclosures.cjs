// Disclosure behavior: native fallback, animation reversal, focus, touch and reduced motion.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(process.env.IC_TEST_MODULES,'playwright'));
const url=process.argv[2] ? process.argv[2].replace(/\/$/,'')+'/contact.html' : pathToFileURL(path.resolve(__dirname,'../preview/contact.html')).href;
const output=path.resolve(process.env.IC_TEST_OUTPUT || 'sandbox/disclosure-checks');fs.mkdirSync(output,{recursive:true});
const report={checks:[],errors:[],scope:'local Edge simulation; no business writes'};
const check=(name,ok)=>{assert(ok,name);report.checks.push(name);};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const width of [1440,768,390,320]){
   const page=await browser.newPage({viewport:{width,height:1000},hasTouch:width<768,isMobile:width<768});
   page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url);
   const drawer=page.locator('.link-drawer').first(),summary=drawer.locator('summary'),panel=drawer.locator('.link-drawer-panel');
   check(`${width} two closed drawers and eleven preserved links`,await page.locator('.link-drawer').count()===2 && await page.locator('.link-drawer[open]').count()===0 && await page.locator('.friendly-links a').count()===11);
   check(`${width} closed links cannot receive focus`,await panel.evaluate(el=>el.inert));
   check(`${width} only the WeChat placeholder remains`,await page.locator('.contact-qr-codes .wechat-placeholder').count()===1 && await page.locator('.website-code').count()===0 && await page.locator('.footer-wechat .wechat-placeholder').count()===1);
   await page.evaluate(()=>document.fonts.ready);
   if(width===1440 || width===390)await page.screenshot({path:path.join(output,`contact-closed-${width}.png`),fullPage:true});
   await summary.scrollIntoViewIfNeeded();await page.waitForTimeout(1000);
   const samples=drawer.evaluate(el=>new Promise(resolve=>{const rows=[],start=performance.now();function frame(now){rows.push(el.getBoundingClientRect().height);if(now-start<650)requestAnimationFrame(frame);else resolve(rows);}requestAnimationFrame(frame);}));
   if(width<768)await summary.tap();else await summary.click();
   const heights=await samples;
   check(`${width} opens through intermediate heights`,heights.at(-1)>heights[0]+40 && heights.some(h=>h>heights[0]+4 && h<heights.at(-1)-4));
   check(`${width} expanded ARIA and focusable links`,await summary.getAttribute('aria-expanded')==='true' && !await panel.evaluate(el=>el.inert));
   await summary.focus();await page.keyboard.press('Tab');
   check(`${width} Tab enters the first link`,await panel.locator('a').first().evaluate(el=>el===document.activeElement));
   await page.keyboard.press('Escape');await page.waitForTimeout(400);
   check(`${width} Escape closes and returns focus`,await drawer.getAttribute('open')===null && await summary.evaluate(el=>el===document.activeElement));
   await summary.evaluate(el=>el.click());await page.waitForTimeout(75);
   await summary.evaluate(el=>el.click());await page.waitForTimeout(75);
   await summary.evaluate(el=>el.click());await page.waitForTimeout(450);
   check(`${width} rapid reversal ends open without a fixed height`,await summary.getAttribute('aria-expanded')==='true' && await drawer.evaluate(el=>el.open && el.style.height==='' && el.getAnimations().length===0));
   await page.locator('.link-drawer summary').nth(1).click();await page.waitForTimeout(400);
   check(`${width} both groups can be browsed together`,await page.locator('.link-drawer[open]').count()===2);
   check(`${width} no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('.friendly-links').screenshot({path:path.join(output,`links-open-${width}.png`)});
   await page.emulateMedia({reducedMotion:'reduce'});await summary.click();
   check(`${width} reduced motion closes immediately`,await drawer.evaluate(el=>!el.open && el.getAnimations().length===0));
   await summary.press('Enter');check(`${width} Enter opens in reduced motion`,await drawer.evaluate(el=>el.open));
   await page.close();
  }
  const native=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await native.goto(url);
  await native.locator('.link-drawer summary').first().click();
  check('native disclosure works without JavaScript',await native.locator('.link-drawer').first().getAttribute('open')!==null && await native.locator('.friendly-links a').first().isVisible());
  await native.close();check('no script errors',report.errors.length===0);report.passed=true;
 }catch(e){report.passed=false;report.error=e.stack;throw e;}
 finally{await browser.close();fs.writeFileSync(path.join(output,'disclosures.json'),JSON.stringify(report,null,2));}
 console.log(`Link drawers: ${report.checks.length} checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
