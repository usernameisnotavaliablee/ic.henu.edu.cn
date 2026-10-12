from io import StringIO
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from .demo_content import demo_records
from .models import Article, Publication, AuditEvent


@override_settings(ALLOWED_HOSTS=['testserver'], PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class ShowcaseTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        get_user_model().objects.create_superuser('preview-admin', password='test-only-password')

    def run_seed(self, *args):
        call_command('seed_showcase', *args, stdout=StringIO())

    def test_preview_is_read_only_and_publish_is_idempotent(self):
        self.run_seed()
        self.assertEqual(Article.objects.count(), 0)
        self.run_seed('--publish')
        original = Article.objects.get(slug='news-showcase-v1-01')
        original.title = '用户修改的标题'
        original.save(update_fields=['title'])
        self.run_seed('--publish')
        original.refresh_from_db()
        self.assertEqual(original.title, '用户修改的标题')
        self.assertEqual(Article.objects.count(), 48)
        self.assertEqual(Publication.objects.count(), 48)
        self.assertEqual(AuditEvent.objects.count(), 96)

    def test_missing_actor_does_not_create_content(self):
        with self.assertRaises(CommandError):
            self.run_seed('--publish', '--actor', 'missing-user')
        self.assertEqual(Article.objects.count(), 0)

    def test_existing_slug_and_unrelated_content_are_preserved(self):
        values = next(demo_records())
        original = Article.objects.create(**{**values, 'title': '已有用户内容', 'is_placeholder': False})
        self.run_seed('--publish')
        original.refresh_from_db()
        self.assertEqual(original.title, '已有用户内容')
        self.assertFalse(Publication.objects.filter(article=original).exists())
        self.assertEqual(Publication.objects.count(), 47)

    def test_pages_are_complete_distinct_and_category_specific(self):
        self.run_seed('--publish')
        for category, url in [('news', '/news.html'), ('notice', '/notices.html')]:
            slugs = []
            for number, size in [(1, 10), (2, 10), (3, 4)]:
                response = self.client.get(url, {'page': number})
                page = response.context['page']
                self.assertEqual(page.number, number)
                self.assertEqual(len(page), size)
                self.assertTrue(all(item.category == category for item in page))
                self.assertContains(response, 'class="pagination-jump"')
                self.assertContains(response, 'max="3"')
                slugs.extend(item.slug for item in page)
            self.assertEqual(len(set(slugs)), 24)
            self.assertEqual(slugs, [f'{category}-showcase-v1-{number:02d}' for number in range(1, 25)])

    def test_boundary_controls_and_invalid_page_queries(self):
        self.run_seed('--publish')
        self.assertContains(self.client.get('/news.html'), '<span aria-disabled="true">上一页</span>', html=True)
        self.assertContains(self.client.get('/news.html?page=3'), '<span aria-disabled="true">下一页</span>', html=True)
        for value, expected in [('abc', 1), ('0', 3), ('-1', 3), ('99999', 3), ('2', 2)]:
            response = self.client.get('/notices.html', {'page': value})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.context['page'].number, expected)
            self.assertEqual(response.context['category'], 'notice')

    def test_empty_list_has_no_dead_jump_form(self):
        response = self.client.get('/news.html')
        self.assertContains(response, '暂无已批准的内容')
        self.assertNotContains(response, 'class="pagination-jump"')

    def test_withdraw_preserves_drafts_and_non_demo_content(self):
        self.run_seed('--publish')
        special = Article.objects.get(slug='news-showcase-v1-01')
        special.is_placeholder = False
        special.save(update_fields=['is_placeholder'])
        self.run_seed('--withdraw')
        self.assertEqual(Article.objects.count(), 48)
        self.assertEqual(Publication.objects.count(), 1)
        self.assertEqual(Publication.objects.get().article_id, special.pk)
        self.run_seed('--publish')
        self.assertEqual(Publication.objects.count(), 1, '重复导入不能擅自恢复已撤下的内容')
