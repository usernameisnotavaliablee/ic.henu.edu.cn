"""Local visual review only. Render existing Django components without a database."""
from pathlib import Path
import os
import re
import secrets
import sys
from urllib.parse import urlsplit
from unittest.mock import patch

ROOT = Path.cwd()
OUT = ROOT / 'frontend/examples/content-density'
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(ROOT / 'backend'))
os.environ.update(DJANGO_SETTINGS_MODULE='config.settings', IC_DATA_DIR=str(ROOT / 'sandbox/layout-example-data'),
                  IC_SECRET_KEY=secrets.token_urlsafe(64), IC_ALLOWED_HOSTS='localhost,127.0.0.1', IC_HTTPS='0')
import django
django.setup()
from django.template import RequestContext, Template
from django.test import RequestFactory
from content.views import detail_or_page

short_key = 'entry-demo-density-short'
records = {short_key: {
    'key': short_key, 'collection': 'science-innovation.section-1', 'title': '【演示】一条简短内容',
    'summary': '这是少量内容的排版示例，用来查看一张卡片时的留白与区块高度。',
    'body': '本条仅为排版演示。实际研究方向由学院审核后提供。',
    'date': '2026-10-15', 'image': 'wafer-closeup.jpg', 'image_alt': '晶圆装饰图片，仅用于排版演示',
    'is_visible': True, 'sort_order': 1,
}}
topics = ['芯片设计与集成系统', '微纳器件与功能材料', '集成电路测试与可靠性', '先进封装与系统互连',
          '传感器与智能感知', '低功耗电路与信号处理', '半导体器件与工艺', '电子系统与应用验证']
long_summary = ('本条用于演示较长内容进入页面后的排版效果，不代表学院已经设立相关课题组。'
                '可以观察标题换行、三行摘要、图片比例以及查看详情入口的位置。'
                '内容数量增加时，概览仅展示前三条，其他条目统一从右上角查看全部进入列表阅读。'
                '这里继续补充较长的说明文字，便于核对摘要是否按现有规则截断，以及完整文字是否仍能在详情页查看。')
for number, topic in enumerate(topics, 1):
    key = f'entry-demo-density-{number:02}'
    records[key] = {'key': key, 'collection': 'research-groups.section-1',
        'title': f'【演示 {number:02}】{topic}方向的较长课题组名称样例',
        'summary': long_summary,
        'body': '\n\n'.join(['## 排版演示说明', '本页为独立排版样例，没有向正式栏目或业务数据库写入内容。',
                          '## 完整内容', long_summary, long_summary,
                          '## 维护说明', '正式资料录入后，概览继续使用前三条预览，完整条目可在栏目列表和详情中阅读。']),
        'date': f'2026-10-{16-number:02}', 'image': 'chip-banner.jpg' if number % 2 else 'wafer-closeup.jpg',
        'image_alt': '学科装饰图片，仅用于排版演示', 'is_visible': True, 'sort_order': number}

files = {'index.html', 'science-innovation-section-1.html', 'research-groups-section-1.html', *(key + '.html' for key in records)}
def localize(match):
    attribute, url = match.groups()
    if url.startswith(('#', '//')) or urlsplit(url).scheme:
        return match.group(0)
    parts = urlsplit(url)
    target = parts.path.lstrip('/') or 'index.html'
    if target == 'science-innovation.html':
        target = 'index.html'
    elif target not in files:
        target = '../../preview/' + target
    if parts.query:
        target += '?' + parts.query
    if parts.fragment:
        target += '#' + parts.fragment
    return f'{attribute}="{target}"'

def save(name, html):
    html = re.sub(r'(href|src)="([^"]*)"', localize, html)
    (OUT / name).write_text(html, encoding='utf-8')

request = RequestFactory().get('/science-innovation.html')
request._editable_content = records
with patch('django.db.backends.sqlite3.base.DatabaseWrapper.get_new_connection', side_effect=AssertionError('Database access forbidden')):
    template = Template('''{% extends "site/generated/frame.html" %}{% load content_slots %}
{% block body %}<p class="page-note">仅供排版审核：研究方向放 1 条短内容；课题组准备 8 条长内容，概览显示前 3 条。点击“查看全部（8）”进入完整列表，卡片可查看全文。所有条目均为演示。</p>
<div class="overview-sections">{% collection_preview "science-innovation.section-1" position=1 %}{% collection_preview "research-groups.section-1" position=2 %}</div>{% endblock %}''')
    save('index.html', template.render(RequestContext(request, {
        'page_heading': '内容数量与版式演示', 'page_english': 'LAYOUT REVIEW',
        'active_page': 'science-innovation.html', 'breadcrumbs': [],
    })))
    for slug in ['science-innovation-section-1', 'research-groups-section-1', *records]:
        response = detail_or_page(request, slug)
        assert response.status_code == 200
        save(slug + '.html', response.content.decode('utf-8'))
print(f'Built {len(files)} local review pages: {OUT / "index.html"}')
print('1 short item; 8 long items with 3 shown in overview; all list and detail links available; database access disabled.')
