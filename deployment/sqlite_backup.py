"""SQLite 一致性备份与恢复检查；只复制数据库，不输出内容或凭据。"""
import argparse
import os
from pathlib import Path
import sqlite3
from contextlib import closing

def database_path(path):
    path = Path(path).absolute()
    # Windows 沙盒中的活动 SQLite 路径可能拒绝 GetFinalPathName。
    # 不移动或删除源路径；读连接仍通过 mode=ro 要求已有数据库。
    return path

def verify(path):
    path = database_path(path)
    with closing(sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)) as conn:
        rows = conn.execute('PRAGMA integrity_check').fetchall()
        if rows != [('ok',)]:
            raise RuntimeError('数据库完整性检查未通过。')
        if conn.execute('PRAGMA foreign_key_check').fetchall():
            raise RuntimeError('数据库外键检查未通过。')
    return path

def backup(source, destination):
    source = database_path(source)
    destination = Path(destination).absolute()
    if source == destination or destination.exists():
        raise ValueError('目标必须是新的文件，不能覆盖源库或已有备份。')
    destination.parent.mkdir(parents=True, exist_ok=True)
    # 排他创建，避免覆盖；600 权限适用于服务器。
    fd = os.open(destination, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    os.close(fd)
    try:
        with closing(sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)) as src:
            with closing(sqlite3.connect(destination)) as dest:
                src.backup(dest, pages=100, sleep=.1)
        verify(destination)
    except Exception:
        # 保留失败文件供核查；不自动删除用户文件。
        raise
    return destination

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='operation', required=True)
    copy = sub.add_parser('backup')
    copy.add_argument('source')
    copy.add_argument('destination')
    check = sub.add_parser('verify')
    check.add_argument('source')
    args = parser.parse_args()
    result = backup(args.source, args.destination) if args.operation == 'backup' else verify(args.source)
    print(f'完整性与外键检查通过：{result.name}')
