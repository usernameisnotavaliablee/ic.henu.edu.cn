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
check('原有九个主栏目完整保留、一级无同名重复', set(['首页', '学院概况', '科学与创新', '人才培养', '师资队伍', '新闻通知', '公共服务', '人才招聘', '联系我们']).issubset(labels) and len(labels) == len(set(labels)))
education = top[labels.index('人才培养')]
service = top[labels.index('公共服务')]
check('师生园地只归人才培养', len(education.all(lambda n: n.tag == 'a' and n.attrs.get('href') == 'community.html')) == 1 and not service.all(lambda n: n.attrs.get('href') == 'community.html'))
faculty = top[labels.index('师资队伍')]
check('师资子菜单仅教师名录和人才招聘', [a.label() for a in faculty.all(lambda n: n.has('subnav'))[0].all(lambda n: n.tag == 'a')] == ['教师名录', '人才招聘'])
check('三级招生菜单进入三个独立列表', len(education.all(lambda n: n.has('subnav'))) >= 3 and len(education.all(lambda n: n.attrs.get('href', '').startswith('admissions-section-'))) == 3)
for name, page in pages.items():
    ids = {n.attrs['id'] for n in page.all(lambda n: 'id' in n.attrs)}
    buttons = page.all(lambda n: n.has('subnav-toggle'))
    check(name + '多级菜单目标完整、保留技术支持、无暂停按钮', all(b.attrs.get('aria-controls') in ids for b in buttons) and len(page.all(lambda n: n.attrs.get('href') == 'https://hdwzgzs.cn/')) == 1 and not page.all(lambda n: 'data-pause' in n.attrs or 'data-motion-toggle' in n.attrs))
    for frame in page.all(lambda n: 'data-media' in n.attrs):
        assert len(frame.all(lambda n: n.tag == 'img')) == 1, name
        assert len(frame.all(lambda n: 'data-media-status' in n.attrs)) == 1, name
check('图片框都有唯一图片与反馈节点', True)
footer = home.all(lambda n: n.has('footer-bottom-inner'))[0]
check('工作室与备案同一底栏、保留徽标', all(footer.all(lambda n: n.has(c)) for c in ['footer-support', 'footer-filing', 'studio-mark']))
check('页脚与联系页都有公众号区域', all(pages[name].all(lambda n: n.has('wechat-panel')) for name in ['index.html', 'contact.html']))
for name in ['index.html', 'faculty.html']:
    cards = pages[name].all(lambda n: n.has('faculty-card'))
    check(name + '程老师首位', cards[0].attrs['href'] == 'teacher-cheng-gang.html')
    check(name + '保留三个非人物师资空位', len(pages[name].all(lambda n: n.has('faculty-vacancy'))) == 3)
for name, page in pages.items():
    if name.startswith('teacher-'):
        check(name + '完整恢复简介、学术材料与联系方式', len(page.all(lambda n: n.has('profile-section'))) >= 5 and '个人简介' in page.label() and '联系方式' in page.label())
        breadcrumb = page.all(lambda n: n.has('breadcrumb'))[0]
        check(name + '面包屑包含师资父级', any(n.attrs.get('href') == 'faculty.html' for n in breadcrumb.all(lambda n: n.tag == 'a')))
views = ast.parse((DOCS / 'backend/content/views.py').read_text(encoding='utf-8'))
allowed = next(ast.literal_eval(n.value.args[0]) for n in views.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'STATIC_PAGES' for t in n.targets))
required = ['research-platforms', 'research-groups', 'regulations', 'party-building', 'admissions', 'community', 'ic-world', 'media']
check('八个新页面已加入服务器静态白名单', set(required).issubset(allowed))
frame = (DOCS / 'backend/templates/site/generated/frame.html').read_text(encoding='utf-8')
server_home = (DOCS / 'backend/templates/site/generated/home.html').read_text(encoding='utf-8')
catalog = json.loads((DOCS / 'backend/content-catalog.json').read_text(encoding='utf-8'))
for key in catalog['slots']:
    if key.startswith('home.'):
        assert "content_block '" + key + "'" in server_home, key
    else:
        generated = (DOCS / 'backend/templates/site/generated' / (key.split('.')[0] + '.html')).read_text(encoding='utf-8')
        collection = next((c for c in catalog['collections'] if key in c['legacyKeys']), None)
        assert ("collection_preview '" + collection['key'] + "'" if collection else "content_block '" + key + "'") in generated, key
check('后台目录每个内容位置都有前台读取入口', True)
check('动态页面共享公众号与备案配置', 'site/wechat.html' in frame and 'site/wechat.html' in server_home and 'site_info.body' in frame)
check('数据库首页和文章外框同步新导航及加载脚本', all('招生就业' in html and 'js/media-loading.js' in html and 'https://hdwzgzs.cn/' in html for html in [frame, server_home]))
for file in ['home_pictures.html', 'detail.html']:
    source = (DOCS / 'backend/templates/site' / file).read_text(encoding='utf-8')
    check(file + '数据库图片复用加载反馈', 'data-media' in source and 'site/media_status.html' in source)
result = {'scope': 'offline generated structure, not browser or Django runtime', 'count': len(checks), 'checks': checks}
(ROOT / 'qa/current-structure.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'通过：{len(checks)} 项生成结构与运行文件检查。')
