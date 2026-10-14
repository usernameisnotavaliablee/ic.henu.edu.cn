"""检查运行包真正使用的资源，不要求服务器携带 frontend/src。"""
import hashlib
import json
from pathlib import Path


def validate_fonts(docs):
    frontend = Path(docs) / 'frontend'
    manifest = frontend / 'licenses' / 'zhuangsong-manifest.txt'
    if not manifest.is_file():
        raise ValueError('缺少字体清单；请先准备字体，再重新构建前端。')
    info = json.loads(manifest.read_text(encoding='utf-8'))
    files = info.get('files', {})
    required = {'src/css/fonts.css', 'licenses/XinYuGongZhangJiaSongA-OFL.txt'}
    font_files = [name for name in files if name.startswith('src/assets/ic-zhuangsong-headings-') and Path(name).suffix in {'.ttf', '.woff2'}]
    if not required.issubset(files) or not font_files:
        raise ValueError('字体清单不完整：需要字体文件、fonts.css和许可证。')
    checked = [manifest]
    for relative, digest in files.items():
        # 清单由素材准备脚本生成；打包验证对应的运行目录副本。
        deployed = 'preview/' + relative[4:] if relative.startswith('src/') else relative
        file = frontend / deployed
        if not file.resolve().is_relative_to(frontend.resolve()):
            raise ValueError('字体清单包含运行目录外路径。')
        if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest() != digest:
            raise ValueError(f'运行字体资源缺失或与清单不一致：{deployed}。请重新运行 build-site.js，不能打包旧产物。')
        checked.append(file)
    if '@font-face' not in (frontend / 'preview/css/fonts.css').read_text(encoding='utf-8'):
        raise ValueError('运行目录中的fonts.css仍是占位文件，不能打包。')
    return checked


def validate_showcase_images(docs, records):
    assets = Path(docs) / 'frontend' / 'preview' / 'assets'
    for record in records:
        file = assets / record['image']
        if not file.is_file():
            raise ValueError(f'演示配图未构建到运行目录：{record["image"]}（{record["slug"]}）')
