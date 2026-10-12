"""从已归档素材生成网页副本，不覆盖原图；使用现有 Pillow。"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]  # 仓库根目录（frontend/scripts/ 往上两级）
DEST = ROOT / 'frontend/src/assets'
REFERENCE = ROOT / 'docs/内部资料/参考源码/低空学院/src/assets'
JOBS = [
    (ROOT / 'docs/assets/site-media/oscilloscope-waveform.jpg', 'oscilloscope-waveform.jpg', (1400, 1000)),
    (ROOT / 'docs/assets/site-media/microscopy-instruments.jpg', 'microscopy-instruments.jpg', (1400, 1000)),
    (ROOT / 'docs/assets/网站工作室.png', 'web-studio.png', (180, 180)),
    (REFERENCE / 'henu-logo-clean.png', 'henu-logo.png', (160, 160)),
    (REFERENCE / 'campus-gate-2026.jpg', 'campus-gate.jpg', (1440, 810)),
    (REFERENCE / 'faculty-hero-campus.png', 'campus-landscape.jpg', (1600, 1000)),
    (REFERENCE / 'contact-hero-cropped.png', 'campus-courtyard.jpg', (1600, 1000)),
    (REFERENCE / 'kechuang-xilou.jpg', 'campus-building.jpg', (1600, 1000)),
    (ROOT / 'docs/assets/site-media/wafer-closeup.jpg', 'wafer-closeup.jpg', (1600, 1200)),
    (ROOT / 'docs/assets/site-media/wafer-12inch.jpg', 'wafer-12inch.jpg', (1000, 1000)),
    (ROOT / 'docs/assets/site-media/cleanroom-lcn.jpg', 'cleanroom-lcn.jpg', (1400, 1000)),
    (ROOT / 'docs/assets/site-media/wafer-display.jpg', 'wafer-display.jpg', (1400, 1000)),
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
