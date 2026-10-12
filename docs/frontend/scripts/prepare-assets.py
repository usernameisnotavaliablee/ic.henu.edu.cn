"""从已归档素材生成网页副本，不覆盖原图；使用现有 Pillow。"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[3]
DEST = ROOT / 'docs/frontend/src/assets'
REFERENCE = ROOT / 'docs/内部资料/参考源码/低空学院/src/assets'
JOBS = [
    (REFERENCE / 'henu-logo-clean.png', 'henu-logo.png', (160, 160)),
    (REFERENCE / 'campus-gate-2026.jpg', 'campus-gate.jpg', (1440, 810)),
    (ROOT / 'docs/assets/teachers/张锦龙.png', 'teacher-zhang.jpg', (400, 520)),
    (ROOT / 'docs/assets/teachers/郑海务.jpg', 'teacher-zheng.jpg', (400, 520)),
    (ROOT / 'docs/assets/teachers/程纲.jpg', 'teacher-cheng.jpg', (400, 520)),
]
DEST.mkdir(parents=True, exist_ok=True)
for source, filename, size in JOBS:
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail(size, Image.Resampling.LANCZOS)
        image.save(DEST / filename, optimize=True, **({'quality': 88} if filename.endswith('.jpg') else {}))
        print(filename, image.size)
