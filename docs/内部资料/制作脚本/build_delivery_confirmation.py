"""生成单页老师确认清单；不改动用户已有教师确认稿。"""
from pathlib import Path
from io import BytesIO
from zipfile import ZipFile, ZIP_DEFLATED
from docx import Document
from docx.shared import Cm, Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from lxml import etree

ROOT = Path(__file__).resolve().parents[3]
DEST = ROOT / 'docs/发给老师/交付_老师_待确认.docx'
doc = Document()
section = doc.sections[0]
section.page_width = Cm(21)
section.page_height = Cm(29.7)
section.top_margin = section.bottom_margin = Cm(1.8)
section.left_margin = section.right_margin = Cm(2)
for style in doc.styles:
    if hasattr(style, 'font'):
        style.font.name = '宋体'
        style.font.bold = False
        style.font.size = Pt(11)
        props = style.element.get_or_add_rPr()
        fonts = props.find(qn('w:rFonts'))
        if fonts is None:
            fonts = OxmlElement('w:rFonts')
            props.insert(0, fonts)
        for attr in list(fonts.attrib):
            if attr.endswith('Theme'):
                del fonts.attrib[attr]
        for field in ('ascii', 'hAnsi', 'eastAsia', 'cs'):
            fonts.set(qn('w:' + field), '宋体')
doc.styles['Normal'].paragraph_format.space_after = Pt(5)
doc.styles['Normal'].paragraph_format.line_spacing = 1.2

def para(text, size=11, after=5):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text)
    r.font.name = '宋体'
    r.font.size = Pt(size)
    r.font.bold = False
    r._element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'), '宋体')
    return p

para('交付老师：网站演示版待确认事项', 17, 9)
para('河南大学集成电路与微纳电子学院　｜　2026年10月12日', 10, 9)
para('老师您好，演示版已放入现有照片和公开资料。请重点核对下面几项，已有材料不用重复提供；如需修改，直接告诉我们改哪里即可。')
para('一、已放进演示版，请确认或修改', 13, 7)
para('1. 师资：张锦龙（教授、博导）、郑海务（二级教授、博导）、程纲（教授、博导）。已放照片、简介、研究教学、公开邮箱；张锦龙含公开电话。请确认三位是否展示，资料和联系方式是否可用。')
para('   程纲老师的研究主题暂据公开论文概括，请确认一句正式介绍。职务、荣誉与成果数量采用已有资料，请核对最新情况。')
para('2. 教学科研：暂用上述教师公开资料中的研究主题与课程。请确认哪些可作为学院介绍，或直接提供修改文字。')
para('3. 图片：已用校徽、4张校园图、3位教师照片，以及4张公开授权的晶圆、实验室、器件示意图。校外图片已标明示意并保留来源。请确认使用，或提供学院自己的图片替换。')
para('4. 界面：蓝白配色、整栏导航和下拉菜单、轮播图、纵向内容板块；电脑有滚动翻页效果，手机自然滚动。请告知需要调整的地方。')
para('二、还没有的材料，请方便时提供', 13, 7)
para('1. 学院正式简介、组织机构；办公地址、公开电话和邮箱。')
para('2. 首批新闻、通知的标题、日期、正文和配图；没有可发布内容时请说明。')
para('3. 可用的院徽（没有请写“暂无”）、学院或实验室高清照片；张锦龙、郑海务老师照片如有高清版，请替换。')
para('三、回复方式', 13, 7)
para('□ 现有内容可以用于演示　　□ 按下面意见修改')
para('正式上线前，教师资料、学院信息、图片与新闻仍以学院最终确认版本为准。', 10)
para('修改意见：__________________________________________________')
para('确认人：________________　日期：________________', 11, 0)
buffer = BytesIO()
doc.save(buffer)
# 统一主题和所有样式/运行的字体，防止Word继承其他字体或加粗。
with ZipFile(BytesIO(buffer.getvalue())) as source:
    entries = {name: source.read(name) for name in source.namelist()}
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
for name, data in list(entries.items()):
    if not name.startswith('word/') or not name.endswith('.xml'):
        continue
    tree = etree.fromstring(data)
    for fonts in tree.findall('.//{' + W + '}rFonts'):
        for attr in list(fonts.attrib):
            if attr.endswith('Theme'):
                del fonts.attrib[attr]
        for field in ('ascii', 'hAnsi', 'eastAsia', 'cs'):
            fonts.set('{' + W + '}' + field, '宋体')
    for bold in tree.findall('.//{' + W + '}b') + tree.findall('.//{' + W + '}bCs'):
        bold.set('{' + W + '}val', '0')
    if name.startswith('word/theme/'):
        for element in tree.iter():
            if element.tag in ('{' + A + '}latin', '{' + A + '}ea', '{' + A + '}cs'):
                element.set('typeface', '宋体')
    entries[name] = etree.tostring(tree, xml_declaration=True, encoding='UTF-8', standalone=True)
with ZipFile(DEST, 'w', ZIP_DEFLATED) as output:
    for name, data in entries.items():
        output.writestr(name, data)
with ZipFile(DEST) as check:
    assert check.testzip() is None
    for name in ('word/document.xml', 'word/styles.xml'):
        tree = etree.fromstring(check.read(name))
        assert all(node.get('{' + W + '}val') == '0' for node in tree.findall('.//{' + W + '}b'))
        assert all(node.get('{' + W + '}eastAsia') == '宋体' for node in tree.findall('.//{' + W + '}rFonts'))
print(str(DEST))
print('通过：DOCX可读取；宋体、不加粗；原教师确认稿未改动。')

