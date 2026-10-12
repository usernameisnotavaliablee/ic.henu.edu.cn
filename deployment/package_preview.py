"""只打包运行必需的白名单；数据库、密钥、素材底稿和环境不进部署包。

包内保持仓库顶层布局（frontend/、backend/、deployment/），
解压到 /srv/ic-college/releases/<版本>/ 后即可直接运行。
"""
from pathlib import Path
import argparse
import hashlib
import json
import tarfile
from release_assets import validate_fonts

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true', help='只检查待打包资源，不覆盖已有部署包')
args = parser.parse_args()
REPO = Path(__file__).resolve().parent.parent
required_font_files = validate_fonts(REPO)
output = REPO / 'sandbox' / 'deploy'
output.mkdir(parents=True, exist_ok=True)
files = []
for folder in ['frontend/preview', 'frontend/licenses', 'backend', 'deployment']:
    for file in (REPO / folder).rglob('*'):
        if not file.is_file() or '__pycache__' in file.parts:
            continue
        if file.is_symlink():
            raise RuntimeError(f'部署包不跟随符号链接：{file.name}')
        if file.name in {'requirements.txt', 'requirements.lock', 'seed-content.json', 'content-catalog.json', 'preview.env.example', 'public.env.example'} or file.suffix in {'.py', '.html', '.css', '.js', '.svg', '.jpg', '.png', '.txt', '.service', '.woff2', '.ttf'}:
            files.append(file)
if not set(required_font_files).issubset(files):
    raise RuntimeError('字体、许可证或清单未被运行包白名单包含，停止打包。')
if args.check:
    print(f'打包预检通过：{len(files)}个运行文件；字体产物、许可证和清单一致。未生成或覆盖部署包。')
    raise SystemExit(0)
package = output / 'ic-preview.tar.gz'
arcnames = {file: file.relative_to(REPO).as_posix() for file in files}
with tarfile.open(package, 'w:gz') as tar:
    for file in sorted(files):
        tar.add(file, arcname=arcnames[file], recursive=False)
manifest = {'file_count': len(files), 'sha256': hashlib.sha256(package.read_bytes()).hexdigest(),
            'files': [arcnames[file] for file in sorted(files)]}
(output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'隔离部署包已创建：{len(files)} 个文件；不含数据库和凭据。')
