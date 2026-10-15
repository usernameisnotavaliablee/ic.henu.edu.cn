"""统一读取已发布快照；原有整块正文兼容为列表条目，不修改业务数据。"""
from .editable import catalog, published


def definitions():
    return catalog().get('collections', [])


def get_collection(key):
    return next((c for c in definitions() if key == c['key'] or key in c['legacyKeys']), None)


def items(request, key):
    collection = get_collection(key)
    if not collection:
        return []
    result = []
    for entry_key, entry in published(request).items():
        belongs = entry.get('collection') in collection['legacyKeys'] or entry_key in collection['legacyKeys']
        if belongs and entry.get('is_visible', True):
            row = dict(entry, key=entry_key)
            row['url'] = entry_key + '.html' if entry_key.startswith('entry-') else 'record-' + entry_key.replace('.', '-') + '.html'
            row['summary'] = entry.get('summary') or (entry.get('body') or '').replace('## ', '')[:160]
            result.append(row)
    # 相同排序值按日期倒序，标识作稳定次序；不读取未发布的字段。
    result.sort(key=lambda r: r['key'])
    result.sort(key=lambda r: r.get('date') or '', reverse=True)
    if collection.get('sort') != 'date-desc':
        result.sort(key=lambda r: r.get('sort_order', 100))
    return result


def resolve(request, slug):
    for c in definitions():
        row = next((r for r in items(request, c['key']) if r['url'] == slug + '.html'), None)
        if row:
            return c, row
    return None, None
