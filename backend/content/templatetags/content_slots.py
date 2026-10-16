from django import template
from ..editable import published

register = template.Library()


@register.inclusion_tag('site/generated/empty_state.html')
def empty_content(key=''):
    from ..editable import catalog
    copy = catalog()['emptyContent']
    return {'description': copy['descriptions'].get(key, ''), 'message': copy['message']}


@register.inclusion_tag('site/collection_preview.html', takes_context=True)
def collection_preview(context, key, anchor=None, position=None, about=False):
    from ..collections import get_collection, items
    rows = items(context['request'], key)
    collection = dict(get_collection(key) or {})
    if anchor is not None:
        collection['anchor'] = anchor
    if position is not None:
        collection['position'] = position
    return {'collection': collection, 'items': rows[:3], 'total': len(rows), 'about': about}


@register.simple_tag(takes_context=True)
def content_block(context, key):
    return published(context['request']).get(key)


@register.filter
def content_paragraphs(text):
    result = []
    for paragraph in (text or '').replace('\r\n', '\n').split('\n\n'):
        paragraph = paragraph.strip()
        if paragraph:
            result.append({'heading': paragraph.startswith('## '), 'text': paragraph[3:] if paragraph.startswith('## ') else paragraph})
    return result
