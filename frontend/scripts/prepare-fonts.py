"""把「新愚公装甲宋A」母版子集化为固定标题字体；不联网，不安装任何依赖。

先 build-site.js，再运行本脚本，再 build-site.js。--check 离线核对，不重新生成。
构建期需要 fontTools（本机 pyftsubset / fontTools 4.x）；网页访问者只向本站请求字体。
"""
import argparse
import hashlib
import io
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_FONT = ROOT.parent / 'docs' / 'assets' / 'fonts' / '新愚公装甲宋A.ttf'
LICENSE_FILE = ROOT / 'licenses' / 'XinYuGongZhangJiaSongA-OFL.txt'
MANIFEST = ROOT / 'licenses' / 'zhuangsong-manifest.txt'
FAMILY = 'IC ZhuangSong'
STYLE_FILE = ROOT / 'src' / 'css' / 'fonts.css'
SELECTORS = '.brand-motto, .editorial-heading h2, .feature-intro, .footer-campus p'
ASSET_DIRS = (ROOT / 'src' / 'assets', ROOT / 'preview' / 'assets')
ASSET_PATTERNS = ('ic-zhuangsong-headings-*.ttf', 'ic-kai-headings-*.ttf')


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


def digest(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def required_characters():
    characters = set()
    for page in (ROOT / 'preview').glob('*.html'):
        parser = HeadingText()
        parser.feed(page.read_text(encoding='utf-8'))
        characters.update(parser.characters)
    if not characters:
        raise SystemExit('未找到已构建的标题区域，请先运行 node frontend/scripts/build-site.js。')
    return ''.join(sorted(characters))


def subset_font(characters):
    try:
        from fontTools import subset
        from fontTools.ttLib import TTFont
    except ImportError:
        raise SystemExit('缺少 fontTools，本脚本子集化需要它；请自行安装（如 pip install fonttools），脚本不自动安装。')
    options = subset.Options()
    options.layout_features = []
    options.hinting = False
    options.desubroutinize = True
    options.notdef_outline = True
    options.recalc_bounds = True
    # OFL 要求随衍生字体保留版权与许可声明，pyftsubset 默认只留 name 0-6，必须放宽。
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    font = TTFont(SOURCE_FONT)
    # 母版带 space 字形却漏了 U+0020 映射；补上，否则标题里的空格会回退到系统字体、宽度随系统变化。
    if any(c.isspace() for c in characters) and 0x20 not in font.getBestCmap():
        if 'space' not in font.getGlyphOrder():
            raise SystemExit('母版字体既无 U+0020 映射也无 space 字形，未改动任何文件。')
        for table in font['cmap'].tables:
            if table.isUnicode():
                table.cmap[0x20] = 'space'
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=characters)
    subsetter.subset(font)
    covered = set(font.getBestCmap())
    missing = ''.join(sorted(c for c in characters if not c.isspace() and ord(c) not in covered))
    if missing:
        raise SystemExit('母版字体缺字，未改动任何文件：' + missing)
    buffer = io.BytesIO()
    font.save(buffer)
    return buffer.getvalue()


def clear_assets():
    removed = []
    for folder in ASSET_DIRS:
        for pattern in ASSET_PATTERNS:
            for stale in sorted(folder.glob(pattern)):
                stale.unlink()
                removed.append(stale.relative_to(ROOT.parent).as_posix())
    return removed


def write_style(asset_name):
    STYLE_FILE.write_text(
        '/* 新愚公装甲宋A（衍自思源宋体）· SIL OFL 1.1；固定标题子集，授权见 frontend/licenses。 */\n'
        f'@font-face {{ font-family: "{FAMILY}"; font-style: normal; font-weight: 400; font-display: swap; '
        f'src: url("../assets/{asset_name}") format("truetype"); }}\n'
        f'{SELECTORS} {{ font-family: var(--font-display); font-weight: 400; font-synthesis: none; }}\n',
        encoding='utf-8', newline='\n')


def check():
    if not MANIFEST.exists():
        raise SystemExit('待完成：字体子集尚未生成；请运行不带 --check 的本脚本。')
    info = json.loads(MANIFEST.read_text(encoding='utf-8'))
    if not SOURCE_FONT.is_file() or digest(SOURCE_FONT) != info['source_sha256']:
        raise SystemExit(f'母版字体缺失或已变更，无法核对子集来源：{info["source_file"]}')
    for relative, expected in info['files'].items():
        file = ROOT / relative
        if not file.is_file() or digest(file) != expected:
            raise SystemExit(f'字体资源缺失或校验不符：{relative}')
    missing = set(required_characters()) - set(info['characters'])
    if missing:
        raise SystemExit('标题文字已增加，需重新生成字体子集：' + ''.join(sorted(missing)))
    print(f'字体资源、授权及字符覆盖通过：{len(info["characters"])}个字符。')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        check()
        return
    if not SOURCE_FONT.is_file():
        raise SystemExit(f'未找到母版字体：{SOURCE_FONT}')
    characters = required_characters()
    binary = subset_font(characters)
    asset_name = f'ic-zhuangsong-headings-{hashlib.sha256(binary).hexdigest()[:12]}.ttf'
    for stale in clear_assets():
        print(f'已清除过期字体资源：{stale}')
    (ROOT / 'src' / 'assets' / asset_name).write_bytes(binary)
    write_style(asset_name)
    files = {relative: digest(ROOT / relative) for relative in
             (f'src/assets/{asset_name}', 'src/css/fonts.css',
              LICENSE_FILE.relative_to(ROOT).as_posix())}
    MANIFEST.write_text(json.dumps({
        'family': FAMILY,
        'license': 'SIL OFL 1.1',
        'source_file': SOURCE_FONT.relative_to(ROOT.parent).as_posix(),
        'source_sha256': digest(SOURCE_FONT),
        'name_ids': '*',
        'characters': characters,
        'files': files,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    check()
    print(f'已保存 {len(binary)} 字节子集，无新增依赖。请重新构建前端后部署。')


if __name__ == '__main__':
    main()
