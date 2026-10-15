"""Export the complete maintained project, without Git history or local runtime data."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
TOP_FILES = {'.gitignore', '.gitattributes', 'README.md', 'STATUS.md', 'DESIGN.md', 'sandbox/README.md'}
NEW_FILES = {'docs/README.md', 'docs/完整源码与部署指引.md', 'deployment/package_source.py',
             'frontend/scripts/build-layout-examples.py', 'frontend/qa/README.md',
             'docs/内部资料/完整源码交付核验_20261015.json'}
NEW_DIRS = ('frontend/examples/', 'frontend/scripts/archive/', 'docs/归档不再看/历史版本/目录整理前_20261015/')

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args]).decode('utf-8')

def export(output):
    output = Path(output).resolve()
    if not output.is_relative_to(ROOT / 'sandbox') or output.suffix != '.zip':
        raise ValueError('Output must be a .zip under this repository sandbox')
    if output.exists() or output.with_suffix('.zip.sha256').exists():
        raise FileExistsError('Existing export will not be overwritten: ' + str(output))
    names = set(git('ls-files', '-z').split('\0')) - {''}
    names.update(NEW_FILES)
    for directory in NEW_DIRS:
        names.update(file.relative_to(ROOT).as_posix() for file in (ROOT / directory).rglob('*') if file.is_file())
    files = []
    for name in sorted(names):
        file = ROOT / name
        if not file.exists():  # tracked old paths that were deliberately archived
            continue
        if name not in TOP_FILES and not name.startswith(('frontend/', 'backend/', 'deployment/', 'docs/')):
            continue
        if file.is_symlink() or not file.resolve().is_relative_to(ROOT):
            raise ValueError('Symlink/outside path: ' + name)
        if any(p in {'.git', '.venv', 'venv', 'node_modules', '__pycache__', 'uploads'} for p in file.parts):
            raise ValueError('Runtime directory: ' + name)
        example = name.endswith('.example')
        if (file.suffix.lower() in {'.sqlite', '.sqlite3', '.db', '.key', '.pem', '.pfx', '.p12', '.log', '.pyc'}
            or (not example and (file.name == '.env' or file.name.endswith('.env') or file.name.startswith('.env.')))
            or file.name.startswith(('id_rsa', 'id_ed25519', 'access.txt'))):
            raise ValueError('Private/runtime file: ' + name)
        files.append(file)
    required = ['frontend/src/data/site.js', 'frontend/scripts/build-site.js', 'frontend/preview/index.html',
                'frontend/licenses/zhuangsong-manifest.txt', 'backend/manage.py', 'backend/requirements.lock',
                'deployment/package_preview.py', 'docs/assets/fonts/新愚公装甲宋A.ttf', 'docs/完整源码与部署指引.md']
    included = {f.relative_to(ROOT).as_posix() for f in files}
    assert set(required) <= included, 'Missing build/runtime requirements'
    manifest = {'base_commit':git('rev-parse', 'HEAD').strip(), 'branch':git('branch', '--show-current').strip(),
                'scope':'Full source, static output, Django, deployment tools and documentation; no business data or credentials',
                'includes_working_tree_changes':bool(git('status', '--porcelain', '--untracked-files=no').strip()),
                'files':[{'path':f.relative_to(ROOT).as_posix(), 'bytes':f.stat().st_size,
                          'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in files]}
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
        for file in files:
            archive.write(file, 'ic-college/' + file.relative_to(ROOT).as_posix())
        archive.writestr('ic-college/PACKAGE-MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        for item in manifest['files']:
            assert hashlib.sha256(archive.read('ic-college/' + item['path'])).hexdigest() == item['sha256']
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix('.zip.sha256').write_text(digest + '  ' + output.name + '\n', encoding='utf-8')
    print(json.dumps({'path':str(output), 'files':len(files), 'bytes':output.stat().st_size, 'sha256':digest}, ensure_ascii=False))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    export(parser.parse_args().output)
