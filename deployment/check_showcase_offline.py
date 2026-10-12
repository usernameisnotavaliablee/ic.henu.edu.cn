"""离线校验演示材料并导出目录；不连接服务器或数据库。"""
import ast
import json
import sys
from collections import Counter
from pathlib import Path
from release_assets import validate_showcase_images

REPO = Path(__file__).resolve().parent.parent  # 仓库根目录
sys.path.insert(0, str(REPO / 'backend'))
from content.demo_content import demo_records, DISCLAIMER, DEMO_SOURCE

records = list(demo_records())
assert Counter(row['category'] for row in records) == {'news': 24, 'notice': 24}
assert len({row['slug'] for row in records}) == 48
for row in records:
    assert row['title'].startswith('【演示】') and len(row['title']) <= 160
    assert len(row['summary']) <= 400 and len(row['body']) <= 30000
    assert row['is_placeholder'] and row['source'] == DEMO_SOURCE
    assert row['body'].startswith(DISCLAIMER)
    assert row['slug'].startswith(row['category'] + '-showcase-v1-')
assert sum(len(row['body']) > 1000 for row in records) >= 6
validate_showcase_images(REPO, records)

python_files = ['backend/content/demo_content.py', 'backend/content/management/commands/seed_showcase.py',
                'backend/content/views.py', 'backend/content/test_showcase.py',
                'frontend/scripts/prepare-fonts.py', 'deployment/package_preview.py', 'deployment/release_assets.py']
for relative in python_files:
    ast.parse((REPO / relative).read_text(encoding='utf-8'), filename=relative)

catalog = ['# 演示新闻与通知目录', '',
           '新闻、通知各24条，全部为虚构材料。本文由 `deployment/check_showcase_offline.py` 生成；生成目录不代表已导入服务器。', '',
           '地址标识固定，重复导入不会覆盖已有内容。每类第01、13、24条为长文，适合手机与Pad阅读测试。展示日期均为演示日期。', '',
           '| 栏目 | 演示标题 | 展示日期 | 正文字符数 | 部署后地址 |', '|---|---|---|---|---|']
for row in records:
    label = '新闻' if row['category'] == 'news' else '通知'
    catalog.append(f'| {label} | {row["title"]} | {row["date"]} | {len(row["body"])} | [打开](http://47.94.146.53:8099/{row["slug"]}.html) |')
(REPO / 'docs' / '内部资料' / '演示新闻与通知目录.md').write_text('\n'.join(catalog) + '\n', encoding='utf-8')
report = {'scope': 'offline-only', 'news': 24, 'notices': 24, 'unique_slugs': 48,
          'long_articles': sum(len(row['body']) > 1000 for row in records),
          'python_ast_checked': python_files, 'django_tests': 'not-run-by-this-script',
          'image_assets_checked': 'frontend/preview/assets',
          'font_assets': 'check-with-prepare-fonts.py --check-and-package-preview.py', 'server_deployment': 'not-checked'}
(REPO / 'frontend' / 'qa' / 'showcase-offline-checks.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('通过：新闻24条、通知24条；标记、唯一地址、字段长度、长文、配图及Python语法检查。未操作数据库或服务器。')
