"""用 Python 标准库取得开源楷体子集并自托管；不安装字体、库或系统包。

先 build-site.js，再运行本脚本，再 build-site.js。--check 离线核对，不下载。
Google Fonts 仅在准备资产时使用，网页访问者只向本站请求字体。
"""
import argparse
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
LICENSE_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/lxgwwenkaitc/OFL.txt'
MANIFEST = ROOT / 'licenses' / 'lxgw-wenkai-manifest.txt'


class HeadingText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.characters = set()

    def handle_starttag(self, tag, attrs):
        classes = set(dict(attrs).get('class', '').split())
        selected = bool(classes & {'brand-motto', 'feature-intro'})
        selected |= tag == 'h2' and any('editorial-heading' in item[1] for item in self.stack)
        selected |= tag == 'p' and any('footer-campus' in item[1] for item in self.stack)
        selected |= any(item[2] for item in self.stack)
        if tag not in {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}:
            self.stack.append((tag, classes, selected))

    def handle_startendtag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                self.stack = self.stack[:index]
                break

    def handle_data(self, text):
        if self.stack and self.stack[-1][2]:
            self.characters.update(text.strip())


def required_characters():
    characters = set()
    for page in (ROOT / 'preview').glob('*.html'):
        parser = HeadingText()
        parser.feed(page.read_text(encoding='utf-8'))
        characters.update(parser.characters)
    if not characters:
        raise SystemExit('未找到已构建的楷体区域，请先运行 node frontend/scripts/build-site.js。')
    return ''.join(sorted(characters))


def download(url, limit):
    request = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(request, timeout=45) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise RuntimeError('字体来源响应超过预期大小，未保存。')
    return data


def check():
    if not MANIFEST.exists():
        raise SystemExit('待完成：授权字体资源尚未下载；不能声称手机字体问题已修复。')
    info = json.loads(MANIFEST.read_text(encoding='utf-8'))
    for relative, digest in info['files'].items():
        file = ROOT / relative
        if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest() != digest:
            raise SystemExit(f'字体资源缺失或校验不符：{relative}')
    missing = set(required_characters()) - set(info['characters'])
    if missing:
        raise SystemExit('楷体文本已增加，需重新生成字体子集：' + ''.join(sorted(missing)))
    print(f'字体资源、授权及字符覆盖通过：{len(info["characters"])}个字符。')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        check()
        return
    characters = required_characters()
    url = 'https://fonts.googleapis.com/css2?' + urlencode({'family': 'LXGW WenKai TC', 'display': 'swap', 'text': characters})
    css = download(url, 100_000).decode('utf-8')
    match = re.search(r'src:\s*url\((https://[^)]+)\)', css)
    if not match or urlsplit(match[1]).hostname != 'fonts.gstatic.com':
        raise SystemExit('未取得可信的 Google Fonts 字体地址，未改动样式。')
    binary = download(match[1], 2_000_000)
    formats = {b'wOF2': ('woff2', 'woff2'), b'\x00\x01\x00\x00': ('ttf', 'truetype')}
    if binary[:4] not in formats:
        raise SystemExit('字体响应不是预期的 WOFF2 或 TTF，未改动样式。')
    license_text = download(LICENSE_URL, 30_000).decode('utf-8')
    if 'SIL OPEN FONT LICENSE Version 1.1' not in license_text or 'LXGW WenKai Project Authors' not in license_text:
        raise SystemExit('授权文本未通过核对，未改动样式。')
    extension, font_format = formats[binary[:4]]
    digest = hashlib.sha256(binary).hexdigest()
    name = f'ic-kai-headings-{digest[:12]}.{extension}'
    asset = ROOT / 'src' / 'assets' / name
    license_file = ROOT / 'licenses' / 'LXGW-WenKai-TC-OFL.txt'
    license_file.parent.mkdir(parents=True, exist_ok=True)
    asset.write_bytes(binary)
    license_file.write_text(license_text, encoding='utf-8')
    generated = ROOT / 'src' / 'css' / 'fonts.css'
    generated.write_text(
        '/* LXGW WenKai TC · SIL OFL 1.1；固定楷体文本子集，授权见 frontend/licenses。 */\n'
        '@font-face { font-family: "IC WenKai"; font-style: normal; font-weight: 400; font-display: swap; '
        f'src: url("../assets/{name}") format("{font_format}"); }}\n'
        '.brand-motto, .editorial-heading h2, .feature-intro, .footer-campus p { '
        'font-family: var(--font-kai); font-weight: 400; font-synthesis: none; }\n', encoding='utf-8')
    info = {'family': 'LXGW WenKai TC', 'license': 'SIL OFL 1.1', 'source_css': url,
            'source_font': match[1], 'source_license': LICENSE_URL, 'characters': characters,
            'files': {f.relative_to(ROOT).as_posix(): hashlib.sha256(f.read_bytes()).hexdigest()
                      for f in [asset, license_file, generated]}}
    MANIFEST.write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    check()
    print(f'已保存 {len(binary)} 字节字体，无新增依赖。请重新构建前端后部署。')


if __name__ == '__main__':
    main()
