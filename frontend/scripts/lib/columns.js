// Pure presentation registry: no database, framework or network dependencies.
const source = require('../../src/data/columns');

function createRegistry({ nodes, navigation }) {
  const byId = new Map();
  const byUrl = new Map();
  const aliases = new Map();
  for (const node of nodes) {
    if (!node.id || byId.has(node.id)) throw new Error(`Duplicate/missing column id: ${node.id}`);
    if (!node.url || byUrl.has(node.url)) throw new Error(`Duplicate/missing column URL: ${node.url}`);
    byId.set(node.id, node);
    byUrl.set(node.url, node);
  }
  function ancestors(node) {
    const result = [];
    const seen = new Set([node.id]);
    while (node.parentId) {
      const parent = byId.get(node.parentId);
      if (!parent || seen.has(parent.id)) throw new Error(`Invalid parent/cycle at ${node.id}`);
      seen.add(parent.id);
      result.unshift(parent);
      node = parent;
    }
    return result;
  }
  for (const node of nodes) {
    ancestors(node);
    if (node.kind === 'alias' && (!byId.has(node.aliasOf) || byId.get(node.aliasOf).kind === 'alias')) throw new Error(`Invalid URL alias: ${node.id}`);
    if (node.kind === 'collection' && (!node.legacyKeys?.includes(node.storageKey) || !['cards','list'].includes(node.layout))) throw new Error(`Invalid collection contract: ${node.id}`);
    for (const key of node.legacyKeys || []) {
      if (aliases.has(key)) throw new Error(`Duplicate content alias: ${key}`);
      aliases.set(key, node);
    }
    for (const section of node.sections || []) {
      const target = byId.get(section.id);
      // Legacy overviews may reference a moved collection; its canonical parent remains unique.
      if (!target || (target.parentId !== node.id && !(section.reference === true && target.kind === 'collection'))) throw new Error(`Invalid section: ${section.id}`);
      if (!(target.legacyKeys || [target.storageKey]).includes(section.key)) throw new Error(`Unmapped section: ${section.key}`);
    }
  }
  function resolveHref(href) {
    const [file, anchor] = href.split('#');
    const legacy = anchor && aliases.get(file.replace(/\.html$/, '') + '.' + anchor);
    const node = byUrl.get(file);
    return legacy?.url || (node?.kind === 'alias' ? byId.get(node.aliasOf).url : href);
  }
  function links(items) {
    return items.map(({ id, label, children }) => {
      const node = byId.get(id);
      if (!node) throw new Error(`Unknown navigation column: ${id}`);
      return [node.url, label || node.navTitle || node.title, ...(children ? [links(children)] : [])];
    });
  }
  // main 的静态预览与动态新闻页有既有展示差异；只投影显示，不改变业务父级。
  function previewParents(node, mode) {
    const items = node.previewBreadcrumbs?.[mode];
    return items?.map(({id, label}) => {
      const parent = byId.get(id);
      if (!parent) throw new Error(`Unknown preview breadcrumb: ${id}`);
      return {href: parent.url, label: label || parent.navTitle || parent.title};
    });
  }
  function route(nodeOrUrl) {
    const node = typeof nodeOrUrl === 'string' ? byUrl.get(resolveHref(nodeOrUrl)) : nodeOrUrl;
    if (!node) return null;
    const chain = ancestors(node);
    return { id: node.id, kind: node.kind, title: node.title, english: node.english || '', active: (chain[0] || node).url,
      parents: chain.map(parent => ({ href: parent.url, label: parent.navTitle || parent.title })),
      ...(Object.hasOwn(node, 'facultyFilter') ? {facultyFilter: node.facultyFilter} : {}),
      ...(node.previewBreadcrumbs?.page ? {previewParents: previewParents(node, 'page')} : {}) };
  }
  function detail(parentId, title) {
    const parent = byId.get(parentId);
    if (!parent) throw new Error(`Unknown detail parent: ${parentId}`);
    const info = route(parent);
    const {previewParents: pagePreviewParents, ...detailInfo} = info;
    return { ...detailInfo, id: null, kind: 'detail', parentId, title, parents: [...info.parents, { href: parent.url, label: parent.title }],
      ...(parent.previewBreadcrumbs?.detail ? {previewParents: previewParents(parent, 'detail')} : {}) };
  }
  const nav = links(navigation);
  const pages = Object.fromEntries(nodes.filter(n => n.kind === 'overview').map(n => [n.url, {
    title: n.title, english: n.english, ...(n.parentId ? {active: route(n).active} : {}),
    sections: n.sections.map(s => s.label), sectionDefinitions: n.sections,
  }]));
  const collections = nodes.filter(n => n.kind === 'collection').map(n => ({
    id: n.id, key: n.storageKey, page: byId.get(n.parentId).url, title: n.title, layout: n.layout,
    slug: n.url.replace(/\.html$/, ''), url: n.url, anchor: n.anchor, position: n.order,
    watermark: n.watermark, sort: n.sort || 'manual', service: !!n.service, legacyKeys: [...n.legacyKeys], active: route(n).active, parents: route(n).parents,
    legacyUrls: nodes.filter(a => a.aliasOf === n.id).map(a => a.url).sort(),
    listed: n.listed !== false,
  }));
  return { nodes, byId, byUrl, route, detail, resolveHref, collections,
    siteConfiguration: { navigation: nav.map(([url,label]) => [url,label]),
      subNavigation: Object.fromEntries(nav.filter(n => n[2]).map(n => [n[0],n[2]])), pages } };
}
module.exports = { ...createRegistry(source), createRegistry };
