from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('content', '0002_contententry')]
    operations = [
        migrations.AddField(model_name='contententry', name='collection', field=models.CharField('所属列表栏目', max_length=100, blank=True, help_text='新增栏目文章、方向、平台或团队时选择；每个栏目可新增多条。')),
        migrations.AddField(model_name='contententry', name='direction', field=models.CharField('关联研究方向', max_length=100, blank=True, help_text='课题组可关联一条已发布的研究方向。')),
    ]
