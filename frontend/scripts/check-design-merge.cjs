// Verify teammate b32d95a's footer, news overlay and 404 design after the structural refactor.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(path.join(process.env.IC_TEST_MODULES, 'playwright'));
const base = (process.argv[2] || 'http://127.0.0.1:8766').replace(/\/$/, '');
const output = path.resolve(process.env.IC_TEST_OUTPUT || 'sandbox/frontend-checks');
fs.mkdirSync(output,{recursive:true});
const report = {base,scope:'Edge simulated widths; teammate design preservation, not physical-device acceptance',checks:[],screenshots:[],errors:[]};
const check=(name,condition)=>{assert(condition,name);report.checks.push(name);console.log('PASS '+name);};
(async()=>{
 const browser=await chromium.launch({channel:process.env.IC_BROWSER_CHANNEL || 'msedge',headless:true});
 try {
  for (const width of [1440,768,390,320]) {
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
   page.on('pageerror',error=>report.errors.push(error.message));
   await page.goto(base+'/index.html');
   await page.locator('.main-nav.is-enhanced').waitFor({state:'attached'});
   await page.evaluate(()=>document.fonts.ready);
   const footer=page.locator('.site-footer');
   check(width+' retains compact footer without drawer or back-to-top',await page.locator('.footer-drawer,[data-back-top]').count()===0 && await footer.locator('.footer-row .footer-brand,.footer-row .footer-wechat,.footer-bottom-inner .footer-support').count()===3);
   check(width+' keeps original carousel operation buttons',await page.locator('[data-prev],[data-next],[data-news-prev],[data-news-next]').count()===4);
   check(width+' removes link-decoration arrows',await page.locator('a').evaluateAll(links=>links.every(link=>!/[←→]/.test(link.textContent))));
   await page.locator('.news-gallery').scrollIntoViewIfNeeded();
   const overlay=await page.locator('.news-gallery').evaluate(gallery=>{
    const picture=gallery.querySelector('.news-picture:not([hidden])');
    const controls=gallery.querySelector('.news-picture-controls');
    const title=picture.querySelector('h3');
    const imageRect=picture.getBoundingClientRect(),controlsRect=controls.getBoundingClientRect(),titleRect=title.getBoundingClientRect();
    return {inside:controlsRect.bottom<=imageRect.bottom+1 && controlsRect.top>=imageRect.top,clear:titleRect.bottom<=controlsRect.top+1,position:getComputedStyle(controls).position};
   });
   check(width+' picture controls overlay the photo without covering headline',overlay.inside && overlay.clear && overlay.position==='absolute');
   await page.locator('[data-news-next]').click();
   check(width+' picture next button still selects second item',await page.locator('[data-news-count]').innerText()==='02 / 04' && await page.locator('.news-picture:not([hidden])').count()===1);
   const newsShot=`merge-news-${width}.png`;
   await page.locator('.news-gallery').screenshot({path:path.join(output,newsShot)});
   report.screenshots.push(newsShot);
   await footer.scrollIntoViewIfNeeded();
   check(width+' QR remains horizontal in footer',await footer.locator('.wechat-panel').evaluate(el=>getComputedStyle(el).flexDirection)==='row');
   check(width+' studio and filing remain visible',await footer.locator('.footer-support').isVisible() && await footer.locator('.footer-filing').isVisible());
   const footerShot=`merge-footer-${width}.png`;
   await footer.screenshot({path:path.join(output,footerShot)});
   report.screenshots.push(footerShot);
   check(width+' home has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.goto(base+'/404.html');
   check(width+' 404 retains both teammate links and text wrapper',JSON.stringify(await page.locator('.error-text a').allTextContents())===JSON.stringify(['返回首页','网站导航']));
   const errorStyle=await page.locator('.error-text').evaluate(el=>{
    const paragraphs=[...el.querySelectorAll(':scope > p')];
    const title=getComputedStyle(paragraphs[0]),message=getComputedStyle(paragraphs[1]);
    return {centered:getComputedStyle(el).textAlign==='center',rows:paragraphs.length,titleSize:title.fontSize,messageSize:message.fontSize,titleColor:title.color,messageColor:message.color,linkGap:getComputedStyle(paragraphs[2].querySelector('a + a')).marginLeft};
   });
   check(width+' 404 preserves main text size, color and link spacing',errorStyle.centered && errorStyle.rows===3 && errorStyle.titleSize==='16px' && errorStyle.messageSize==='16px' && errorStyle.titleColor===errorStyle.messageColor && errorStyle.linkGap==='28px');
   check(width+' 404 has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const errorShot=`merge-404-${width}.png`;
   await page.screenshot({path:path.join(output,errorShot),fullPage:true});
   report.screenshots.push(errorShot);
   await page.close();
  }
  check('no page script errors',report.errors.length===0);
  report.passed=true;
 } catch(error) {report.passed=false;report.failure=error.message;throw error;}
 finally {
  fs.writeFileSync(path.join(output,'design-merge.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
