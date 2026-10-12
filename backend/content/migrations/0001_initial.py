from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.db import migrations, models
import django.db.models.deletion

def content_fields():
    return [
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('slug', models.SlugField(help_text='字母、数字或短横线；创建后固定，避免旧链接失效。', max_length=80, unique=True, verbose_name='地址标识')),
        ('category', models.CharField(choices=[('news', '学院新闻'), ('notice', '通知公告')], max_length=10, verbose_name='栏目')),
        ('title', models.CharField(max_length=160, verbose_name='标题')),
        ('summary', models.CharField(max_length=400, verbose_name='摘要')),
        ('body', models.TextField(help_text='纯文本，空行分段；HTML会作为文字显示，不运行脚本。', validators=[MaxLengthValidator(30000)], verbose_name='正文')),
        ('source', models.CharField(default='学院提供（待核对）', max_length=100, verbose_name='来源')),
        ('date', models.DateField(blank=True, null=True, verbose_name='展示日期')),
        ('image', models.CharField(choices=[('chip-banner.svg', '原创芯片示意'), ('campus-gate.jpg', '校园牌坊（占位）'), ('campus-courtyard.jpg', '校园庭院（占位）'), ('campus-landscape.jpg', '校园风光（占位）'), ('campus-building.jpg', '校园楼宇（占位）'), ('wafer-closeup.jpg', '硅晶圆（学科示意）'), ('cleanroom-lcn.jpg', '校外洁净室（示意）')], default='chip-banner.svg', max_length=80, verbose_name='配图')),
        ('image_alt', models.CharField(default='原创芯片学科示意，非新闻现场', max_length=200, verbose_name='图片说明')),
        ('is_placeholder', models.BooleanField(default=True, verbose_name='示例内容（待学院确认）')),
    ]

class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(name='Article', fields=content_fields() + [
            ('state', models.CharField(choices=[('draft', '编辑中'), ('submitted', '待审核'), ('approved', '已批准预览')], default='draft', max_length=12, verbose_name='草稿状态')),
            ('revision', models.PositiveIntegerField(default=1, editable=False, verbose_name='草稿版本')),
            ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新于')),
            ('updated_by', models.ForeignKey(editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
        ], options={'verbose_name': '新闻与通知草稿', 'verbose_name_plural': '新闻与通知草稿', 'ordering': ['-updated_at'], 'permissions': [('review_article', '可以审核或撤下预览内容')]}),
        migrations.CreateModel(name='Publication', fields=content_fields() + [
            ('revision', models.PositiveIntegerField(verbose_name='已批准版本')),
            ('approved_at', models.DateTimeField(auto_now=True, verbose_name='批准于')),
            ('article', models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name='publication', to='content.article')),
            ('approved_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
        ], options={'verbose_name': '前台预览快照', 'verbose_name_plural': '前台预览快照', 'ordering': ['-date', '-approved_at', '-pk']}),
        migrations.CreateModel(name='AuditEvent', fields=[
            ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ('action', models.CharField(max_length=30, verbose_name='操作')),
            ('revision', models.PositiveIntegerField(verbose_name='版本')),
            ('occurred_at', models.DateTimeField(auto_now_add=True, verbose_name='时间')),
            ('actor', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ('article', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='content.article')),
        ], options={'verbose_name': '内容操作记录', 'verbose_name_plural': '内容操作记录', 'ordering': ['-occurred_at']}),
    ]
