"""Build the editable faculty review document from the retained local material."""
from pathlib import Path
import re
import sys
from datetime import datetime, timezone

from PIL import Image
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT

sys.stdout.reconfigure(encoding="utf-8")
DOCS = next(p for p in Path(__file__).resolve().parents if p.name=='docs')
SOURCE = DOCS / "内部资料" / "教师简历汇总.md"
OUTPUT = DOCS / "历史版本" / "三位教师简历与照片_人工核验稿.docx"
source_text = SOURCE.read_text(encoding="utf-8")
doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Inches(8.5), Inches(11)
sec.top_margin, sec.bottom_margin = Inches(.7), Inches(.65)
sec.left_margin, sec.right_margin = Inches(.85), Inches(.85)
sec.header_distance, sec.footer_distance = Inches(.3), Inches(.3)
WIDTH = 6.8

def fonts(style, size, bold=False, east="宋体"):
    style.font.name = "Calibri"
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.italic = False
    style.font.color.rgb = RGBColor(0, 0, 0)
    rf = style.element.get_or_add_rPr().get_or_add_rFonts()
    rf.set(qn("w:eastAsia"), east)
    rf.set(qn("w:ascii"), "Calibri")
    rf.set(qn("w:hAnsi"), "Calibri")

fonts(doc.styles["Normal"], 11)
normal = doc.styles["Normal"].paragraph_format
normal.line_spacing = 1.15
normal.space_after = Pt(4)
normal.widow_control = True
for st, size in [("Title", 20), ("Subtitle", 10), ("Heading 1", 16), ("Heading 2", 12), ("Heading 3", 11)]:
    fonts(doc.styles[st], size, st != "Subtitle", "微软雅黑")
    pf = doc.styles[st].paragraph_format
    pf.space_before, pf.space_after = Pt(8 if st != "Title" else 0), Pt(4)
    pf.keep_with_next = True
for st in ["List Bullet", "List Number"]:
    fonts(doc.styles[st], 11)
    doc.styles[st].paragraph_format.space_after = Pt(4)
    doc.styles[st].paragraph_format.line_spacing = 1.15
for st in ["Caption", "Header", "Footer"]:
    fonts(doc.styles[st], 9)
for style in doc.styles:
    for border in list(style.element.iter(qn('w:pBdr'))):
        border.getparent().remove(border)
doc.core_properties.title = "三位教师简历与照片核验稿"
doc.core_properties.subject = "河南大学集成电路与微纳电子学院官网师资资料人工核验"
doc.core_properties.author = "网站建设资料整理"
doc.core_properties.keywords = "张锦龙 郑海务 程纲 人工核验"
doc.core_properties.created = datetime(2026, 10, 11, tzinfo=timezone.utc)
doc.core_properties.modified = datetime(2026, 10, 11, tzinfo=timezone.utc)

header = sec.header.paragraphs[0]
header.text = "学院官网师资资料    人工核验稿"
header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.add_run("第 ")
for kind in ["PAGE", "NUMPAGES"]:
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), kind)
    footer._p.append(fld)
    footer.add_run(" 页 / 共 " if kind == "PAGE" else " 页")

def hyperlink(p, label, url):
    rel = p.part.relate_to(url, RT.HYPERLINK, is_external=True)
    h = OxmlElement("w:hyperlink")
    h.set(qn("r:id"), rel)
    r = OxmlElement("w:r")
    prop = OxmlElement("w:rPr")
    color = OxmlElement("w:color"); color.set(qn("w:val"), "24527A"); prop.append(color)
    underline = OxmlElement("w:u"); underline.set(qn("w:val"), "single"); prop.append(underline)
    r.append(prop)
    t = OxmlElement("w:t"); t.text = label; r.append(t)
    h.append(r); p._p.append(h)

def inline(p, text):
    text = text.replace("\\*", "\uE000").replace("<br>", "；")
    pattern = r"(\*\*.+?\*\*|\*[^*]+\*|`[^`]+`|<https?://[^>]+>)"
    for part in re.split(pattern, text):
        if not part:
            continue
        if part.startswith("<http"):
            hyperlink(p, part[1:-1], part[1:-1])
            continue
        bold = part.startswith("**") and part.endswith("**")
        italic = not bold and part.startswith("*") and part.endswith("*")
        if bold: part = part[2:-2]
        elif italic: part = part[1:-1]
        elif part.startswith("`"): part = part[1:-1]
        run = p.add_run(part.replace("\uE000", "*"))
        run.bold, run.italic = bold, italic

