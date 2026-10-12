"""检查生成页面的本地链接、片段、图片、脚本与样式是否存在。"""
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / 'preview'


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids = set()
        self.refs = []
        self.errors = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                self.errors.append('重复 ID：' + attrs['id'])
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.refs.append(attrs[key])


pages = {file.resolve(): Page(file.read_text(encoding='utf-8')) for file in ROOT.glob('*.html')}
errors = []
count = 0
for file, page in pages.items():
    errors.extend(f'{file.name}: {error}' for error in page.errors)
    for ref in page.refs:
        parts = urlsplit(ref)
        if parts.scheme or parts.netloc:
            continue
        count += 1
        target = (file.parent / unquote(parts.path)).resolve() if parts.path else file
        if not ref or ref == '#':
            errors.append(f'{file.name}: 空链接')
        elif not target.is_relative_to(ROOT.resolve()) or not target.is_file():
            errors.append(f'{file.name}: 失效资源 {ref}')
        elif parts.fragment and (target not in pages or unquote(parts.fragment) not in pages[target].ids):
            errors.append(f'{file.name}: 失效片段 {ref}')
for file in (ROOT / 'css').glob('*.css'):
    for ref in re.findall(r'url\([\x27\x22]?([^\x27\x22)]+)', file.read_text(encoding='utf-8')):
        count += 1
        if not (file.parent / ref).resolve().is_file():
            errors.append(f'{file.name}: 失效 CSS 资源 {ref}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'通过：{len(pages)} 个页面，{count} 个本地资源/链接引用；无失效片段或重复 ID。')
