"""Verify the Django display adapter in a new isolated empty database; never seed or read an existing database."""
import json
import hashlib
import os
from html.parser import HTMLParser
from pathlib import Path
import secrets
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
OUTPUT = Path(os.environ.get('IC_TEST_OUTPUT', ROOT / 'sandbox/django-presentation-checks')).resolve()
OUTPUT.mkdir(parents=True, exist_ok=True)
DATA = Path(tempfile.mkdtemp(prefix='presentation-empty-', dir=ROOT / 'sandbox'))
(DATA / 'static').mkdir()
os.environ.update(IC_DATA_DIR=str(DATA), IC_SECRET_KEY=secrets.token_urlsafe(64),
                  IC_ALLOWED_HOSTS='testserver,localhost,127.0.0.1', IC_HTTPS='0', IC_PUBLIC_ONLY='0',
                  DJANGO_SETTINGS_MODULE='config.settings')
import django
django.setup()
from django.core.management import call_command
from django.template.loader import render_to_string
from django.test import Client, RequestFactory, override_settings
from content.editable import catalog, teachers
from content.views import STATIC_PAGES
from content.models import ContentEntry, Publication
from content.presentation import page_context

checks = []
def check(name, condition):
    assert condition, name
    checks.append(name)
    print('PASS', name)

call_command('migrate', interactive=False, verbosity=0)
call_command('check')
client = Client()
routes = sorted(set(STATIC_PAGES) | {c['slug'] for c in catalog()['collections']} | {t['key'] for t in catalog()['teachers']})
for slug in ['', *routes]:
    response = client.get('/' + (slug + '.html' if slug else ''))
    check('dynamic route ' + (slug or 'home'), response.status_code == 200)
    html = response.content.decode()
    check('resolved shell ' + (slug or 'home'), '{{' not in html and '{%' not in html and '<!--slot:' not in html)
    if slug:
        (OUTPUT / (slug + '.html')).write_text(html, encoding='utf-8')
for c in catalog()['collections']:
    html = client.get('/'+c['url']).content.decode()
    check('collection current/parent ' + c['id'], f'href="/{c["active"]}" aria-current="page"' in html)
check('unknown and unpublished routes remain 404', all(client.get(url).status_code == 404 for url in ['/missing.html', '/layout-science-innovation-section-1.html', '/news-preview-1.html']))

class Stylesheets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.urls.append(attrs['href'])

# A deep missing path must still load root-relative, correctly typed CSS, including the error styles.
for url in ['/404.html', '/missing/deep/page.html']:
    response = client.get(url)
    html = response.content.decode()
    check('styled error response ' + url, response.status_code == 404 and '<p>页面走丢了</p>' in html and 'class="error-text"' in html and 'href="/site-map.html">网站导航</a>' in html)
    parser = Stylesheets()
    parser.feed(html)
    check('root-relative versioned styles ' + url, len(parser.urls) == 2 and all(u.startswith('/css/') and '?v=' in u for u in parser.urls))
    for resource_url in parser.urls:
        resource = client.get(resource_url)
        check('CSS response ' + resource_url, resource.status_code == 200 and resource['Content-Type'].startswith('text/css'))
        body = b''.join(resource.streaming_content)
        resource.close()
        check('CSS version matches actual bytes ' + resource_url, hashlib.sha256(body).hexdigest().startswith(resource_url.split('?v=')[1]))
        if '/style.css?' in resource_url:
            check('compiled error rules available ' + url, b'.error-text {' in body and b'.error-text .back-link + .back-link {' in body and b'@import' not in body)
    (OUTPUT / ('404.html' if url == '/404.html' else 'deep-404.html')).write_text(html, encoding='utf-8')
csrf = Client(enforce_csrf_checks=True).post('/preview-admin/login/', {'username': 'not-a-user'})
check('CSRF uses distinct styled 403 heading', csrf.status_code == 403 and '<p>请求未通过验证</p>' in csrf.content.decode())
check('health contract local mode', client.get('/healthz').json() == {'status': 'ok', 'mode': 'local-preview'})
check('health HEAD has no body', client.head('/healthz').status_code == 200 and not client.head('/healthz').content)
check('local read-only view rejects POST', client.post('/healthz').status_code == 405)
check('anonymous local admin redirects to login', client.get('/preview-admin/', REMOTE_ADDR='127.0.0.1').status_code == 302)
check('nonlocal admin blocked', client.get('/preview-admin/', REMOTE_ADDR='192.0.2.1').status_code == 403)
with override_settings(PUBLIC_ONLY=True):
    check('health contract public mode', client.get('/healthz').json() == {'status': 'ok', 'mode': 'public-readonly'})
    check('public admin and writes hidden', client.get('/preview-admin/').status_code == 404 and client.post('/healthz').status_code == 404)
