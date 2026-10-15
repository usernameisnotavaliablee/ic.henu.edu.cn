// Keep the marked handoff tables derived from the same registry as menus and breadcrumbs.
const fs=require('node:fs'),path=require('node:path');
const registry=require('./lib/columns');
const file=path.resolve(__dirname,'../../docs/接口文档.md');
const before=fs.readFileSync(file,'utf8');let after=before;
const tables={
 'overview-map': ['| pageId | 页面 | HTML路径 | sections的id（顺序） |','|---|---|---|---|',
  ...registry.nodes.filter(n=>n.kind==='overview').map(n=>`| ${n.id} | ${n.title} | /${n.url} | ${[...new Set(n.sections.map(s=>s.id))].join('、')} |`)],
 'collection-map': ['| collectionId | 栏目 | 父pageId | 兼容存储key | HTML路径 | 版式 |','|---|---|---|---|---|---|',
  ...registry.collections.map(c=>`| ${c.id} | ${c.title} | ${registry.byId.get(c.id).parentId} | ${c.legacyKeys.join('、')} | /${c.url} | ${c.layout} |`)],
};
for(const [name,lines] of Object.entries(tables)) {
 const start=`<!-- ${name}:start -->`,end=`<!-- ${name}:end -->`;
 const a=after.indexOf(start),b=after.indexOf(end,a);
 if(a<0||b<0)throw Error(`Missing contract map markers: ${name}`);
 after=after.slice(0,a)+start+'\n'+lines.join('\n')+'\n'+after.slice(b);
}
if(process.argv.includes('--check')) {if(after.replace(/\r\n/g,'\n')!==before.replace(/\r\n/g,'\n'))throw Error('Column handoff maps are stale: run update-contract-map.cjs');}
else if(after!==before)fs.writeFileSync(file,after);
console.log('Column handoff maps match the presentation registry');