def paragraph(text, style=None):
    p = doc.add_paragraph(style=style)
    inline(p, text)
    return p

def small(text):
    p = paragraph(text)
    p.paragraph_format.space_after = Pt(4)
    for r in p.runs: r.font.size = Pt(9)
    return p

def table(rows, widths):
    t = doc.add_table(rows=0, cols=len(widths))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for col, w in zip(t.columns, widths): col.width = Inches(w)
    pr = t._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ["top", "left", "bottom", "right", "insideH", "insideV"]:
        b = OxmlElement("w:" + edge)
        for k, v in {"val":"single", "sz":"4", "color":"D9D9D9"}.items(): b.set(qn("w:"+k),v)
        borders.append(b)
    pr.append(borders)
    margins = OxmlElement("w:tblCellMar")
    for edge, val in [("top",85),("bottom",85),("left",110),("right",110)]:
        x=OxmlElement("w:"+edge);x.set(qn("w:w"),str(val));x.set(qn("w:type"),"dxa");margins.append(x)
    pr.append(margins)
    for i, row_values in enumerate(rows):
        row = t.add_row()
        trpr = row._tr.get_or_add_trPr()
        trpr.append(OxmlElement("w:cantSplit"))
        if i == 0: trpr.append(OxmlElement("w:tblHeader"))
        for j, (cell,value) in enumerate(zip(row.cells,row_values)):
            cell.width = Inches(widths[j])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if i==0:
                shd=OxmlElement("w:shd");shd.set(qn("w:fill"),"EAF0F5");cell._tc.get_or_add_tcPr().append(shd)
            p=cell.paragraphs[0]
            p.paragraph_format.space_after=Pt(0)
            p.paragraph_format.line_spacing=1.1
            if j==0 and len(value)<12: p.alignment=WD_ALIGN_PARAGRAPH.CENTER
            inline(p,value)
            for r in p.runs:
                r.font.size=Pt(10.5)
                if i==0:r.bold=True
    return t

def markdown_block(block):
    lines=block.strip().splitlines()
    i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line or line=="---":i+=1;continue
        if line.startswith("### "):
            title=line[4:].replace("（页面所列 8 篇）", "").replace("（页面所列）", "")
            if title=="近三年论文": title="源页面所列论文"
            heading=doc.add_heading(title,level=2)
            if title=="学术团体任职":heading.paragraph_format.page_break_before=True
            i+=1;continue
        if line.startswith("| "):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith("|"):
                vals=[x.strip() for x in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r"[:\- ]+",x) for x in vals) and vals[0]!="照片":rows.append(vals)
                i+=1
            if len(rows[0])==2: widths=[1.15,5.65]
            else: widths=[1.65,2.0,2.3,.85] if rows[0][0]=="时间" else [1.5,2.55,.7,2.05]
            table(rows,widths);continue
        if line.startswith("> "):
            small("整理说明："+line[2:]);i+=1;continue
        if line.startswith("- "):
            paragraph(line[2:],"List Bullet");i+=1;continue
        if re.match(r"\d+\. ",line):
            # Preserve explicit local numbering independently for each list.
            p=paragraph(line)
            p.paragraph_format.left_indent=Inches(.2)
            p.paragraph_format.first_line_indent=Inches(-.2)
            i+=1;continue
        paragraph(line);i+=1

