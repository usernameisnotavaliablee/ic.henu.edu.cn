"""Keep existing publication snapshots usable after the main branch removed the SVG."""
from django.db import migrations


def rename_published_image(apps, schema_editor):
    entries = apps.get_model('content', 'ContentEntry').objects.using(schema_editor.connection.alias)
    for entry in entries.filter(published__image='chip-banner.svg').only('pk', 'published').iterator():
        snapshot = entry.published
        if not isinstance(snapshot, dict) or snapshot.get('image') != 'chip-banner.svg':
            continue
        # Do not call snapshot()/save(): unpublished draft changes must not reach the public page.
        updated = dict(snapshot, image='chip-banner.jpg')
        entries.filter(pk=entry.pk, published=snapshot).update(published=updated)


class Migration(migrations.Migration):
    dependencies = [('content', '0006_chip_banner_jpg')]
    # Like 0006, reversal must not restore a reference to the removed runtime asset.
    operations = [migrations.RunPython(rename_published_image, migrations.RunPython.noop)]
