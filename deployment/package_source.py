"""Export the complete maintained project, without Git history or local runtime data."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
TOP_FILES = {'.gitignore', '.gitattributes', 'README.md', 'STATUS.md', 'DESIGN.md',
             'sandbox/README.md'}
# Current handoff additions may not be tracked yet; archived migration exceptions are tracked.
NEW_FILES = {'deployment/test_package_source.py', 'docs/内部资料/本机交付验收_20261018.json',
             'docs/后端交付文档_博达接入与预览部署.md'}
REQUIRED_FILES = {
    'docs/后端交付文档_博达接入与预览部署.md', 'docs/README.md', 'docs/归档不再看/README.md',
    'frontend/README.md', 'frontend/CONTRACTS.md', 'frontend/CONTENT-MAINTENANCE.md',
    'frontend/BODA-HANDOFF.md', 'frontend/src/data/site.js', 'frontend/scripts/build-site.js',
    'frontend/build-manifest.json', 'frontend/preview/index.html',
    'frontend/licenses/zhuangsong-manifest.txt', 'frontend/licenses/XinYuGongZhangJiaSongA-OFL.txt',
    'frontend/licenses/magicui-MIT.txt', 'frontend/licenses/uiverse-mit.txt',
    'backend/manage.py', 'backend/requirements.lock', 'backend/templates/site/generated/frame.html',
    'deployment/package_preview.py', 'docs/assets/fonts/新愚公装甲宋A.ttf',
}
RUNTIME_DIRS = {'.git', '.venv', 'venv', 'node_modules', '__pycache__', 'uploads',
                '.cache', '.pytest_cache', '.mypy_cache', '.ruff_cache', '.tox', '.nox',
                'logs', 'backups'}

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
    files = []
    for name in sorted(names):
        file = ROOT / name
        if name not in TOP_FILES and not name.startswith(('frontend/', 'backend/', 'deployment/', 'docs/')):
            continue
        if file.is_symlink() or not file.resolve().is_relative_to(ROOT):
            raise ValueError('Symlink/outside path: ' + name)
        if not file.exists():  # tracked old paths that were deliberately archived
            continue
        if not file.is_file():
            raise ValueError('Not a regular file: ' + name)
        parts = file.relative_to(ROOT).parts
        if any(p.lower() in RUNTIME_DIRS for p in parts) or name.startswith('backend/media/'):
            raise ValueError('Runtime directory: ' + name)
        filename = file.name.lower()
        example = filename.endswith('.example')
        database = any(filename.endswith(ext) or ext + '-' in filename
                       for ext in ('.sqlite', '.sqlite3', '.db'))
        if (database or file.suffix.lower() in {'.key', '.pem', '.pfx', '.p12', '.log', '.pyc', '.pyo', '.bak'}
            or '.log.' in filename or filename == '.ds_store'
            or (not example and (filename == '.env' or filename.endswith('.env') or filename.startswith('.env.')))
            or filename.startswith(('id_rsa', 'id_ed25519', 'id_ecdsa', 'access.txt'))):
            raise ValueError('Private/runtime file: ' + name)
        files.append(file)
    included = {f.relative_to(ROOT).as_posix() for f in files}
    missing = sorted(REQUIRED_FILES - included)
    if missing:
        raise ValueError('Missing build/runtime requirements: ' + ', '.join(missing))
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
        corrupt = archive.testzip()
        if corrupt is not None:
            raise ValueError('Corrupt archive member: ' + corrupt)
        for item in manifest['files']:
            data = archive.read('ic-college/' + item['path'])
            if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
                raise ValueError('Archive content changed: ' + item['path'])
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix('.zip.sha256').write_text(digest + '  ' + output.name + '\n', encoding='utf-8')
    print(json.dumps({'path':str(output), 'files':len(files), 'bytes':output.stat().st_size, 'sha256':digest}, ensure_ascii=False))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    export(parser.parse_args().output)
