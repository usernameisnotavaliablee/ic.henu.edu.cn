"""只使用隔离测试库，验证集合发布与旧栏目兼容。"""
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.urls import reverse
from .models import ContentEntry


@override_settings(ALLOWED_HOSTS=['testserver'], PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class CollectionTests(TestCase):
    def setUp(self):
        self.client.force_login(User.objects.create_superuser('collections-admin', password='isolated-test-password'))

    def publish(self, entry):
        response = self.client.post(reverse('admin:content_contententry_changelist'), {
            'action': 'publish_selected', '_selected_action': [entry.pk]})
        self.assertEqual(response.status_code, 302)
        entry.refresh_from_db()
        self.assertEqual(entry.published, entry.snapshot())

    def make_entry(self, key, collection='admissions.section-3', **kwargs):
        entry = ContentEntry.objects.create(key=key, collection=collection, title=key, **kwargs)
        self.publish(entry)
        return entry

    def test_list_pagination_and_snapshot_move(self):
        for i in range(11):
            self.make_entry(f'entry-guide-{i}', sort_order=i, summary='摘要', body='仅详情展示的完整正文')
        response = self.client.get('/admissions-section-3.html')
        self.assertEqual(len(response.context['page']), 10)
        self.assertNotContains(response, '仅详情展示的完整正文')
        self.assertEqual(len(self.client.get('/admissions-section-3.html?page=2').context['page']), 1)
        entry = ContentEntry.objects.get(key='entry-guide-0')
        entry.collection = 'admissions.section-1'
        entry.title = '尚未发布的新标题'
        entry.save()
        self.assertNotContains(self.client.get('/entry-guide-0.html'), entry.title)
        self.assertContains(self.client.get('/admissions-section-3.html'), 'entry-guide-0.html')
        self.publish(entry)
        self.assertNotContains(self.client.get('/admissions-section-3.html'), 'entry-guide-0.html')
        self.assertContains(self.client.get('/admissions-section-1.html'), entry.title)

    def test_draft_hidden_and_legacy_details(self):
        draft = ContentEntry.objects.create(key='entry-draft', collection='admissions.section-3', title='未发布草稿')
        self.assertEqual(self.client.get('/entry-draft.html').status_code, 404)
        self.assertNotContains(self.client.get('/admissions.html'), draft.title)
        legacy = self.make_entry('admissions.section-3', collection='', summary='原有摘要', body='原有完整正文')
        self.assertContains(self.client.get('/admissions.html'), 'record-admissions-section-3.html')
        self.assertNotContains(self.client.get('/admissions.html'), legacy.body)
        response = self.client.get('/record-admissions-section-3.html')
        self.assertContains(response, legacy.body)
        self.assertContains(response, 'href="admissions-section-3.html"')
        legacy.is_visible = False
        legacy.save()
        self.publish(legacy)
        self.assertEqual(self.client.get('/record-admissions-section-3.html').status_code, 404)
        self.assertNotContains(self.client.get('/admissions.html'), '版式占位')

    def test_direction_multiple_groups(self):
        direction = self.make_entry('entry-direction', 'science-innovation.section-1')
        self.make_entry('entry-team-a', 'research-groups.section-1', direction=direction.key)
        self.make_entry('entry-team-b', 'research-groups.section-1', direction=direction.key)
        self.make_entry('entry-other-team', 'research-groups.section-1')
        response = self.client.get('/entry-direction.html')
        self.assertContains(response, 'entry-team-a.html')
        self.assertContains(response, 'entry-team-b.html')
        self.assertNotContains(response, 'entry-other-team.html')

    def test_admin_add_collection_entry(self):
        response = self.client.post(reverse('admin:content_contententry_add'), {
            'key': '__new_entry__', 'teacher_slug': 'entry-admin-added',
            'collection': 'admissions.section-3', 'title': '后台新增测试',
            'summary': '列表摘要', 'body': '详细内容', 'date': '2026-10-12',
            'sort_order': '100', 'is_visible': 'on', '_save': '保存'})
        self.assertEqual(response.status_code, 302, response.context and response.context['adminform'].form.errors)
        entry = ContentEntry.objects.get(key='entry-admin-added')
        self.assertFalse(entry.published)
        self.assertEqual(self.client.get('/entry-admin-added.html').status_code, 404)
        self.publish(entry)
        self.assertContains(self.client.get('/entry-admin-added.html'), '详细内容')

    def test_layout_pages_not_public(self):
        self.assertEqual(self.client.get('/layout-admissions-section-3.html').status_code, 404)
