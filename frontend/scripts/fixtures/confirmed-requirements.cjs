// Isolated presentation fixtures. Never imported by the site data, catalog, seeds or deployment.
const fs=require('node:fs'),path=require('node:path');
const {createFaculty}=require('../lib/faculty');
const {createTemplates,escape}=require('../lib/templates');
const {createFacultyRenderer}=require('../lib/faculty-renderer');
const {qrPanel}=require('../lib/content');
const categories=require('../../src/data/faculty-categories.json');
const root=path.resolve(__dirname,'../..');
const templates=createTemplates(path.join(root,'src/templates'));
const render=(name,values)=>templates.render('components/'+name+'.html',values);
const media=values=>render('media',{loading:'lazy',status:templates.read('components/media-status.html'),...values});
const renderer=createFacultyRenderer(render,media);
const teachers=['a','b','c','d','e'].map((id,i)=>({id,slug:id,name:'测试条目 '+id.toUpperCase(),title:'职称样式',intro:'仅用于检查两三行摘要、换行与头像排版。这些名称与称号关系是隔离测试数据，不代表任何真实教师或学院信息。',image:'assets/teacher-cheng.jpg',href:'teacher-cheng-gang.html',order:i*10,published:true}));
const memberships=[
 {teacherId:'a',categoryId:'national-leading',year:2020},
 {teacherId:'a',categoryId:'national-young',year:2015},
 {teacherId:'b',categoryId:'national-young'},
 {teacherId:'c',categoryId:'provincial-professor',year:2021},
 {teacherId:'c',categoryId:'yellow-river-mingde',year:2022},
 {teacherId:'d',categoryId:'university-professor'},
 {teacherId:'d',categoryId:'hundred-talents',year:2023},
 {teacherId:'e',categoryId:'regular'},
];
function stateFixture(base) {
 const faculty=createFaculty({teachers,categories,memberships});
 const content='<div class="container" style="padding-block:48px"><h1>隔离样式测试</h1><p class="page-note">本页仅用于验证组件。测试名称和称号不表示真实归类；照片借用现有素材检验裁切，不进入正式页面或业务库。</p>'
  +faculty.sections('talent').map(s=>renderer.section(s)).join('')+faculty.sections('regular').map(s=>renderer.section(s)).join('')
  +'<h2>首页前三人，按最高级别去重</h2><div class="faculty-grid" id="test-home-faculty">'+faculty.home.map(t=>renderer.card(t)).join('')+'</div>'
  +'<h2>二维码有图状态</h2>'+qrPanel({enabled:true,image:'assets/henu-logo.png',name:'测试图片（不是正式二维码）',caption:'仅验证有图时布局'})+'</div>';
 return fs.readFileSync(path.join(root,'preview/faculty.html'),'utf8').replace('<head>','<head><base href="'+escape(base)+'">').replace(/<main id="main"[\s\S]*?<\/main>/,'<main id="main" tabindex="-1">'+content+'</main>');
}
function newsFixture() {
 const home=fs.readFileSync(path.join(root,'preview/index.html'),'utf8');
 const list=teachers.slice(0,4).map((t,i)=>`<li><a class="news-select${i?'':' is-active'}" data-news-select href="news.html"><div><h3>隔离测试新闻 ${i+1}</h3><span>2026-10-15</span></div><p>用于复核队友图片新闻布局，不发布为业务内容。</p></a></li>`).join('');
 const panels=teachers.slice(0,4).map((t,i)=>`<a class="news-picture" data-news-panel href="news.html"${i?' hidden':''}><img src="assets/campus-gate.jpg" alt="隔离测试配图" width="720" height="480"><div class="picture-caption"><span>测试图片新闻</span><h3>隔离测试新闻 ${i+1}</h3></div></a>`).join('');
 return home.replace(/<ul class="editorial-news-list">[\s\S]*?<\/ul>/,'<ul class="editorial-news-list">'+list+'</ul>').replace('<div class="news-pictures"></div>','<div class="news-pictures">'+panels+'</div>');
}
module.exports={teachers,memberships,categories,renderer,stateFixture,newsFixture};
