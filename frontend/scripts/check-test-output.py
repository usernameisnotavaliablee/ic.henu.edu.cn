"""检查四个离线检查的输出位置；只用标准库，不构建、不连接业务库。"""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
NODE = shutil.which('node')
assert NODE, '需要已有 Node.js；本脚本不安装依赖'
SCRIPTS = [
    (sys.executable, 'check-current-structure.py', 'current-structure.json'),
    (NODE, 'check-header-motion.cjs', 'header-motion-unit.json'),
    (NODE, 'check-media-loading.cjs', 'media-loading-unit.json'),
    (NODE, 'check-page-transition.cjs', 'page-transition-unit.json'),
]
tracked = subprocess.check_output(['git', 'ls-files', '-z', '--', 'frontend/qa'], cwd=ROOT).decode('utf-8').split('\0')
tracked = [ROOT / name for name in tracked if name]
assert tracked, '缺少受跟踪验收资料，无法验证保护边界'


def hashes():
    return {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in tracked}


before = hashes()
tmp = ROOT / 'sandbox/tmp'
tmp.mkdir(parents=True, exist_ok=True)
count = 0
try:
    with tempfile.TemporaryDirectory(prefix='test-output-', dir=tmp) as directory:
        work = Path(directory)
        blocked = work / 'not a directory'
        blocked.write_text('不能作为报告目录', encoding='utf-8')
        default = ROOT / 'sandbox/frontend-checks'
        scenarios = [
            ('default-root', ROOT, None, default),
            ('default-other-cwd', work, None, default),
            ('empty-other-cwd', work, '', default),
            ('relative-spaces', work, 'relative reports/nested', work / 'relative reports/nested'),
            ('absolute-spaces', work, str(work / 'absolute reports/nested'), work / 'absolute reports/nested'),
            ('blocked-output', work, str(blocked / 'child'), None),
        ]
        for executable, script, report in SCRIPTS:
            expected = None
            for name, cwd, setting, output in scenarios:
                env = {**os.environ, 'PYTHONUTF8': '1'}
                env.pop('IC_TEST_OUTPUT', None)
                if setting is not None:
                    env['IC_TEST_OUTPUT'] = setting
                target = output / report if output else None
                previous_mtime = target.stat().st_mtime_ns if target and target.exists() else None
                result = subprocess.run(
                    [executable, str(ROOT / 'frontend/scripts' / script)], cwd=cwd,
                    env=env, capture_output=True, text=True, encoding='utf-8', timeout=60,
                )
                label = f'{script}: {name}'
                if output is None:
                    assert result.returncode != 0, label + ': 写入失败却成功退出'
                    assert re.search(r'ENOTDIR|EEXIST|NotADirectoryError|FileExistsError', result.stderr), result.stderr
                else:
                    assert result.returncode == 0, label + '\n' + result.stdout + result.stderr
                    assert target.is_file(), label + ': 未生成报告'
                    assert target.stat().st_mtime_ns != previous_mtime, label + ': 未更新报告'
                    data = json.loads(target.read_text(encoding='utf-8'))
                    assert set(data) == {'scope', 'count', 'checks'}, label
                    assert data['count'] == len(data['checks']) > 0, label
                    if expected is None:
                        expected = data
                    assert data == expected, label + ': 输出位置改变了报告内容'
                assert hashes() == before, label + ': 修改了受跟踪验收资料'
                count += 1
                print('PASS ' + label)
finally:
    assert hashes() == before, '受跟踪验收资料发生变化；不自动覆盖或恢复，请核对差异'
print(f'通过：{count} 项输出隔离检查；{len(tracked)} 个受跟踪验收文件哈希不变。')
