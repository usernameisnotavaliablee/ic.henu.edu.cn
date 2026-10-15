import json
import os
import secrets
from pathlib import Path
from django.conf import settings
from django.contrib.auth.models import User, Group, Permission
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from content.models import Article, Publication, AuditEvent, CONTENT_FIELDS

class Command(BaseCommand):
    help = '首次创建本地预览账号、编辑/审核角色和标明占位的示例；不会覆盖已有内容或重置口令。'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='preview-admin')

    @transaction.atomic
    def handle(self, *args, **options):
        editor, _ = Group.objects.get_or_create(name='内容编辑')
        editor.permissions.set(Permission.objects.filter(content_type__app_label='content', codename__in=['view_article', 'add_article', 'change_article']))
        reviewer, _ = Group.objects.get_or_create(name='预览审核员')
        reviewer.permissions.set(Permission.objects.filter(content_type__app_label='content', codename__in=['view_article', 'review_article', 'view_publication', 'view_auditevent']))
        username = options['username']
        user = User.objects.filter(username=username).first()
        if user is None:
            password = secrets.token_urlsafe(24)
            user = User.objects.create_superuser(username=username, password=password)
            credentials = settings.DATA_DIR.parent / 'access.txt'
            # 使用排他创建；口令只保存本地，不写日志或 Git。
            try:
                with credentials.open('x', encoding='utf-8') as f:
                    f.write(f'仅本地开发预览；不要转发或提交。\n入口：http://127.0.0.1:8095/preview-admin/\n用户名：{username}\n密码：{password}\n')
                os.chmod(credentials, 0o600)
            except FileExistsError:
                raise CommandError('access.txt 已存在，未覆盖凭据；请检查后使用 createsuperuser 手动初始化。')
            self.stdout.write(f'新账号凭据已写入 {credentials}（不在控制台显示）。')
        seed = json.loads((settings.BASE_DIR / 'seed-content.json').read_text(encoding='utf-8'))
        count = 0
        for category, items in [('news', seed['news']), ('notice', seed['notices'])]:
            for item in items:
                article, created = Article.objects.get_or_create(slug=item['slug'], defaults={
                    'category': category, 'title': item['title'], 'summary': item['summary'],
                    'body': item['summary'] + '\n\n正文待提供。本页仅用于内部确认文章排版。',
                    'source': '内部示例 · 非正式发布', 'image': Path(item.get('image', 'chip-banner.jpg')).name,
                    'image_alt': item.get('imageAlt', '原创芯片学科示意，非新闻现场'),
                    'state': 'approved', 'is_placeholder': True,
                })
                if not created:
                    continue
                Publication.objects.create(article=article, revision=1, approved_by=None, **{name: getattr(article, name) for name in CONTENT_FIELDS})
                AuditEvent.objects.create(article=article, actor=None, action='初始化占位示例（非人工审核）', revision=1)
                count += 1
        self.stdout.write(f'已初始化 {count} 条示例；现有草稿、账号口令和预览不变。')
