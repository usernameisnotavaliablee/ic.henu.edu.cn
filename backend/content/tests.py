from django.contrib.auth.models import User, Permission
from django.core.exceptions import PermissionDenied, ValidationError
from django.test import TestCase, Client, override_settings
from django.urls import reverse
from .models import Article, Publication, AuditEvent
from .services import save_draft, review_article, Conflict

@override_settings(ALLOWED_HOSTS=['testserver', '127.0.0.1'], PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class WorkflowTests(TestCase):
    def setUp(self):
        self.editor = User.objects.create_user('editor', password='test-only-long-password', is_staff=True)
        self.editor.user_permissions.set(Permission.objects.filter(content_type__app_label='content', codename__in=['view_article', 'add_article', 'change_article']))
        self.reviewer = User.objects.create_user('reviewer', password='test-only-long-password', is_staff=True)
        self.reviewer.user_permissions.set(Permission.objects.filter(content_type__app_label='content', codename__in=['view_article', 'review_article']))
        self.article = save_draft(Article(slug='news-demo', category='news', title='预览测试', summary='测试摘要', body='第一段\n\n第二段'), 0, self.editor)

    def publish(self):
        self.article.refresh_from_db()
        self.article = save_draft(self.article, self.article.revision, self.editor, submit=True)
        review_article(self.article.pk, self.article.revision, self.reviewer, 'approve')
        self.article.refresh_from_db()

    def test_draft_does_not_leak_in_home_list_or_detail(self):
        for url in ['/', '/news.html', '/notices.html']:
            self.assertNotContains(self.client.get(url), '预览测试')
        self.assertEqual(self.client.get('/news-demo.html').status_code, 404)

    def test_publish_is_visible_on_all_three_surfaces(self):
        self.publish()
        for url in ['/', '/news.html', '/news-demo.html']:
            self.assertContains(self.client.get(url), '预览测试')

    def test_editing_draft_preserves_approved_snapshot(self):
        self.publish()
        self.article.title = '还未批准的新标题'
        save_draft(self.article, self.article.revision, self.editor)
        self.assertContains(self.client.get('/news-demo.html'), '预览测试')
        self.assertNotContains(self.client.get('/news-demo.html'), '还未批准的新标题')

    def test_news_and_notice_headings_match_review_without_executing_html(self):
        body = '## 说明性质\r\n\r\n第一行\r\n第二行\r\n\r\n## <script>alert(1)</script>\r\n\r\n正文中的 ## 保持原样'
        for category in ['news', 'notice']:
            with self.subTest(category=category):
                self.article = save_draft(Article(slug=f'{category}-heading-test', category=category,
                    title='小标题测试', summary='摘要', body=body), 0, self.editor)
                self.publish()
                self.client.force_login(self.reviewer)
                for url in [self.article.get_absolute_url(), reverse('admin:content_article_review', args=[self.article.pk])]:
                    response = self.client.get(url)
                    self.assertContains(response, '<h3>说明性质</h3>', html=True)
                    self.assertContains(response, '<p>第一行<br>第二行</p>', html=True)
                    self.assertContains(response, '<h3>&lt;script&gt;alert(1)&lt;/script&gt;</h3>', html=True)
                    self.assertContains(response, '<p>正文中的 ## 保持原样</p>', html=True)
                    self.assertNotContains(response, '<script>alert(1)</script>')
                    self.assertNotContains(response, '## 说明性质')
                self.assertEqual(Publication.objects.get(article=self.article).body, body)

    def test_editor_cannot_review_even_via_forged_request(self):
        with self.assertRaises(PermissionDenied):
            review_article(self.article.pk, self.article.revision, self.editor, 'approve')
        self.client.force_login(self.editor)
        response = self.client.post(reverse('admin:content_article_review', args=[self.article.pk]), {'expected_revision': self.article.revision, 'decision': 'approve'})
        self.assertEqual(response.status_code, 403)

    def test_reviewer_cannot_edit(self):
        with self.assertRaises(PermissionDenied):
            save_draft(self.article, self.article.revision, self.reviewer)
        self.client.force_login(self.reviewer)
        self.assertEqual(self.client.post(reverse('admin:content_article_change', args=[self.article.pk]), {}).status_code, 403)

    def test_stale_edits_are_rejected(self):
        old = self.article.revision
        self.article.title = '另一窗口保存的标题'
        save_draft(self.article, old, self.editor)
        self.article.title = '不应覆盖'
        with self.assertRaises(Conflict):
            save_draft(self.article, old, self.editor)
        self.assertEqual(Article.objects.get(pk=self.article.pk).title, '另一窗口保存的标题')

    def test_stale_review_and_duplicate_review_are_rejected(self):
        old = self.article.revision
        self.publish()
        with self.assertRaises(Conflict):
            review_article(self.article.pk, old, self.reviewer, 'approve')
        with self.assertRaises(ValidationError):
            review_article(self.article.pk, self.article.revision, self.reviewer, 'approve')

    def test_review_requires_submission(self):
        with self.assertRaises(ValidationError):
            review_article(self.article.pk, self.article.revision, self.reviewer, 'approve')
        self.assertFalse(Publication.objects.exists())

    def test_withdraw_removes_detail_home_and_list(self):
        self.publish()
        review_article(self.article.pk, self.article.revision, self.reviewer, 'withdraw')
        self.assertEqual(self.client.get('/news-demo.html').status_code, 404)
        self.assertNotContains(self.client.get('/news.html'), '预览测试')
        self.assertNotContains(self.client.get('/'), '预览测试')

    def test_xss_is_text_on_public_and_review_pages(self):
        self.article.title = '<script>alert(1)</script>'
        self.article.body = '<img src=x onerror=alert(1)>\n\n正常正文'
        save_draft(self.article, self.article.revision, self.editor)
        self.publish()
        for url in ['/', '/news.html', '/news-demo.html']:
            response = self.client.get(url)
            self.assertNotContains(response, '<script>alert(1)</script>')
            self.assertContains(response, '&lt;script&gt;alert(1)&lt;/script&gt;')
        self.assertNotContains(self.client.get('/news-demo.html'), '<img src=x')
        self.client.force_login(self.reviewer)
        response = self.client.get(reverse('admin:content_article_review', args=[self.article.pk]))
        self.assertContains(response, '&lt;img src=x onerror=alert(1)&gt;')

    def test_arbitrary_image_path_and_reserved_slug_rejected(self):
        self.article.image = '../../sandbox/data/secret.key'
        with self.assertRaises(ValidationError):
            save_draft(self.article, self.article.revision, self.editor)
        self.article.image = 'chip-banner.svg'
        self.article.slug = 'about'
        with self.assertRaises(ValidationError):
            save_draft(self.article, self.article.revision, self.editor)

    def test_address_is_stable_after_creation(self):
        self.article.slug = 'news-changed'
        with self.assertRaises(ValidationError):
            save_draft(self.article, self.article.revision, self.editor)

    def test_max_length_enforced(self):
        self.article.body = 'x' * 30001
        with self.assertRaises(ValidationError):
            save_draft(self.article, self.article.revision, self.editor)

    def test_real_admin_post_saves_submits_then_reviews(self):
        self.client.force_login(self.editor)
        data = dict(category='news', slug='news-from-form', title='通过表单新增', summary='表单摘要', body='表单正文', source='内部测试', date='', image='chip-banner.svg', image_alt='测试示意', is_placeholder='on', expected_revision=0, submit_for_review='on', _save='保存')
        response = self.client.post(reverse('admin:content_article_add'), data)
        self.assertEqual(response.status_code, 302)
        obj = Article.objects.get(slug='news-from-form')
        self.assertEqual(obj.state, 'submitted')
        self.client.force_login(self.reviewer)
        response = self.client.post(reverse('admin:content_article_review', args=[obj.pk]), {'expected_revision': obj.revision, 'decision': 'approve'})
        self.assertEqual(response.status_code, 302)
        self.assertContains(self.client.get('/news-from-form.html'), '通过表单新增')

    def test_admin_rejects_stale_form_and_preserves_content(self):
        self.client.force_login(self.editor)
        old = self.article.revision
        self.article.title = '新版本'
        save_draft(self.article, old, self.editor)
        response = self.client.post(reverse('admin:content_article_change', args=[self.article.pk]), dict(category='news', title='旧表单', summary='摘要', body='正文', source='测试', date='', image='chip-banner.svg', image_alt='图', expected_revision=old, _save='保存'))
        self.assertContains(response, '本次没有保存')
        self.article.refresh_from_db()
        self.assertEqual(self.article.title, '新版本')

    def test_anonymous_admin_redirects_to_login(self):
        response = self.client.get('/preview-admin/content/article/')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/preview-admin/login/', response.url)

    def test_missing_csrf_rejected(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.editor)
        self.assertEqual(client.post(reverse('admin:content_article_add'), {'title': '伪造表单'}).status_code, 403)

    def test_remote_admin_and_forwarded_address_not_trusted(self):
        self.assertEqual(self.client.get('/preview-admin/', REMOTE_ADDR='203.0.113.8', HTTP_X_FORWARDED_FOR='127.0.0.1').status_code, 403)

    @override_settings(PUBLIC_ONLY=True)
    def test_public_mode_has_no_admin_or_mutations(self):
        for url in ['/preview-admin/', '/preview-admin/login/', '/preview-admin/content/article/add/']:
            self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.post('/', {}).status_code, 404)
        self.assertEqual(self.client.get('/').status_code, 200)

    def test_private_files_and_traversal_are_not_served(self):
        for url in ['/data/ic-preview.sqlite3', '/.env', '/secret.key', '/assets/../data/ic-preview.sqlite3', '/assets/site.js', '/static/../secret.key', '/content/models.py']:
            self.assertEqual(self.client.get(url).status_code, 404, url)

    def test_security_headers_and_host_validation(self):
        response = self.client.get('/')
        for name in ['Content-Security-Policy', 'X-Content-Type-Options', 'X-Frame-Options', 'X-Robots-Tag']:
            self.assertIn(name, response)
        self.assertEqual(response['Cache-Control'], 'no-store')
        self.assertEqual(self.client.get('/', HTTP_HOST='malicious.example').status_code, 400)

    def test_empty_home_static_pages_and_assets_are_available(self):
        for url in ['/', '/about.html', '/teacher-zhang-jinlong.html', '/css/style.css', '/assets/chip-banner.svg', '/js/main.js', '/js/media-loading.js', '/js/header-motion.js', '/robots.txt', '/healthz',
                    '/research-platforms.html', '/research-groups.html', '/regulations.html', '/party-building.html', '/admissions.html', '/community.html', '/ic-world.html', '/media.html']:
            self.assertEqual(self.client.get(url).status_code, 200, url)

    def test_sql_injection_like_title_remains_data(self):
        self.article.title = "'; DROP TABLE content_article; --"
        save_draft(self.article, self.article.revision, self.editor)
        self.publish()
        self.assertEqual(Article.objects.count(), 1)
        self.assertEqual(Publication.objects.get().title, self.article.title)

    def test_audit_records_and_return_without_unpublishing(self):
        self.publish()
        review_article(self.article.pk, self.article.revision, self.reviewer, 'return')
        self.assertTrue(Publication.objects.exists())
        self.assertEqual(list(AuditEvent.objects.order_by('pk').values_list('action', flat=True)), ['保存草稿', '提交审核', '批准预览', '退回修改'])

    def test_login_lockout_after_repeated_failures(self):
        for _ in range(5):
            response = self.client.post('/preview-admin/login/?next=/preview-admin/', {'username': 'editor', 'password': 'incorrect'})
        self.assertEqual(response.status_code, 429)
        response = self.client.post('/preview-admin/login/?next=/preview-admin/', {'username': 'editor', 'password': 'test-only-long-password'})
        self.assertEqual(response.status_code, 429)

