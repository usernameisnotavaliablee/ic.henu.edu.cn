"""栏目插槽与已发布快照；目录由前端构建生成，不向业务库灌入内容。"""
import json
from functools import lru_cache
from django.conf import settings


@lru_cache(maxsize=1)
def catalog():
    return json.loads((settings.BASE_DIR / 'content-catalog.json').read_text(encoding='utf-8'))


def asset_choices():
    root = settings.PREVIEW_ROOT / 'assets'
    return [('', '暂不设置')] + [(p.name, p.name) for p in sorted(root.iterdir())
        if p.is_file() and p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}]


def published(request):
    if not hasattr(request, '_editable_content'):
        from .models import ContentEntry
        request._editable_content = {row.key: row.published for row in ContentEntry.objects.exclude(published={})}
    return request._editable_content


def site_context(request):
    info = dict(catalog()['site'])
    entry = published(request).get('site', {})
    if entry.get('is_visible', True):
        info.update({k: v for k, v in entry.items() if v not in ('', None)})
    info['name'] = '河南大学' + info['college']
    return {'site_info': info}


def teachers(request):
    rows = {row['key']: dict(row) for row in catalog()['teachers']}
    for key, value in published(request).items():
        if key.startswith('teacher-'):
            rows[key] = dict(value, key=key)
    return sorted((row for row in rows.values() if row.get('is_visible', True)), key=lambda row: (row.get('sort_order', 100), row['key']))


def faculty_context(request, group=''):
    rows = teachers(request)
    categories = sorted((c for c in catalog()['facultyCategories'] if c['group'] == group and c.get('enabled', True)), key=lambda c: (c['priority'], c['id'])) if group else [{'id': 'faculty-list', 'label': '教师名录', 'display': 'home'}]
    sections = []
    for category in categories:
        members = []
        for teacher in rows:
            awards = [a for a in teacher_awards(teacher) if a['categoryId'] == category['id']]
            if not group or awards:
                members.append(dict(teacher, award_year=awards[0].get('year') if awards else None))
        if members or category.get('showWhenEmpty') is True:
            sections.append(dict(category, teachers=members))
    return {
        'faculty_sections': sections,
        'faculty_empty_key': 'faculty.' + group,
        'faculty_tabs': [{'href': '/' + slug + '.html', 'label': route['title'] if route['facultyFilter'] else '教师名录'}
                         for slug, route in catalog()['routes'].items() if route.get('kind') == 'page' and 'facultyFilter' in route],
    }


def teacher_awards(row):
    """Preview compatibility only: existing admin still edits a single category, not multi-title relations."""
    if row.get('teacher_category'):
        return [{'categoryId': row['teacher_category'], 'year': None}]
    return row.get('awards', [])


def home_teachers(request):
    priorities = {c['id']: c['priority'] for c in catalog()['facultyCategories'] if c.get('enabled', True)}
    rows = teachers(request)  # already deduplicated by stable key and sorted manually
    return sorted(rows, key=lambda row: min((priorities.get(a['categoryId'], 10**9) for a in teacher_awards(row)), default=10**9))[:3]
