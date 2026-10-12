"""Apply typography in place while preserving the user's latest text."""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
import hashlib
import subprocess
import sys
from lxml import etree

sys.stdout.reconfigure(encoding='utf-8')
docs = next(p for p in Path(__file__).resolve().parents if p.name == 'docs')
path = docs / '发给老师/老师确认稿_教师资料与网站风格.docx'
board_path = docs / 'assets/design/网站风格方向示意.png'
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
ns = {'w': W, 'a': A}
q = lambda name: '{' + W + '}' + name


def ensure(parent, name):
    child = parent.find(q(name))
    if child is None:
        child = etree.Element(q(name))
        order = ['rStyle', 'rFonts', 'b', 'bCs']
        pos = next((i for i, item in enumerate(parent)
                    if etree.QName(item).localname not in order
                    or order.index(etree.QName(item).localname) > order.index(name)), len(parent))
        parent.insert(pos, child)
    return child


def apply_font(pr):
    fonts = ensure(pr, 'rFonts')
    for attr in list(fonts.attrib):
        if etree.QName(attr).localname.endswith('Theme'):
            del fonts.attrib[attr]
    for name in ['ascii', 'hAnsi', 'eastAsia', 'cs']:
        fonts.set(q(name), '宋体')
    for name in ['b', 'bCs']:
        ensure(pr, name).set(q('val'), '0')


original = path.read_bytes()
original_hash = hashlib.sha256(original).digest()
with ZipFile(BytesIO(original)) as archive:
    entries = archive.infolist()
    parts = {entry.filename: archive.read(entry) for entry in entries}
old_board = board_path.read_bytes()
board_parts = [name for name, data in parts.items()
               if name.startswith('word/media/') and data == old_board]
assert len(board_parts) == 1, '示意图已被用户替换，需人工检查，禁止覆盖。'
subprocess.run([sys.executable, str(Path(__file__).with_name('build_teacher_brief.py')),
                '--board-only'], check=True)
new_board = board_path.read_bytes()
changed = {}
text_before = {}
for name, data in parts.items():
    if not name.startswith('word/') or not name.endswith('.xml'):
        continue
    root = etree.fromstring(data)
    text_before[name] = root.xpath('//w:t/text() | //w:instrText/text() | //w:delText/text()', namespaces=ns)
    for node in root.xpath('//w:r | //w:style', namespaces=ns):
        pr = node.find(q('rPr'))
        if pr is None:
            pr = etree.SubElement(node, q('rPr')) if node.tag == q('style') else etree.Element(q('rPr'))
            if node.tag == q('r'):
                node.insert(0, pr)
        apply_font(pr)
    for pr in root.xpath('//w:rPr', namespaces=ns):
        apply_font(pr)
    for fonts in root.xpath('//w:rFonts', namespaces=ns):
        for attr in list(fonts.attrib):
            if etree.QName(attr).localname.endswith('Theme'):
                del fonts.attrib[attr]
        for field in ['ascii', 'hAnsi', 'eastAsia', 'cs']:
            fonts.set(q(field), '宋体')
    for bold in root.xpath('//w:b | //w:bCs', namespaces=ns):
        bold.set(q('val'), '0')
    # Symbol's private-use bullet needs a Unicode equivalent in SimSun.
    for label in root.xpath('//w:lvlText', namespaces=ns):
        if label.get(q('val')) == '\uf0b7':
            label.set(q('val'), '•')
    for font in root.xpath('//a:latin | //a:ea | //a:cs | //a:font', namespaces=ns):
        font.set('typeface', '宋体')
    for pr in root.xpath('//a:rPr | //a:defRPr | //a:endParaRPr', namespaces=ns):
        pr.set('b', '0')
    assert text_before[name] == root.xpath('//w:t/text() | //w:instrText/text() | //w:delText/text()', namespaces=ns)
    updated = etree.tostring(root, encoding='UTF-8', xml_declaration=True, standalone=True)
    if updated != data:
        changed[name] = updated
changed[board_parts[0]] = new_board
out = BytesIO()
with ZipFile(out, 'w') as archive:
    for entry in entries:
        archive.writestr(entry, changed.get(entry.filename, parts[entry.filename]))
with ZipFile(BytesIO(out.getvalue())) as archive:
    assert archive.namelist() == list(parts), 'Package structure changed'
    for name, old in parts.items():
        current = archive.read(name)
        if name.startswith('word/media/') and name not in board_parts:
            assert current == old, 'Teacher photo changed'
        if name in text_before:
            root = etree.fromstring(current)
            assert text_before[name] == root.xpath('//w:t/text() | //w:instrText/text() | //w:delText/text()', namespaces=ns)
            assert all(n.get(q('val')) in ('0', 'false', 'off')
                       for n in root.xpath('//w:b | //w:bCs', namespaces=ns))
            assert all(n.get(q(k)) == '宋体'
                       for n in root.xpath('//w:rFonts', namespaces=ns)
                       for k in ['ascii', 'hAnsi', 'eastAsia', 'cs'])
        elif name not in changed:
            assert current == old
assert hashlib.sha256(path.read_bytes()).digest() == original_hash, 'Word changed during formatting; retry on the newest file'
temp = path.with_suffix('.formatting.tmp')
temp.write_bytes(out.getvalue())
temp.replace(path)
print('宋体、不加粗；原正文、链接、三位教师照片及其他内容完整保留。')
print(path)
