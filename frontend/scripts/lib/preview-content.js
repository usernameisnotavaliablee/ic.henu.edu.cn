// Only the static review adapter uses demos. Published/platform data never falls back here.
const {collectionRecords,emptyContent} = require('./content');
const fixtures = require('../../src/data/preview-content');
const publishedItems = items => items.filter(item=>item.published===true && item.visible!==false && !item.layoutOnly)
  .sort((a,b)=>(b.date||'').localeCompare(a.date||'') || a.slug.localeCompare(b.slug));
function articleItems(items, kind) {
  return publishedItems(items.some(item=>!item.layoutOnly) ? items : fixtures[kind] || []);
}
function collectionItems(collection, source) {
  if (collection.legacyKeys.some(key=>(source[key] || []).length)) return collectionRecords(collection,source);
  return collectionRecords(collection,{[collection.key]:fixtures.collections[collection.id] || []});
}
function demoNote(items) { return items.some(item=>item.previewOnly) ? emptyContent() : ''; }
module.exports={articleItems,collectionItems,demoNote};