request = RequestFactory().get('/about.html')
request._editable_content = {
    'site': {'college': '测试学院 <文字>', 'motto': '测试校训', 'english': 'Review school', 'qr_image': 'henu-logo.png', 'account_name': '审核账号', 'is_visible': True},
    'about.section-1': {'key': 'about.section-1', 'title': '学院简介', 'body': '测试正文\n\n## 测试小标题\n\n<script>unsafe()</script>', 'is_visible': True},
    'entry-display-test': {'key': 'entry-display-test', 'collection': 'science-innovation.section-1', 'title': '测试研究 <方向>', 'summary': '仅内存渲染夹具', 'image': 'wafer-closeup.jpg', 'image_alt': '测试图', 'date': '2026-10-15', 'is_visible': True},
}
about = render_to_string('site/generated/about.html', request=request)
check('explicit brand/motto/QR slots render real supplied values', '测试学院 &lt;文字&gt;' in about and '测试校训' in about and '审核账号' in about and '/assets/henu-logo.png' in about)
check('body and headings render safely', '测试正文' in about and '<h3>测试小标题</h3>' in about and '&lt;script&gt;unsafe()&lt;/script&gt;' in about and '<script>unsafe()' not in about)
check('published introduction retains aligned fallback photo', 'class="overview-layout"' in about and about.count('class="overview-photo"') == 1 and '/assets/campus-building.jpg' in about)
request._editable_content['about.section-1']['image'] = 'wafer-closeup.jpg'
illustrated_about = render_to_string('site/generated/about.html', request=request)
check('published introduction image replaces fallback without duplication', illustrated_about.count('/assets/wafer-closeup.jpg') == 1 and '/assets/campus-building.jpg' not in illustrated_about)
request._editable_content['about.section-1'].pop('image')
science = render_to_string('site/generated/science-innovation.html', request=request)
check('overview renders collection cards and independent URLs', '测试研究 &lt;方向&gt;' in science and 'href="/entry-display-test.html"' in science and 'data-framed' in science)
request._editable_content['entry-group-display-test'] = {'key':'entry-group-display-test','collection':'research-groups.section-1','title':'测试课题组','summary':'独立大区块预览','is_visible':True}
science_with_group = render_to_string('site/generated/science-innovation.html', request=request)
groups_with_same_data = render_to_string('site/generated/research-groups.html', request=request)
check('research group main section reads existing collection with a unique view anchor', 'id="research-groups" data-overview-section data-collection="research-groups.section-1"' in science_with_group and 'href="/entry-group-display-test.html"' in science_with_group and 'href="/entry-group-display-test.html"' in groups_with_same_data)
check('research group is absent from related links after gaining a main section', 'href="/research-groups.html"' not in science_with_group.split('aria-label="相关栏目">')[-1].split('</nav>')[0])
empty_group_description = catalog()['emptyContent']['descriptions']['research-groups.section-1']
check('empty collection explains its purpose in overview and list', all(empty_group_description in client.get(url).content.decode() for url in ['/science-innovation.html','/research-groups-section-1.html']))
check('published collection replaces introductory placeholder', empty_group_description not in science_with_group and 'href="/entry-group-display-test.html"' in science_with_group)
cards = render_to_string('site/teachers.html', {'teachers': teachers(request)}, request=request)
check('three complete teachers share loading feedback', cards.count('class="faculty-card"') == 3 and cards.count('data-media-status') == 3 and cards.index('程纲') < cards.index('郑海务') < cards.index('张锦龙'))
talents = client.get('/faculty-talents.html').content.decode()
check('empty national groups retain both headings and preparation notes', all(f'id="{key}"' in talents for key in ['national-leading', 'national-young']) and talents.count('class="faculty-section"') == 2 and talents.count('相关内容正在整理中') == 2 and 'class="faculty-person ' not in talents)
contact = client.get('/contact.html').content.decode()
check('contact uses shared drawers and only WeChat placeholders', contact.count('class="link-drawer"') == 2 and contact.count('class="wechat-placeholder"') == 2 and 'website-code' not in contact and '/js/disclosures.js?' in contact)
education = client.get('/talent-cultivation.html').content.decode()
legacy_admissions = client.get('/admissions.html').content.decode()
check('education previews admissions directly while legacy overview keeps three anchors', all(f'id="{anchor}"' in education for anchor in ['undergraduate-admissions','graduate-admissions','employment-guidance']) and all(f'id="section-{i}"' in legacy_admissions for i in [1,2,3]))
check('admission and employment breadcrumbs use education as direct parent', all(page_context(slug)['breadcrumbs'] == [{'href':'/talent-cultivation.html','label':'人才培养'}] for slug in ['admissions-section-1','admissions-section-2','admissions-section-3']))
check('new teacher URL uses full parent chain', page_context('teacher-future', parent_slug='faculty', title='新教师')['breadcrumbs'] == [{'href':'/faculty.html','label':'师资队伍'}])
check('dynamic notices keep main single news parent', page_context('notices')['breadcrumbs'] == [{'href':'/news.html','label':'新闻通知'}])
check('dynamic news details keep main category parent', page_context('news-example', parent_slug='news', title='新闻')['breadcrumbs'] == [{'href':'/news.html','label':'学院新闻'}])
check('dynamic notice details keep main two parent levels', page_context('notice-example', parent_slug='notices', title='通知')['breadcrumbs'] == [{'href':'/news.html','label':'新闻通知'}, {'href':'/notices.html','label':'通知公告'}])
check('empty business database remains empty', ContentEntry.objects.count() == 0 and Publication.objects.count() == 0)
for url in ['/', '/news.html', '/notices.html', '/media.html', '/media-section-1.html']:
    check('static review demos never backfill dynamic data ' + url, '【演示】' not in client.get(url).content.decode())
check('static media demo route is not a published article', client.get('/content-demo-media-campus.html').status_code == 404)
call_command('makemigrations', check=True, dry_run=True, verbosity=1)
call_command('test', 'content', interactive=False, verbosity=1)
(OUTPUT / 'django-presentation.json').write_text(json.dumps({'passed': True, 'scope': 'isolated empty database and in-memory rendering fixtures; no publication UI or production checks', 'dataDirectory': str(DATA), 'count': len(checks), 'checks': checks},ensure_ascii=False,indent=2)+'\n', encoding='utf-8')
print('Django presentation evidence:', OUTPUT)
