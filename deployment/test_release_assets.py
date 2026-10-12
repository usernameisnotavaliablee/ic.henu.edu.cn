"""离线回归：漏构建、缺字体/许可证与只存在源码配图时必须阻止验收。"""
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from release_assets import validate_fonts, validate_showcase_images

DOCS = Path(__file__).resolve().parents[1]


class ReleaseAssetTests(unittest.TestCase):
    def setUp(self):
        temporary_root = DOCS / 'sandbox' / 'tmp'
        temporary_root.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temporary_root)
        if not Path(self.temp.name).resolve().is_relative_to(temporary_root.resolve()):
            raise RuntimeError('临时测试目录越出工作区，停止操作。')
        self.addCleanup(self.temp.cleanup)
        self.docs = Path(self.temp.name) / 'docs'
        self.frontend = self.docs / 'frontend'
        self.manifest_path = self.frontend / 'licenses/lxgw-wenkai-manifest.txt'
        self.info = json.loads((DOCS / 'frontend/licenses/lxgw-wenkai-manifest.txt').read_text(encoding='utf-8'))
        for relative in ['licenses/lxgw-wenkai-manifest.txt', *self.info['files']]:
            runtime_path = 'preview/' + relative[4:] if relative.startswith('src/') else relative
            target = self.frontend / runtime_path
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(DOCS / 'frontend' / runtime_path, target)

    def test_valid_runtime_does_not_require_sources(self):
        self.assertFalse((self.frontend / 'src').exists())
        checked = validate_fonts(self.docs)
        self.assertEqual(len(checked), len(self.info['files']) + 1)

    def test_missing_manifest_is_rejected(self):
        self.manifest_path.unlink()
        with self.assertRaisesRegex(ValueError, '缺少字体清单'):
            validate_fonts(self.docs)

    def test_stale_or_placeholder_built_css_is_rejected(self):
        (self.frontend / 'preview/css/fonts.css').write_text('/* placeholder */', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, '运行字体资源缺失或与清单不一致'):
            validate_fonts(self.docs)

    def test_missing_font_and_license_are_rejected(self):
        for relative in self.info['files']:
            if relative == 'src/css/fonts.css':
                continue
            runtime_path = 'preview/' + relative[4:] if relative.startswith('src/') else relative
            file = self.frontend / runtime_path
            data = file.read_bytes()
            file.unlink()
            with self.assertRaises(ValueError):
                validate_fonts(self.docs)
            file.write_bytes(data)

    def test_tampered_font_is_rejected(self):
        font = next((self.frontend / 'preview/assets').glob('ic-kai-headings-*'))
        font.write_bytes(font.read_bytes() + b'changed')
        with self.assertRaises(ValueError):
            validate_fonts(self.docs)

    def test_self_consistent_placeholder_manifest_is_rejected(self):
        data = b'/* placeholder */'
        (self.frontend / 'preview/css/fonts.css').write_bytes(data)
        self.info['files']['src/css/fonts.css'] = hashlib.sha256(data).hexdigest()
        self.manifest_path.write_text(json.dumps(self.info), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, '占位文件'):
            validate_fonts(self.docs)

    def test_source_only_image_is_rejected_until_built(self):
        source = self.frontend / 'src/assets/demo.jpg'
        source.parent.mkdir(parents=True)
        source.write_bytes(b'fixture-image')
        records = [{'slug': 'news-test', 'image': 'demo.jpg'}]
        with self.assertRaisesRegex(ValueError, '未构建到运行目录'):
            validate_showcase_images(self.docs, records)
        shutil.copyfile(source, self.frontend / 'preview/assets/demo.jpg')
        validate_showcase_images(self.docs, records)


if __name__ == '__main__':
    unittest.main()
