"""不依赖 Django；首次准备仓库沙盒密钥。"""
import os
import secrets
from pathlib import Path

data = Path(os.environ.get('IC_DATA_DIR', Path(__file__).resolve().parent.parent / 'sandbox' / 'data'))
data.mkdir(parents=True, exist_ok=True)
key = data / 'secret.key'
try:
    with key.open('x', encoding='ascii') as f:
        f.write(secrets.token_urlsafe(64))
    os.chmod(key, 0o600)
    print('已创建独立随机密钥（不显示密钥）。')
except FileExistsError:
    print('保留已有密钥。')
