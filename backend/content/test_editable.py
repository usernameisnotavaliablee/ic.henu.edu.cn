"""仅使用Django隔离测试库；不录入或改动业务库。"""
from django.contrib.auth.models import User, Permission
from django.test import TestCase, override_settings
from django.urls import reverse
from .models import ContentEntry
from .editable import catalog


@override_settings(ALLOWED_HOSTS=['testserver', '127.0.0.1'], PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class EditableContentTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('test-admin', password='test-only-long-password')

    def publish(self, entry):
        self.client.force_login(self.admin)
        response = self.client.post(reverse('admin:content_contententry_changelist'), {'action': 'publish_selected', '_selected_action': [entry.pk]})
        self.assertEqual(response.status_code, 302)
        entry.refresh_from_db()
        self.assertTrue(entry.published)

    def test_teacher_full_fallback_and_breadcrumb(self):
        response = self.client.get('/teacher-cheng-gang.html')
        self.assertContains(response, '更多代表论文')
        self.assertContains(response, 'chenggang@henu.edu.cn')
        self.assertContains(response, 'href="/faculty.html">师资队伍</a>')

    def test_new_teacher_not_visible_until_admin_publishes(self):
        entry = ContentEntry.objects.create(key='teacher-demo', title='【演示】教师样例', summary='教学简介', body='## 研究方向\n\n内容样例')
        self.assertEqual(self.client.get('/teacher-demo.html').status_code, 404)
        self.publish(entry)
        for url in ['/', '/faculty.html', '/teacher-demo.html']:
            self.assertContains(self.client.get(url), '【演示】教师样例')
        entry.title = '未发布修改'
        entry.save()
        self.assertNotContains(self.client.get('/faculty.html'), '未发布修改')

    def test_hiding_fallback_teacher_does_not_resurrect_static_page(self):
        entry = ContentEntry.objects.create(key='teacher-cheng-gang', title='程纲', is_visible=False)
        self.publish(entry)
        self.assertEqual(self.client.get('/teacher-cheng-gang.html').status_code, 404)
        self.assertNotContains(self.client.get('/faculty.html'), 'teacher-cheng-gang.html')

    def test_section_snapshot_and_autoescape(self):
        entry = ContentEntry.objects.create(key='about.section-1', title='【演示】学院简介', body='<script>alert(1)</script>')
        self.assertNotContains(self.client.get('/about.html'), '【演示】学院简介')
        self.publish(entry)
        response = self.client.get('/about.html')
        self.assertContains(response, '【演示】学院简介')
        self.assertContains(response, '&lt;script&gt;alert(1)&lt;/script&gt;')
        self.assertNotContains(response, '<script>alert(1)</script>')

    def test_site_contact_and_qr_shared_across_pages(self):
        entry = ContentEntry.objects.create(key='site', title='站点资料', address='【演示】联系地址', account_name='【演示】公众号', qr_image='campus-gate.jpg')
        self.publish(entry)
        for url in ['/', '/contact.html', '/about.html', '/faculty.html']:
            response = self.client.get(url)
            self.assertContains(response, '【演示】联系地址')
            self.assertContains(response, '【演示】公众号')
        entry.qr_image = ''
        entry.save()
        self.publish(entry)
        self.assertContains(self.client.get('/contact.html'), '二维码<br>待提供')

    def test_editor_cannot_publish_by_forged_admin_action(self):
        editor = User.objects.create_user('test-editor', password='test-only-long-password', is_staff=True)
        editor.user_permissions.set(Permission.objects.filter(codename__in=['view_contententry', 'change_contententry']))
        entry = ContentEntry.objects.create(key='about.section-1', title='不应发布')
        self.client.force_login(editor)
        self.client.post(reverse('admin:content_contententry_changelist'), {'action': 'publish_selected', '_selected_action': [entry.pk]})
        entry.refresh_from_db()
        self.assertEqual(entry.published, {})

    def test_admin_initial_teacher_form_preserves_full_material(self):
        self.client.force_login(self.admin)
        response = self.client.get(reverse('admin:content_contententry_add') + '?key=teacher-cheng-gang')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '更多代表论文')
        self.assertContains(response, 'chenggang@henu.edu.cn')

    def test_all_catalog_pages_render_and_slides_are_editable(self):
        for route in catalog()['routes']:
            if route in {'frame', 'news', 'notices'} or route.startswith(('news-', 'notice-')):
                continue
            self.assertEqual(self.client.get('/' + route + '.html').status_code, 200, route)
        entry = ContentEntry.objects.create(key='home.slide-1', title='【演示】轮播标题', summary='演示轮播说明', image='campus-gate.jpg')
        self.publish(entry)
        self.assertContains(self.client.get('/'), '【演示】轮播标题')
