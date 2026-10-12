from django import template
from ..editable import published

register = template.Library()


@register.inclusion_tag('site/collection_preview.html', takes_context=True)
def collection_preview(context, key):
    from ..collections import get_collection, items
    rows = items(context['request'], key)
    return {'collection': get_collection(key), 'items': rows[:3], 'total': len(rows)}


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
