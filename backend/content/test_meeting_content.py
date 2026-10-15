"""Meeting requirements: real admin save/publish/read in an isolated Django test DB."""
from datetime import date

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import ContentEntry


@override_settings(ALLOWED_HOSTS=['testserver'], PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class MeetingContentTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_superuser('meeting-test', password='isolated-test-only')
        self.client.force_login(self.user)

    def publish(self, entry):
        response = self.client.post(reverse('admin:content_contententry_changelist'),
            {'action': 'publish_selected', '_selected_action': [entry.pk]})
        self.assertEqual(response.status_code, 302)
        entry.refresh_from_db()
        self.assertTrue(entry.published)

    def test_admin_teacher_category_saved_then_published_without_duplicate_identity(self):
        response = self.client.post(reverse('admin:content_contententry_add'), {
            'key': '__new_teacher__', 'teacher_slug': 'teacher-classification-check',
            'title': '分类测试教师', 'teacher_category': 'national-young',
            'summary': '隔离测试资料', 'body': '完整个人介绍', 'sort_order': 0,
            'is_visible': 'on', '_save': '保存',
        })
        self.assertEqual(response.status_code, 302)
        entry = ContentEntry.objects.get(key='teacher-classification-check')
        self.assertNotContains(self.client.get('/faculty-talents.html'), '分类测试教师')
        self.publish(entry)
        self.assertContains(self.client.get('/faculty-talents.html'), '分类测试教师', count=1)
        self.assertContains(self.client.get('/faculty.html'), '分类测试教师', count=1)
        self.assertContains(self.client.get('/teacher-classification-check.html'), '完整个人介绍')
        self.assertNotContains(self.client.get('/faculty-teachers.html'), '分类测试教师')
        entry.teacher_category = 'regular'
        entry.save()
        self.assertContains(self.client.get('/faculty-talents.html'), '分类测试教师')
        self.publish(entry)
        self.assertNotContains(self.client.get('/faculty-talents.html'), '分类测试教师')
        self.assertContains(self.client.get('/faculty-teachers.html'), '分类测试教师')
        self.assertEqual(ContentEntry.objects.filter(key=entry.key).count(), 1)

    def test_default_teachers_preserved_without_inferred_honours(self):
        html = self.client.get('/faculty.html').content.decode()
        self.assertLess(html.index('teacher-cheng-gang.html'), html.index('teacher-zhang-jinlong.html'))
        self.assertLess(html.index('teacher-zhang-jinlong.html'), html.index('teacher-zheng-haiwu.html'))
        self.assertNotContains(self.client.get('/faculty-talents.html'), 'class="faculty-card"')
        self.assertContains(self.client.get('/teacher-cheng-gang.html'), '更多代表论文')

    def test_student_regulations_sort_by_date_and_admin_records_stay_separate(self):
        for key, title, day, order, collection in [
            ('entry-old-rule', '旧学生制度', date(2026, 9, 1), 0, 'community.section-3'),
            ('entry-new-rule', '新学生制度', date(2026, 10, 15), 999, 'community.section-3'),
            ('entry-admin-rule', '行政制度测试', date(2026, 10, 16), 0, 'regulations.section-1'),
        ]:
            self.publish(ContentEntry.objects.create(key=key,title=title,date=day,sort_order=order,collection=collection))
        html = self.client.get('/student-regulations.html').content.decode()
        self.assertLess(html.index('新学生制度'), html.index('旧学生制度'))
        self.assertNotIn('行政制度测试', html)
        self.assertContains(self.client.get('/regulations-section-1.html'), '行政制度测试')
        self.assertContains(self.client.get('/entry-new-rule.html'), 'href="community.html"')

    def test_legacy_leadership_slot_is_visible_in_management_collection(self):
        entry = ContentEntry.objects.create(key='about.section-3', title='审定班子测试', body='原有班子介绍')
        self.publish(entry)
        self.assertContains(self.client.get('/management.html'), '审定班子测试')
        self.assertContains(self.client.get('/management-leadership.html'), '审定班子测试')
        self.assertContains(self.client.get('/record-about-section-3.html'), '原有班子介绍')
        self.assertContains(self.client.get('/about.html'), 'id="section-3"')

    def test_instrument_service_link_requires_valid_web_url_and_publication(self):
        response = self.client.post(reverse('admin:content_contententry_add'), {
            'key':'__new_entry__', 'teacher_slug':'entry-instrument-check', 'title':'仪器测试',
            'collection':'instruments.section-1', 'service_url':'https://example.org/instruments/1',
            'service_label':'预约共享平台', 'sort_order':100, 'is_visible':'on', '_save':'保存',
        })
        self.assertEqual(response.status_code, 302)
        entry = ContentEntry.objects.get(key='entry-instrument-check')
        self.assertEqual(self.client.get('/entry-instrument-check.html').status_code, 404)
        self.publish(entry)
        self.assertContains(self.client.get('/entry-instrument-check.html'), 'https://example.org/instruments/1')
        entry.service_url = 'javascript:alert(1)'
        with self.assertRaises(ValidationError):
            entry.full_clean()

    def test_website_qr_uses_published_site_snapshot(self):
        entry = ContentEntry.objects.create(key='site', title='站点测试', website_qr_image='campus-gate.jpg')
        self.assertNotContains(self.client.get('/contact.html'), 'alt="学院网站二维码"')
        self.publish(entry)
        for url in ('/contact.html', '/'):
            self.assertContains(self.client.get(url), 'alt="学院网站二维码"')
        entry.website_qr_image = ''
        entry.save()
        self.assertContains(self.client.get('/'), 'alt="学院网站二维码"')
        self.publish(entry)
        self.assertNotContains(self.client.get('/'), 'alt="学院网站二维码"')
