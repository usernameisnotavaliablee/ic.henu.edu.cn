// 会议新增栏目、分类与移动导航；静态浏览器验证，业务发布另由 Django 测试覆盖。
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.IC_TEST_MODULES,'playwright'));
const base=(process.argv[2] || 'http://127.0.0.1:8766').replace(/\/$/,'');
const out=path.resolve(process.env.IC_TEST_OUTPUT || 'sandbox/frontend-checks');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:process.env.IC_BROWSER_CHANNEL || 'msedge',headless:true});
 try {
  const errors=[],checks=[];const check=(name,valid)=>{assert(valid,name);checks.push(name);};
  for(const width of [1440,768,390,320]){
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
   page.on('pageerror',error=>errors.push(error.message));
   for(const file of ['about','management','faculty','faculty-talents','faculty-teachers','engineering-accreditation','student-regulations','instruments','contact']){
    await page.goto(`${base}/${file}.html`);await page.evaluate(()=>document.fonts.ready);
    check(`${file} ${width} no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    check(`${file} ${width} title visible`,await page.locator('.page-banner h1').isVisible());
    check(`${file} ${width} no duplicate ids`,await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length;}));
    if(file==='faculty')check(`${width} teacher order`,JSON.stringify(await page.locator('.faculty-card').evaluateAll(es=>es.map(e=>e.getAttribute('href'))))===JSON.stringify(['teacher-cheng-gang.html','teacher-zhang-jinlong.html','teacher-zheng-haiwu.html']));
    if(file==='faculty-talents')check(`${width} unconfirmed talent groups`,await page.locator('.faculty-section').count()===4 && await page.locator('.faculty-card').count()===0);
    if(file==='contact')check(`${width} both QR slots`,await page.locator('.contact-qr-codes .wechat-panel').count()===2);
    if([1440,390].includes(width) && ['management','faculty','faculty-talents','contact'].includes(file)){
     await page.screenshot({path:path.join(out,`${file}-${width}.png`),fullPage:true});
    }
   }
   await page.goto(base+'/index.html');
   check(`${width} header YaHei`,await page.locator('.brand-motto').evaluate(e=>getComputedStyle(e).fontFamily.startsWith('"Microsoft YaHei"')));
   if(width<960){
    await page.locator('.nav-toggle').click();
    const about=page.locator('#main-nav > ul > li').filter({has:page.locator(':scope > .nav-item-heading > a[href="about.html"]')});
    await about.locator(':scope > .nav-item-heading > button').click();
    const manage=about.locator('.nav-item').filter({has:page.locator(':scope > .nav-item-heading > a[href="management.html"]')});
    await manage.locator(':scope > .nav-item-heading > button').click();
    const link=manage.locator('a[href="management-committee.html"]');
    await link.click();
    await page.waitForURL('**/management-committee.html');
    check(`${width} mobile third-level route`,await page.locator('.page-banner h1').textContent()==='学术委员会');
   }
   await page.close();
  }
  check('no script errors',errors.length===0);
  fs.writeFileSync(path.join(out,'meeting-browser.json'),JSON.stringify({passed:true,count:checks.length,checks,errors,scope:'Edge simulated widths, static meeting pages; no physical-device or production checks'},null,2));

  console.log(`Meeting browser: ${checks.length} checks passed`);
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
