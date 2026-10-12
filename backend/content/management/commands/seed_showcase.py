from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from content.demo_content import demo_records, DEMO_SOURCE
from content.models import Article, Publication
from content.services import save_draft, review_article


class Command(BaseCommand):
    help = '预检或发布新闻/通知各24条虚构演示；只新增固定标识，不覆盖现有内容。'

    def add_arguments(self, parser):
        mode = parser.add_mutually_exclusive_group()
        mode.add_argument('--publish', action='store_true', help='明确执行新增并批准预览')
        mode.add_argument('--withdraw', action='store_true', help='只撤下本批仍保留演示标记的条目，不删除草稿')
        parser.add_argument('--actor', default='preview-admin', help='已有、具有编辑及审核权限的执行账号')

    @transaction.atomic
    def handle(self, *args, **options):
        records = list(demo_records())
        slugs = [record['slug'] for record in records]
        existing = set(Article.objects.filter(slug__in=slugs).values_list('slug', flat=True))
        if not options['publish'] and not options['withdraw']:
            self.stdout.write(f'预检：计划48条（新闻24、通知24），新增{48 - len(existing)}条，跳过{len(existing)}条。未写数据库；使用 --publish 执行。')
            return
        user = get_user_model().objects.filter(username=options['actor'], is_active=True).first()
        if user is None or not user.has_perms(['content.add_article', 'content.review_article']):
            raise CommandError('执行账号不存在、已停用或缺少编辑/审核权限；没有写入。')
        if options['withdraw']:
            selected = Article.objects.filter(slug__in=slugs, source=DEMO_SOURCE, is_placeholder=True, title__startswith='【演示】', publication__isnull=False)
            count = 0
            for article in selected:
                review_article(article.pk, article.revision, user, 'withdraw')
                count += 1
            self.stdout.write(f'已撤下{count}条本批演示，保留草稿和日志；其他内容不变。')
            return
        count = 0
        for record in records:
            if record['slug'] in existing:
                continue
            article = save_draft(Article(**record), 0, user, submit=True)
            review_article(article.pk, article.revision, user, 'approve')
            count += 1
        self.stdout.write(f'新增并批准{count}条，跳过{len(existing)}条；未覆盖已有草稿或用户编辑。')
        self.stdout.write(f'当前已批准：新闻{Publication.objects.filter(category="news").count()}条，通知{Publication.objects.filter(category="notice").count()}条。')
