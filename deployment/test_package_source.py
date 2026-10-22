"""Small source-package regression using synthetic files only, never the user's database."""
from contextlib import redirect_stdout
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock
import zipfile

import package_source

REPO = Path(__file__).resolve().parents[1]
MAIN_DOC = 'docs/后端交付文档_博达接入与预览部署.md'
NEW_TEST = 'deployment/test_package_source.py'
NEW_REPORT = 'docs/内部资料/本机交付验收_20261018.json'
FIXTURE_FILES = {
    '.gitignore', '.gitattributes', 'README.md', 'STATUS.md', 'DESIGN.md', MAIN_DOC,
    'docs/README.md', 'docs/归档不再看/README.md',
    'docs/归档不再看/后端交付旧文档/完整源码与部署指引.md',
    'docs/assets/fonts/新愚公装甲宋A.ttf',
    'frontend/README.md', 'frontend/CONTRACTS.md', 'frontend/CONTENT-MAINTENANCE.md',
    'frontend/BODA-HANDOFF.md', 'frontend/src/data/site.js', 'frontend/scripts/build-site.js',
    'frontend/build-manifest.json', 'frontend/preview/index.html',
    'frontend/licenses/zhuangsong-manifest.txt', 'frontend/licenses/XinYuGongZhangJiaSongA-OFL.txt',
    'frontend/licenses/magicui-MIT.txt', 'frontend/licenses/uiverse-mit.txt',
    'frontend/examples/README.md', 'frontend/scripts/archive/README.md',
    'backend/manage.py', 'backend/requirements.lock', 'backend/templates/site/generated/frame.html',
    'deployment/package_source.py', 'deployment/package_preview.py',
    'deployment/preview.env.example', NEW_TEST, NEW_REPORT, 'sandbox/README.md',
}


