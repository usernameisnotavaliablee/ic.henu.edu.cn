# Generated for SVG -> JPG asset conversion (admin site cannot accept SVG uploads)

from django.db import migrations, models


def rename_image(apps, schema_editor):
    for model_name, field in [('Article', 'image'), ('Publication', 'image'), ('ContentEntry', 'image')]:
        model = apps.get_model('content', model_name)
        model.objects.filter(**{field: 'chip-banner.svg'}).update(**{field: 'chip-banner.jpg'})


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0005_article_body_heading_help'),
    ]

    operations = [
        migrations.AlterField(
            model_name='article',
            name='image',
            field=models.CharField(choices=[('chip-banner.jpg', '原创芯片示意'), ('campus-gate.jpg', '校园牌坊（占位）'), ('campus-courtyard.jpg', '校园庭院（占位）'), ('campus-landscape.jpg', '校园风光（占位）'), ('campus-building.jpg', '校园楼宇（占位）'), ('wafer-closeup.jpg', '硅晶圆（学科示意）'), ('cleanroom-lcn.jpg', '校外洁净室（示意）'), ('oscilloscope-waveform.jpg', '示波器波形（校外示意）'), ('microscopy-instruments.jpg', '微纳表征仪器（校外示意）'), ('wafer-12inch.jpg', '12英寸晶圆（学科示意）'), ('wafer-display.jpg', '晶圆与器件展品（科普示意）')], default='chip-banner.jpg', max_length=80, verbose_name='配图'),
        ),
        migrations.AlterField(
            model_name='publication',
            name='image',
            field=models.CharField(choices=[('chip-banner.jpg', '原创芯片示意'), ('campus-gate.jpg', '校园牌坊（占位）'), ('campus-courtyard.jpg', '校园庭院（占位）'), ('campus-landscape.jpg', '校园风光（占位）'), ('campus-building.jpg', '校园楼宇（占位）'), ('wafer-closeup.jpg', '硅晶圆（学科示意）'), ('cleanroom-lcn.jpg', '校外洁净室（示意）'), ('oscilloscope-waveform.jpg', '示波器波形（校外示意）'), ('microscopy-instruments.jpg', '微纳表征仪器（校外示意）'), ('wafer-12inch.jpg', '12英寸晶圆（学科示意）'), ('wafer-display.jpg', '晶圆与器件展品（科普示意）')], default='chip-banner.jpg', max_length=80, verbose_name='配图'),
        ),
        migrations.RunPython(rename_image, migrations.RunPython.noop),
    ]