people=[
    dict(name="张锦龙",marker="一",image="张锦龙.png",source="https://phye.henu.edu.cn/info/1159/5480.htm",label="河南大学物理与电子学院教师页面",photo_source="https://www.htu.edu.cn/_upload/article/images/44/44/ba7721354183975ba0bb6268ba5e/1f686a46-53c1-4696-bcd9-6c337ff87c0c.png",photo_label="河南师范大学讲座新闻所用照片原图",notes=[
        "确认是否列入学院首批师资名单，以及现职称、导师资格、职务和所属单位。",
        "联系电话来自旧资料，请确认号码是否有效、是否允许在官网公开；出生年月、政治面貌是否保留也请确认。",
        "现有照片为180×254像素，来自外校讲座新闻；请确认照片身份及使用许可，并补充高清原图。",
        "论文数、专利数、项目数及人才称号需核对最新口径；论文列表涵盖2021—2024年，不视为截至2026年的近三年清单。",
        "底稿记录源页面有一处小节标题图片缺失，本次未恢复该内容。"]),
    dict(name="郑海务",marker="二",image="郑海务.jpg",source="https://phye.henu.edu.cn/info/1159/5688.htm",label="河南大学物理与电子学院教师页面",photo_source="https://phye.henu.edu.cn/__local/A/7F/E1/70C818DBC5FC00ADD7406B0A964_A5600DA8_5AA4.jpg",photo_label="河南大学教师页面照片原图",notes=[
        "确认是否列入学院首批师资名单，以及现职称、导师资格、各项职务及任职期限。",
        "确认研究方向、招生专业和招生要求是否仍适用；个人课题组设备与招生信息不自动等同于新学院配置。",
        "项目数量、在研状态、论文专利与获奖数量，以及2022—2024年全球前2%科学家表述需核验。",
        "照片为295×413像素，请确认可以使用；有高清原图时建议替换，并确认官网公开哪些邮箱。"]),
    dict(name="程纲",marker="三",image="程纲.jpg",source="https://lab.henu.edu.cn/zw/ktz/c_g_Cheng_G/ktzzjj.htm",label="河南大学纳米科学与材料工程学院程纲课题组长简介",photo_source="https://lab.henu.edu.cn/info/1053/1082.htm",photo_label="河南大学纳米科学与材料工程学院高层次人才页面",notes=[
        "确认是否列入学院首批师资名单，以及现职称、导师资格、所属单位与对外展示的职务。",
        "原底稿记载“2003—至今，教授”，任教起点和教授任职起点可能不同，请核对完整职务时间线。",
        "请提供或确认独立的个人简介、当前研究方向、主讲课程及招生信息；现有个人分节未完整收录这些内容。",
        "确认人才称号、获奖名称、年份和论文信息。第6篇英文标题曾由底稿修正拼写，请对照原文核验。",
        "照片为4091×4091像素，已有高清原图，请确认可以用于学院官网；网站用图可另行压缩。"]),
]

doc.add_paragraph("三位教师简历与照片核验稿", "Title")
doc.add_paragraph("张锦龙  郑海务  程纲    整理日期 2026年10月11日", "Subtitle")
paragraph("本稿供学院网站建设人员及教师本人核对。内容依据项目现有《教师简历汇总》及照片整理，保留已收录的教育经历、教学科研、荣誉和论文条目，并附来源链接和逐人核验项。")
paragraph("资料底稿标记采集日期为2026年10月9日。本次为本地材料整理，未重新联网核验；名单、现职称、数据时效和公开范围均待确认。文中源单位及个人研究信息不自动视为新学院的正式师资归属或学院介绍。")

for idx,person in enumerate(people):
    heading=doc.add_heading(person["name"],level=1)
    if idx:heading.paragraph_format.page_break_before=True
    p=doc.add_paragraph()
    p.add_run("简历来源：")
    hyperlink(p,person["label"],person["source"])
    if idx<2:small("底稿记录页面发布日期为2015年6月4日；该日期不代表页面内容最近更新时间。")
    picp=doc.add_paragraph()
    picp.alignment=WD_ALIGN_PARAGRAPH.CENTER
    path=DOCS/"assets"/"teachers"/person["image"]
    im=Image.open(path)
    w,h=im.size
    pic=picp.add_run().add_picture(str(path),height=Inches(1.15))
    pic._inline.docPr.set("descr",person["name"]+"现有照片，供人工核验")
    picp.paragraph_format.keep_with_next=True
    cp=small(f"{person['name']}现有照片    原图 {w}×{h} 像素    未作修复或补绘")
    cp.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p=doc.add_paragraph()
    p.add_run("照片来源：")
    hyperlink(p,person["photo_label"],person["photo_source"])
    start=f"## {person['marker']}、{person['name']}"
    section=source_text.split(start,1)[1].split("\n## ",1)[0]
    section=section[section.index("### 基本信息"):].strip()
    markdown_block(section)