class SourcePackageTests(unittest.TestCase):
    def setUp(self):
        temporary_root = REPO / 'sandbox' / 'tmp'
        temporary_root.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(prefix='source-package-test-', dir=temporary_root)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.assertTrue(self.root.is_relative_to(temporary_root.resolve()))
        self.tracked = FIXTURE_FILES - {NEW_TEST, NEW_REPORT, MAIN_DOC}
        for name in FIXTURE_FILES | {'AGENTS.md', 'sandbox/private.sqlite3'}:
            self.write_fixture(name)
        self.tracked |= {'AGENTS.md', 'sandbox/private.sqlite3'}
        root_patch = mock.patch.object(package_source, 'ROOT', self.root)
        git_patch = mock.patch.object(package_source, 'git', side_effect=self.fixture_git)
        root_patch.start()
        git_patch.start()
        self.addCleanup(root_patch.stop)
        self.addCleanup(git_patch.stop)
        self.output = self.root / 'sandbox' / 'tmp' / 'fixture.zip'

    def write_fixture(self, name):
        target = self.root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(('synthetic fixture: ' + name + '\n').encode('utf-8'))
        return target

    def fixture_git(self, *args):
        if args == ('ls-files', '-z'):
            return '\0'.join(sorted(self.tracked)) + '\0'
        return {
            ('rev-parse', 'HEAD'): '0' * 40 + '\n',
            ('branch', '--show-current'): 'fixture\n',
            ('status', '--porcelain', '--untracked-files=no'): ' M deployment/package_source.py\n',
        }[args]

    def export(self, output=None):
        with redirect_stdout(io.StringIO()) as stdout:
            package_source.export(output or self.output)
        return json.loads(stdout.getvalue())

    def test_current_delivery_and_untracked_additions_have_verifiable_hashes(self):
        self.assertNotIn(NEW_TEST, self.tracked)
        self.assertNotIn(NEW_REPORT, self.tracked)
        self.assertNotIn(MAIN_DOC, self.tracked)
        result = self.export()
        with zipfile.ZipFile(self.output) as archive:
            self.assertIsNone(archive.testzip())
            manifest = json.loads(archive.read('ic-college/PACKAGE-MANIFEST.json'))
            paths = {item['path'] for item in manifest['files']}
            self.assertEqual(paths, FIXTURE_FILES)
            self.assertNotIn('docs/完整源码与部署指引.md', paths)
            self.assertNotIn('后端交付文档_博达接入与预览部署.md', paths)
            self.assertEqual(set(archive.namelist()),
                             {'ic-college/' + name for name in paths} | {'ic-college/PACKAGE-MANIFEST.json'})
            for item in manifest['files']:
                data = archive.read('ic-college/' + item['path'])
                self.assertEqual(data, (self.root / item['path']).read_bytes())
                self.assertEqual(len(data), item['bytes'])
                self.assertEqual(hashlib.sha256(data).hexdigest(), item['sha256'])
        digest = hashlib.sha256(self.output.read_bytes()).hexdigest()
        self.assertEqual(self.output.with_suffix('.zip.sha256').read_text(encoding='utf-8'),
                         digest + '  ' + self.output.name + '\n')
        self.assertEqual(result['sha256'], digest)
        self.assertEqual(result['files'], len(FIXTURE_FILES))

    def test_current_handoff_document_and_build_requirements_are_mandatory(self):
        for name in (MAIN_DOC, 'frontend/CONTRACTS.md', 'frontend/CONTENT-MAINTENANCE.md',
                     'frontend/BODA-HANDOFF.md', 'docs/归档不再看/README.md',
                     'backend/requirements.lock', 'frontend/licenses/XinYuGongZhangJiaSongA-OFL.txt',
                     'frontend/build-manifest.json', 'frontend/preview/index.html',
                     'backend/templates/site/generated/frame.html', 'docs/assets/fonts/新愚公装甲宋A.ttf'):
            with self.subTest(path=name):
                (self.root / name).unlink()
                try:
                    with self.assertRaises(ValueError) as raised:
                        self.export()
                    self.assertIn(name, str(raised.exception))
                    self.assertFalse(self.output.exists())
                finally:
                    self.write_fixture(name)

    def test_optional_handoff_report_may_be_absent(self):
        (self.root / NEW_REPORT).unlink()
        self.export()
        with zipfile.ZipFile(self.output) as archive:
            self.assertNotIn('ic-college/' + NEW_REPORT, archive.namelist())

    def test_tracked_sensitive_runtime_files_are_rejected_before_reading(self):
        names = (
            'backend/db.sqlite3', 'backend/db.sqlite3-wal', 'backend/db.sqlite3-shm',
            'backend/db.sqlite-journal', 'backend/state.db-journal', 'backend/.env',
            'deployment/private.env', 'deployment/.env.local', 'deployment/server.key',
            'deployment/server.pem', 'deployment/server.pfx', 'deployment/server.p12',
            'deployment/id_rsa', 'deployment/id_ed25519', 'deployment/id_ecdsa',
            'deployment/access.txt', 'backend/server.log', 'backend/server.log.1',
            'backend/private.bak', 'backend/__pycache__/module.pyc', 'backend/.venv/config.py',
            'backend/venv/config.py', 'frontend/node_modules/demo/index.js',
            'backend/.pytest_cache/cache', 'backend/.mypy_cache/cache', 'backend/.ruff_cache/cache',
            'docs/.cache/generated', 'backend/uploads/face.jpg', 'backend/media/face.jpg',
            'backend/logs/server.txt', 'backend/backups/data.json',
        )
        for name in names:
            with self.subTest(path=name):
                file = self.write_fixture(name)
                self.tracked.add(name)
                try:
                    with mock.patch.object(Path, 'read_bytes', side_effect=AssertionError('Private file read')):
                        with self.assertRaisesRegex(ValueError, 'Runtime directory|Private/runtime file'):
                            self.export()
                    self.assertFalse(self.output.exists())
                finally:
                    self.tracked.remove(name)
                    file.unlink()

    def test_output_stays_in_sandbox_and_never_overwrites(self):
        for target in (self.root / 'outside.zip', self.output.with_suffix('.tar')):
            with self.subTest(path=target):
                with self.assertRaisesRegex(ValueError, 'under this repository sandbox'):
                    self.export(target)
                self.assertFalse(target.exists())
        self.output.parent.mkdir(parents=True)
        for existing in (self.output, self.output.with_suffix('.zip.sha256')):
            with self.subTest(existing=existing):
                existing.write_bytes(b'keep existing output')
                try:
                    with self.assertRaises(FileExistsError):
                        self.export()
                    self.assertEqual(existing.read_bytes(), b'keep existing output')
                    self.assertFalse((self.output.with_suffix('.zip.sha256')
                                      if existing == self.output else self.output).exists())
                finally:
                    existing.unlink()


if __name__ == '__main__':
    unittest.main()
