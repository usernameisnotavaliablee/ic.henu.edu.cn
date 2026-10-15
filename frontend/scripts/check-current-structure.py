"""检查构建后的栏目树、模板一致性、图片反馈结构及服务器白名单；不代替浏览器验收。"""
import ast
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT.parent  # 仓库根目录
checks = []


class Node:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent = tag, dict(attrs), parent
        self.children, self.text = [], ''

    def all(self, predicate):
        return [child for child in self.children for child in [child, *child.all(lambda _: True)] if predicate(child)]

    def has(self, name):
        return name in self.attrs.get('class', '').split()

    def label(self):
        return self.text + ''.join(child.label() for child in self.children)


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.root = self.node = Node()
        self.feed(path.read_text(encoding='utf-8'))

    def handle_starttag(self, tag, attrs):
        child = Node(tag, attrs, self.node)
        self.node.children.append(child)
        if tag not in {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'path', 'circle', 'rect', 'line', 'use', 'stop'}:
            self.node = child

    def handle_startendtag(self, tag, attrs):
        old = self.node
        self.handle_starttag(tag, attrs)
        self.node = old

    def handle_endtag(self, tag):
        current = self.node
        while current.parent:
            if current.tag == tag:
                self.node = current.parent
                return
            current = current.parent

    def handle_data(self, data):
        self.node.text += data


def check(name, condition):
    assert condition, name
    checks.append(name)


pages = {p.name: Page(p).root for p in (ROOT / 'preview').glob('*.html')}
home = pages['index.html']
nav = home.all(lambda n: n.has('main-nav'))[0]
top = nav.children[0].children
labels = [item.children[0].children[0].label() for item in top]
check('原有九个主栏目完整保留、一级无同名重复', set(['首页', '学院概况', '科学与创新', '人才培养', '师资队伍', '新闻通知', '党建党务', '人才招聘', '联系我们']).issubset(labels) and len(labels) == len(set(labels)))
education = top[labels.index('人才培养')]
check('公共服务不再占一级入口', '公共服务' not in labels)
check('师生园地只归人才培养', len(education.all(lambda n: n.tag == 'a' and n.attrs.get('href') == 'community.html')) == 1)
faculty = top[labels.index('师资队伍')]
check('师资分类与完整名录保留，招聘只保留顶级入口', [a.label() for a in faculty.all(lambda n: n.has('subnav'))[0].all(lambda n: n.tag == 'a')] == ['高层次人才', '普通教师', '教师名录'])
education_menu = education.all(lambda n: n.has('subnav'))[0]
education_direct = [a.label() for child in education_menu.children for heading in child.children if heading.has('nav-item-heading') for a in heading.children if a.tag == 'a']
check('本研招生与就业指导直接列于人才培养下', education_direct == ['本科生招生', '研究生招生', '学科与专业', '课程与培养方案', '工程教育认证', '就业指导', '师生园地'])
for name, page in pages.items():
    ids = {n.attrs['id'] for n in page.all(lambda n: 'id' in n.attrs)}
    buttons = page.all(lambda n: n.has('subnav-toggle'))
    check(name + '多级菜单目标完整、保留技术支持、无暂停按钮', all(b.attrs.get('aria-controls') in ids for b in buttons) and len(page.all(lambda n: n.has('footer-support') and n.attrs.get('href') == 'https://hdwzgzs.cn/')) == 1 and not page.all(lambda n: 'data-pause' in n.attrs or 'data-motion-toggle' in n.attrs))
    for frame in page.all(lambda n: 'data-media' in n.attrs):
        assert len(frame.all(lambda n: n.tag == 'img')) == 1, name
        assert len(frame.all(lambda n: 'data-media-status' in n.attrs)) == 1, name
check('图片框都有唯一图片与反馈节点', True)
footer = home.all(lambda n: n.has('footer-bottom-inner'))[0]
check('工作室与备案同一底栏、保留徽标', all(footer.all(lambda n: n.has(c)) for c in ['footer-support', 'footer-filing', 'studio-mark']))
check('公众号缺图保留虚线、官网缺图不占位', all(
    len(pages[name].all(lambda n: n.has('wechat-placeholder'))) == count
    and not pages[name].all(lambda n: n.has('wechat-code') or n.has('website-code'))
    for name, count in [('index.html', 1), ('contact.html', 2)]))
for name in ['index.html', 'faculty.html']:
    cards = pages[name].all(lambda n: n.has('faculty-card'))
    check(name + '程老师首位', cards[0].attrs['href'] == 'teacher-cheng-gang.html')
    check(name + '不再生成固定师资空卡片', not pages[name].all(lambda n: n.has('faculty-vacancy')))
for name, page in pages.items():
    if name.startswith('teacher-'):
        check(name + '完整恢复简介、学术材料与联系方式', len(page.all(lambda n: n.has('profile-section'))) >= 5 and '个人简介' in page.label() and '联系方式' in page.label())
        breadcrumb = page.all(lambda n: n.has('breadcrumb'))[0]
        check(name + '面包屑包含师资父级', any(n.attrs.get('href') == 'faculty.html' for n in breadcrumb.all(lambda n: n.tag == 'a')))
catalog = json.loads((DOCS / 'backend/content-catalog.json').read_text(encoding='utf-8'))
allowed = [slug for slug, route in catalog['routes'].items() if route.get('kind') in {'overview', 'page'}]
required = ['research-platforms', 'research-groups', 'management', 'party-building', 'admissions', 'community', 'ic-world', 'media']
check('八个新页面属于共享目录的固定路由白名单', set(required).issubset(allowed))
frame = (DOCS / 'backend/templates/site/generated/frame.html').read_text(encoding='utf-8')
server_home = (DOCS / 'backend/templates/site/generated/home.html').read_text(encoding='utf-8')
catalog = json.loads((DOCS / 'backend/content-catalog.json').read_text(encoding='utf-8'))
for key in catalog['slots']:
    if key.startswith('home.'):
        assert "content_block '" + key + "'" in server_home, key
    else:
        collection = next((c for c in catalog['collections'] if key in c['legacyKeys']), None)
        if collection and not collection.get('listed', True):
            assert collection['slug'] in catalog['routes']
            continue  # Legacy service guide has a readable direct route, no overview/menu slot.
        page = collection['page'] if collection else key.split('.')[0] + '.html'
        generated = (DOCS / 'backend/templates/site/generated' / page).read_text(encoding='utf-8')
        assert ("collection_preview '" + collection['key'] + "'" if collection else "content_block '" + key + "'") in generated, key
check('后台目录每个内容位置都有前台读取入口', True)
check('动态页面共享公众号与备案配置', 'site/wechat.html' in frame and 'site/wechat.html' in server_home and 'site_info.body' in frame)
check('数据库首页和文章外框同步新导航及加载脚本', all('本科生招生' in html and '研究生招生' in html and '招生就业' not in html and 'js/media-loading.js' in html and 'https://hdwzgzs.cn/' in html for html in [frame, server_home]))
for file in ['home_pictures.html', 'detail.html']:
    source = (DOCS / 'backend/templates/site' / file).read_text(encoding='utf-8')
    check(file + '数据库图片复用加载反馈', 'data-media' in source and 'site/media_status.html' in source)
result = {'scope': 'offline generated structure, not browser or Django runtime', 'count': len(checks), 'checks': checks}
(ROOT / 'qa/current-structure.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'通过：{len(checks)} 项生成结构与运行文件检查。')
