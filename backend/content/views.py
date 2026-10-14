import mimetypes
from django.conf import settings
from django.core.paginator import Paginator
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_safe
from .models import Publication
from .editable import teachers, catalog
from .presentation import page_context

# Only explicit fixed routes are public static pages; detail/publication URLs remain gated below.
STATIC_PAGES = frozenset(slug for slug, route in catalog()['routes'].items()
                         if route.get('kind') in {'overview', 'page'})

@require_safe
def home(request):
    return render(request, 'site/generated/home.html', {
        'news': Publication.objects.filter(category='news')[:4],
        'notices': Publication.objects.filter(category='notice')[:3],
        'teachers': teachers(request),
    })

@require_safe
def listing(request, category):
    paginator = Paginator(Publication.objects.filter(category=category), 10)
    page = paginator.get_page(request.GET.get('page'))
    return render(request, 'site/list.html', {
        **page_context('news' if category == 'news' else 'notices'),
        'page': page, 'category': category,
        'page_numbers': paginator.get_elided_page_range(page.number, on_each_side=1, on_ends=1),
    })

@require_safe
def detail_or_page(request, slug):
    from .collections import definitions, items, resolve, get_collection
    collection = next((c for c in definitions() if c['slug'] == slug), None)
    if collection:
        page = Paginator(items(request, collection['key']), 9 if collection['layout'] == 'cards' else 10).get_page(request.GET.get('page'))
        return render(request, 'site/collection.html', {
            'collection': collection, 'page': page, 'page_heading': collection['title'],
            'active_page': collection['active'], 'breadcrumbs': collection['parents'],
            'siblings': [c for c in definitions() if c['page'] == collection['page']],
        })
    if slug.startswith(('entry-', 'record-')):
        collection, entry = resolve(request, slug)
        if not entry:
            raise Http404
        related = [r for r in items(request, 'research-groups.section-1') if r.get('direction') == entry['key']]
        return render(request, 'site/collection_detail.html', {
            'entry': entry, 'collection': collection, 'related': related, 'group_collection': get_collection('research-groups.section-1'),
            'page_heading': entry['title'], 'active_page': collection['active'],
            'breadcrumbs': collection['parents'] + [{'href': collection['url'], 'label': collection['title']}],
        })
    if slug == 'faculty':
        return render(request, 'site/faculty.html', {**page_context('faculty'), 'teachers': teachers(request)})
    if slug.startswith('teacher-'):
        teacher = next((t for t in teachers(request) if t['key'] == slug), None)
        if teacher is None:
            raise Http404
        return render(request, 'site/teacher.html', {'teacher': teacher, **page_context(slug, parent_slug='faculty', title=teacher['title'])})
    if slug == 'contact':
        return render(request, 'site/contact.html', page_context('contact'))
    if slug in STATIC_PAGES:
        return render(request, 'site/generated/' + slug + '.html')
    article = get_object_or_404(Publication, slug=slug)
    parent = 'notices' if article.category == 'notice' else 'news'
    return render(request, 'site/detail.html', {'article': article, **page_context(slug, parent_slug=parent, title=article.title, english='INFORMATION')})

@require_safe
def resource(request, directory, filename):
    allowed = {'assets': {'.jpg', '.jpeg', '.png', '.svg', '.webp', '.woff2', '.ttf'}, 'css': {'.css'}, 'js': {'.js'}}
    file = settings.PREVIEW_ROOT / directory / filename
    if file.suffix.lower() not in allowed[directory] or not file.is_file():
        raise Http404
    font_types = {'.woff2': 'font/woff2', '.ttf': 'font/ttf'}
    response = FileResponse(file.open('rb'), content_type=font_types.get(file.suffix.lower()) or mimetypes.guess_type(filename)[0] or 'application/octet-stream')
    response['Cache-Control'] = 'public, max-age=300'
    return response

@require_safe
def robots(request):
    return HttpResponse('User-agent: *\nDisallow: /\n', content_type='text/plain')

@require_safe
def health(request):
    Publication.objects.exists()
    return JsonResponse({'status': 'ok', 'mode': 'public-readonly' if settings.PUBLIC_ONLY else 'local-preview'})

def not_found(request, exception=None):
    return render(request, 'site/error.html', {'page_heading': '页面未找到', 'page_english': '404', 'error_heading': '页面走丢了', 'message': '页面不存在，或内容尚未批准预览。'}, status=404)

def csrf_failure(request, reason=''):
    return render(request, 'site/error.html', {'page_heading': '请求未通过验证', 'page_english': '403', 'error_heading': '请求未通过验证', 'message': '请重新打开页面后再操作，本次没有保存。'}, status=403)