heading=doc.add_heading("人工核验记录",level=1)
heading.paragraph_format.page_break_before=True
paragraph("请逐人填写核验结论，并在本稿相应位置直接修改或批注。结论可填写“可按本稿展示”“修改后展示”或“暂不展示”。")
doc.add_heading("三位教师共同需要确认的事项",level=2)
for note in [
    "是否属于学院首批展示名单，现职称、导师资格、职务和所属单位是否准确。",
    "简历、研究方向、教学招生、荣誉、论文专利和项目数据是否需要更新；“至今”“在研”等表述按当前情况核对。",
    "照片是否可以用于学院官网，邮箱、电话及其他个人信息哪些可以公开。",
]:paragraph(note,"List Bullet")
doc.add_heading("逐人补充核验",level=2)
table([
    ["姓名","需特别核对或补充","核验结论"],
    ["张锦龙","180×254像素照片来自外校讲座新闻，建议补高清原图。确认手机号、出生年月和政治面貌是否公开。所列论文为2021—2024年，不能视为截至2026年的近三年清单。","________________\n\n________________"],
    ["郑海务","295×413像素照片建议补高清原图。核对各项任职、项目在研状态、2022—2024年全球前2%科学家表述，以及招生专业和要求是否仍适用。","________________\n\n________________"],
    ["程纲","已有4091×4091像素高清照片。核对“2003—至今，教授”的职务时间线；补充或确认个人简介、当前研究方向、课程与招生信息。核对第6篇论文英文标题的拼写修正。","________________\n\n________________"],
], [.75,4.35,1.7])
p=paragraph("核验人：________________    核验日期：________________")
p.paragraph_format.space_before=Pt(6)
paragraph("补充修改意见：____________________________________________________")
paragraph("__________________________________________________________________")
doc.add_heading("材料来源与整理说明",level=2)
small("文字依据为docs/教师简历汇总.md；照片及源网页存档位于docs/assets/teachers/。本稿完整保留三个个人分节的已收录履历内容，未将跨教师概括和建站建议新增为个人事实。仅将“近三年论文”改称“源页面所列论文”，并保留底稿对程纲第6篇论文拼写修正的说明。")
doc.save(OUTPUT)

# Package-level checks prevent accidental omission during conversion.
from zipfile import ZipFile
from lxml import etree
with ZipFile(OUTPUT) as z:
    body=etree.fromstring(z.read("word/document.xml"))
    texts=body.xpath("//w:t/text()",namespaces={"w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"})
    full="\n".join(texts)
    assert len([n for n in z.namelist() if n.startswith("word/media/")])==3
    for name in ["张锦龙","郑海务","程纲"]:assert name in full
    for phrase in ["7383-7391","104210","博士生导师","135-6950-9930"]:assert phrase in full
    assert "�" not in full
    def normalize(s):
        return re.sub(r"\s+", "", s.replace("\\*", "*").replace("*", "").replace("`", "").replace("<", "").replace(">", ""))
    compact=normalize(full)
    count=0
    for person in people:
        section=source_text.split(f"## {person['marker']}、{person['name']}",1)[1].split("\n## ",1)[0]
        section=section[section.index("### 基本信息"):]
        for line in section.splitlines():
            line=line.strip()
            if not line or line.startswith("#") or line=="---":continue
            if line.startswith("|"):
                cells=[x.strip() for x in line.strip("|").split("|")]
                if cells[0]=="照片" or all(re.fullmatch(r"[:\- ]+",c) for c in cells):continue
                parts=cells
            else:
                parts=[re.sub(r"^(?:- |> |\d+\. )", "", line)]
            for part in parts:
                assert normalize(part) in compact, f"Missing source content: {part}"
                count+=1
    print(f"Source content fragments verified: {count}")
print(OUTPUT)
print("Embedded photos: 3; source profile sections preserved; package checks passed")
