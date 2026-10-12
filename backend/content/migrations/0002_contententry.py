from django.core.validators import MaxLengthValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('content', '0001_initial')]
    operations = [migrations.CreateModel(name='ContentEntry', fields=[
        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
        ('key', models.CharField('内容位置', max_length=100, unique=True, help_text='从页面位置选择；新增教师使用 teacher- 开头的英文标识。保存后不可更换。')),
        ('title', models.CharField('标题／姓名', max_length=160)),
        ('subtitle', models.CharField('副标题／职称', max_length=200, blank=True)),
        ('summary', models.TextField('简介／摘要', blank=True, validators=[MaxLengthValidator(3000)])),
        ('body', models.TextField('完整内容', blank=True, validators=[MaxLengthValidator(30000)], help_text='纯文本；空行分段；以 ## 开头的一行作为小标题。可保留论文、课程、研究方向及联系方式。')),
        ('image', models.CharField('图片', max_length=100, blank=True)),
        ('image_alt', models.CharField('图片说明', max_length=200, blank=True)),
        ('source_url', models.URLField('来源链接', blank=True)),
        ('source_label', models.CharField('来源名称', max_length=200, blank=True)),
        ('date', models.DateField('展示日期', null=True, blank=True)),
        ('sort_order', models.PositiveIntegerField('排序（越小越靠前）', default=100)),
        ('is_visible', models.BooleanField('前台展示', default=True, help_text='关闭后仍须执行发布，才会从前台撤下。')),
        ('college', models.CharField('学院名称', max_length=100, blank=True)),
        ('english', models.CharField('学院英文名称', max_length=200, blank=True)),
        ('motto', models.CharField('院训／标识区文字', max_length=100, blank=True)),
        ('address', models.CharField('办公地址', max_length=300, blank=True)),
        ('phone', models.CharField('公开电话', max_length=100, blank=True)),
        ('email', models.EmailField('公开邮箱', max_length=254, blank=True)),
        ('account_name', models.CharField('公众号名称', max_length=100, blank=True)),
        ('qr_image', models.CharField('公众号二维码图片', max_length=100, blank=True)),
        ('published', models.JSONField('前台已发布快照', default=dict, blank=True, editable=False)),
        ('updated_at', models.DateTimeField('草稿更新于', auto_now=True)),
    ], options={'verbose_name': '教师、栏目与站点资料', 'verbose_name_plural': '教师、栏目与站点资料', 'ordering': ['sort_order', 'key'], 'permissions': [('publish_contententry', '可以发布教师、栏目与站点资料')]})]
