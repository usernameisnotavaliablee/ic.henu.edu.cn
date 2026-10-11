from pathlib import Path
import json
import sys
import pypdfium2 as pdfium
from PIL import Image, ImageOps, ImageDraw
from pypdf import PdfReader

sys.stdout.reconfigure(encoding='utf-8')
docs = next(p for p in Path(__file__).resolve().parents if p.name=='docs')
folder = docs / (sys.argv[1] if len(sys.argv)>1 else '内部资料/排版检查/teacher-brief')
pdf_path = folder / 'teacher-review.pdf'
pdf = pdfium.PdfDocument(str(pdf_path))
reader = PdfReader(pdf_path)
records = []
thumbs = []
for i in range(len(pdf)):
    page = pdf[i]
    bitmap = page.render(scale=1.8)
    im = bitmap.to_pil()
    im.save(folder / f'page-{i+1}.png')
    thumb = ImageOps.contain(im.convert('RGB'), (390, 525))
    tile = Image.new('RGB', (410, 555), 'white')
    tile.paste(thumb, ((410-thumb.width)//2, 22))
    ImageDraw.Draw(tile).text((12, 5), f'Page {i+1}', fill='black')
    thumbs.append(tile)
    text = reader.pages[i].extract_text() or ''
    records.append({'page': i+1, 'characters':len(text), 'start':text[:160], 'end':text[-220:]})
    bitmap.close()
    page.close()
sheet = Image.new('RGB', (3*410, ((len(thumbs)+2)//3)*555), '#cccccc')
for i, tile in enumerate(thumbs):sheet.paste(tile, ((i%3)*410, (i//3)*555))
sheet.save(folder / 'contact-sheet.png')
(folder/'page-text-check.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
for item in records:print(json.dumps(item, ensure_ascii=False))
print(f'Pages rendered: {len(pdf)}')
pdf.close()
