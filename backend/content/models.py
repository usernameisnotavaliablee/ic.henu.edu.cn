from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.core.exceptions import ValidationError
from django.db import models
from django.urls import reverse

IMAGE_CHOICES = [
    ('chip-banner.svg', '原创芯片示意'), ('campus-gate.jpg', '校园牌坊（占位）'),
    ('campus-courtyard.jpg', '校园庭院（占位）'), ('campus-landscape.jpg', '校园风光（占位）'),
    ('campus-building.jpg', '校园楼宇（占位）'), ('wafer-closeup.jpg', '硅晶圆（学科示意）'),
    ('cleanroom-lcn.jpg', '校外洁净室（示意）'),
    ('oscilloscope-waveform.jpg', '示波器波形（校外示意）'),
    ('microscopy-instruments.jpg', '微纳表征仪器（校外示意）'),
    ('wafer-12inch.jpg', '12英寸晶圆（学科示意）'),
    ('wafer-display.jpg', '晶圆与器件展品（科普示意）'),
]

class ArticleFields(models.Model):
    slug = models.SlugField('地址标识', max_length=80, unique=True, help_text='字母、数字或短横线；创建后固定，避免旧链接失效。')
    category = models.CharField('栏目', max_length=10, choices=[('news', '学院新闻'), ('notice', '通知公告')])
    title = models.CharField('标题', max_length=160)
    summary = models.CharField('摘要', max_length=400)
    body = models.TextField('正文', validators=[MaxLengthValidator(30000)], help_text='纯文本，空行分段；小标题独占一段，以 ## 加空格开头，前后用空行分隔；HTML会作为文字显示，不运行脚本。')
    source = models.CharField('来源', max_length=100, default='学院提供（待核对）')
    date = models.DateField('展示日期', null=True, blank=True)
    image = models.CharField('配图', max_length=80, choices=IMAGE_CHOICES, default='chip-banner.svg')
    image_alt = models.CharField('图片说明', max_length=200, default='原创芯片学科示意，非新闻现场')
    is_placeholder = models.BooleanField('示例内容（待学院确认）', default=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('article', args=[self.slug])

class Article(ArticleFields):
    state = models.CharField('草稿状态', max_length=12, default='draft', choices=[('draft', '编辑中'), ('submitted', '待审核'), ('approved', '已批准预览')])
    revision = models.PositiveIntegerField('草稿版本', default=1, editable=False)
    updated_at = models.DateTimeField('更新于', auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+', editable=False)

    def clean(self):
        super().clean()
        if not self.slug.startswith(('news-', 'notice-')):
            raise ValidationError({'slug': '地址标识须以 news- 或 notice- 开头。'})

    class Meta:
        verbose_name = '新闻与通知草稿'
        verbose_name_plural = verbose_name
        permissions = [('review_article', '可以审核或撤下预览内容')]
        ordering = ['-updated_at']

class Publication(ArticleFields):
    article = models.OneToOneField(Article, on_delete=models.PROTECT, related_name='publication')
    revision = models.PositiveIntegerField('已批准版本')
    approved_at = models.DateTimeField('批准于', auto_now=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')

    class Meta:
        verbose_name = '前台预览快照'
        verbose_name_plural = verbose_name
        ordering = ['-date', '-approved_at', '-pk']

class AuditEvent(models.Model):
    article = models.ForeignKey(Article, on_delete=models.PROTECT)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField('操作', max_length=30)
    revision = models.PositiveIntegerField('版本')
    occurred_at = models.DateTimeField('时间', auto_now_add=True)

    class Meta:
        verbose_name = '内容操作记录'
        verbose_name_plural = verbose_name
        ordering = ['-occurred_at']

CONTENT_FIELDS = ('slug', 'category', 'title', 'summary', 'body', 'source', 'date', 'image', 'image_alt', 'is_placeholder')


class ContentEntry(models.Model):
    collection = models.CharField('所属列表栏目', max_length=100, blank=True, help_text='新增栏目文章、方向、平台或团队时选择；每个栏目可新增多条。')
    direction = models.CharField('关联研究方向', max_length=100, blank=True, help_text='课题组可关联一条已发布的研究方向。')
    key = models.CharField('内容位置', max_length=100, unique=True, help_text='从页面位置选择；新增教师使用 teacher- 开头的英文标识。保存后不可更换。')
    title = models.CharField('标题／姓名', max_length=160)
    subtitle = models.CharField('副标题／职称', max_length=200, blank=True)
    summary = models.TextField('简介／摘要', blank=True, validators=[MaxLengthValidator(3000)])
    body = models.TextField('完整内容', blank=True, validators=[MaxLengthValidator(30000)], help_text='纯文本；空行分段；以 ## 开头的一行作为小标题。可保留论文、课程、研究方向及联系方式。')
    image = models.CharField('图片', max_length=100, blank=True)
    image_alt = models.CharField('图片说明', max_length=200, blank=True)
    source_url = models.URLField('来源链接', blank=True)
    source_label = models.CharField('来源名称', max_length=200, blank=True)
    date = models.DateField('展示日期', null=True, blank=True)
    sort_order = models.PositiveIntegerField('排序（越小越靠前）', default=100)
    is_visible = models.BooleanField('前台展示', default=True, help_text='关闭后仍须执行发布，才会从前台撤下。')
    college = models.CharField('学院名称', max_length=100, blank=True)
    english = models.CharField('学院英文名称', max_length=200, blank=True)
    motto = models.CharField('院训／标识区文字', max_length=100, blank=True)
    address = models.CharField('办公地址', max_length=300, blank=True)
    phone = models.CharField('公开电话', max_length=100, blank=True)
    email = models.EmailField('公开邮箱', blank=True)
    account_name = models.CharField('公众号名称', max_length=100, blank=True)
    qr_image = models.CharField('公众号二维码图片', max_length=100, blank=True)
    published = models.JSONField('前台已发布快照', default=dict, blank=True, editable=False)
    updated_at = models.DateTimeField('草稿更新于', auto_now=True)

    def __str__(self):
        return self.title

    def clean(self):
        import re
        from .editable import catalog, asset_choices
        super().clean()
        allowed = catalog()['slots']
        if self.key != 'site' and self.key not in allowed and not re.fullmatch(r'(teacher|entry)-[a-z0-9]+(?:-[a-z0-9]+)*', self.key):
            raise ValidationError({'key': '请选择现有栏目位置，或使用 teacher- 开头的教师标识。'})
        collections = {c['key']: c for c in catalog().get('collections', [])}
        if self.key.startswith('entry-') and self.collection not in collections:
            raise ValidationError({'collection': '新增条目必须选择有效栏目。'})
        if not self.key.startswith('entry-') and self.collection:
            raise ValidationError({'collection': '原有固定位置无需选择栏目；请通过新增栏目条目创建多篇内容。'})
        if self.direction:
            target = type(self).objects.filter(key=self.direction).first()
            snapshot = target.published if target else {}
            target_collection = snapshot.get('collection') or ('science-innovation.section-1' if self.direction == 'science-innovation.section-1' else '')
            if self.collection != 'research-groups.section-1' or target_collection != 'science-innovation.section-1' or not snapshot.get('is_visible', False):
                raise ValidationError({'direction': '请选择已发布的研究方向，仅课题组使用此关联。'})
        if self.pk and type(self).objects.filter(pk=self.pk).exclude(key=self.key).exists():
            raise ValidationError({'key': '内容位置不能更换，请新增对应条目。'})
        assets = dict(asset_choices())
        for field in ('image', 'qr_image'):
            if getattr(self, field) not in assets:
                raise ValidationError({field: '请选择已归档到本站 assets 的图片。'})

    def snapshot(self):
        data = {field.name: getattr(self, field.name) for field in self._meta.fields if field.name not in {'id', 'published', 'updated_at'}}
        data['date'] = self.date.isoformat() if self.date else ''
        return data

    class Meta:
        verbose_name = '教师、栏目与站点资料'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'key']
        permissions = [('publish_contententry', '可以发布教师、栏目与站点资料')]
