import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from sqlite_backup import backup, verify

class BackupTests(unittest.TestCase):
    def test_live_wal_database_backup_restore_and_no_overwrite(self):
        sandbox = Path(__file__).resolve().parents[1] / 'sandbox' / 'tmp'
        sandbox.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=sandbox) as directory:
            self.assertTrue(Path(directory).resolve().is_relative_to(sandbox.resolve()))
            source, saved, restored = [Path(directory) / name for name in ('source.sqlite3', 'backup.sqlite3', 'restore.sqlite3')]
            with closing(sqlite3.connect(source)) as writer:
                writer.execute('PRAGMA journal_mode=WAL')
                writer.execute('CREATE TABLE news(id INTEGER PRIMARY KEY, title TEXT)')
                writer.execute('INSERT INTO news(title) VALUES (?)', ('审核快照',))
                writer.commit()
                backup(source, saved)
                writer.execute('INSERT INTO news(title) VALUES (?)', ('备份后新增',))
                writer.commit()
                backup(saved, restored)
                with closing(sqlite3.connect(restored)) as reader:
                    self.assertEqual(reader.execute('SELECT title FROM news').fetchall(), [('审核快照',)])
                with self.assertRaises(ValueError): backup(source, saved)
                with self.assertRaises(ValueError): backup(source, source)
                self.assertEqual(verify(restored), restored)

if __name__ == '__main__':
    unittest.main()
