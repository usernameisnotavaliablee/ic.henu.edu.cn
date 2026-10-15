"""Exercise the real 0005→0007 upgrade in Django's isolated test database."""
from datetime import date

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class ChipImageMigrationTests(TransactionTestCase):
    migrate_from = [('content', '0005_article_body_heading_help')]
    migrate_to = [('content', '0007_published_chip_image')]

    def setUp(self):
        super().setUp()
        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_from)
        self.old_apps = executor.loader.project_state(self.migrate_from).apps

    def tearDown(self):
        try:
            MigrationExecutor(connection).migrate(self.migrate_to)
        finally:
            super().tearDown()

    def test_upgrade_preserves_drafts_snapshots_visibility_and_metadata(self):
        Article = self.old_apps.get_model('content', 'Article')
        Publication = self.old_apps.get_model('content', 'Publication')
        Entry = self.old_apps.get_model('content', 'ContentEntry')
        Audit = self.old_apps.get_model('content', 'AuditEvent')
        article = Article.objects.create(slug='news-migration-check', category='news',
            title='Unpublished draft', summary='Draft summary', body='Draft body',
            image='chip-banner.svg', state='submitted', revision=9, date=date(2026, 10, 15))
        Publication.objects.create(article=article, slug=article.slug, category='news',
            title='Approved title', summary='Approved summary', body='Approved body',
            image='chip-banner.svg', revision=2, date=date(2026, 10, 1))
        Audit.objects.create(article=article, action='approve', revision=2)
        published = {'title': 'Published title', 'body': 'Published body', 'image': 'chip-banner.svg',
                     'is_visible': True, 'date': '2026-10-01', 'unknown_metadata': {'keep': [1, 2]}}
        for key, draft_image, snapshot in [
            ('entry-old-snapshot', 'campus-gate.jpg', published),
            ('entry-old-draft', 'chip-banner.svg', dict(published, image='campus-building.jpg')),
            ('entry-empty', 'chip-banner.svg', {}),
            ('entry-withdrawn', 'campus-courtyard.jpg', dict(published, is_visible=False)),
            ('entry-already-jpg', 'campus-gate.jpg', dict(published, image='chip-banner.jpg')),
            ('entry-other-path', 'campus-gate.jpg', dict(published, image='other/chip-banner.svg')),
        ]:
            Entry.objects.create(key=key, title='Draft title', body='Draft body', image=draft_image,
                is_visible=False, sort_order=7, date=date(2026, 10, 15), published=snapshot)
        before = {name: list(model.objects.order_by('pk').values())
                  for name, model in [('Article', Article), ('Publication', Publication), ('ContentEntry', Entry), ('AuditEvent', Audit)]}

        # Prove the upstream 0006 gap: draft columns change, published JSON does not.
        executor = MigrationExecutor(connection)
        executor.migrate([('content', '0006_chip_banner_jpg')])
        entry = Entry.objects.get(key='entry-old-snapshot')
        self.assertEqual(entry.published['image'], 'chip-banner.svg')
        self.assertEqual(Entry.objects.get(key='entry-old-draft').image, 'chip-banner.jpg')

        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_to)
        apps = executor.loader.project_state(self.migrate_to).apps
        for name, records in before.items():
            after = list(apps.get_model('content', name).objects.order_by('pk').values())
            self.assertEqual(len(after), len(records))
            for old, current in zip(records, after):
                expected = dict(old)
                if name != 'AuditEvent' and expected['image'] == 'chip-banner.svg':
                    expected['image'] = 'chip-banner.jpg'
                if name == 'ContentEntry' and expected['published'].get('image') == 'chip-banner.svg':
                    expected['published'] = dict(expected['published'], image='chip-banner.jpg')
                self.assertEqual(current, expected, f'{name} pk={old["id"]}')
