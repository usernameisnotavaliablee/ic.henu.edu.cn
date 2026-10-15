from django import forms
from django.contrib import admin, messages
from django.db import transaction
from django.core.exceptions import ValidationError
from django.urls import reverse
from .editable import catalog, asset_choices
from .models import ContentEntry


class ContentEntryForm(forms.ModelForm):
    key = forms.ChoiceField(label='内容位置')
    teacher_slug = forms.SlugField(label='新增条目地址标识', required=False, max_length=90, help_text='教师使用teacher-开头；栏目文章/团队/方向使用entry-开头，例如entry-career-guide。创建后固定。')

    class Meta:
        model = ContentEntry
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'key' in self.fields:
            self.fields['key'].choices = [('', '请选择'), ('__new_entry__', '新增栏目文章／方向／平台／课题组'), ('site', '站点信息／联系方式／公众号／院徽院训')] + list(catalog()['slots'].items()) + [(t['key'], '教师：' + t['title']) for t in catalog()['teachers']] + [('__new_teacher__', '新增教师')]
            if self.instance.pk and self.instance.key not in dict(self.fields['key'].choices):
                self.fields['key'].choices.append((self.instance.key, self.instance.title))
        if 'collection' in self.fields:
            self.fields['collection'] = forms.ChoiceField(label='所属列表栏目', required=False, choices=[('', '固定位置或教师无需选择')] + [(c['key'], catalog()['slots'][c['key']]) for c in catalog().get('collections', [])])
        if 'direction' in self.fields:
            choices = [('', '暂不关联')]
            for row in ContentEntry.objects.exclude(published={}):
                snap = row.published
                if snap.get('is_visible', True) and (snap.get('collection') == 'science-innovation.section-1' or row.key == 'science-innovation.section-1'):
                    choices.append((row.key, snap.get('title', row.key)))
            if self.instance.direction and self.instance.direction not in dict(choices):
                choices.append((self.instance.direction, self.instance.direction + '（已撤下，请调整关联）'))
            self.fields['direction'] = forms.ChoiceField(label='课题组关联研究方向', required=False, choices=choices)
        if 'teacher_category' in self.fields:
            self.fields['teacher_category'] = forms.ChoiceField(label='师资分类', required=False, choices=[('', '待学院确认／暂未分类')] + [(c['id'], c['label']) for c in catalog()['facultyCategories']])
        for name in ('image', 'qr_image', 'website_qr_image'):
            if name in self.fields:
                self.fields[name] = forms.ChoiceField(label=self.fields[name].label, choices=asset_choices(), required=False, help_text='从本站已归档图片选择。新照片或二维码放入运行版 assets 后刷新此页面即可选取。')
        if self.instance.key == 'site' or self.initial.get('key') == 'site' or self.data.get('key') == 'site':
            if 'body' in self.fields:
                self.fields['body'].label = '页脚备案与平台说明'
                self.fields['body'].help_text = '等待学校提供正式备案信息后填写，不能虚构备案号。'

    def clean(self):
        values = super().clean()
        if values.get('key') in ('__new_teacher__', '__new_entry__'):
            prefix = 'teacher-' if values['key'] == '__new_teacher__' else 'entry-'
            key = values.get('teacher_slug', '')
            if not key.startswith(prefix):
                self.add_error('teacher_slug', '请填写 ' + prefix + ' 开头的地址标识。')
            values['key'] = key
        return values


@admin.register(ContentEntry)
class ContentEntryAdmin(admin.ModelAdmin):
    form = ContentEntryForm
    change_list_template = 'admin/content_entries.html'
    list_display = ('title', 'key', 'collection', 'sort_order', 'publication_state', 'updated_at')
    list_filter = ('collection',)
    search_fields = ('title', 'key')
    actions = ['publish_selected']
    readonly_fields = ('updated_at', 'publication_state')
    save_on_top = True

    @admin.display(description='发布状态')
    def publication_state(self, obj):
        if not obj.published:
            return '未发布，前台保持原资料或占位'
        return '草稿有未发布修改' if obj.snapshot() != obj.published else ('已发布' if obj.is_visible else '已撤下')

    def get_readonly_fields(self, request, obj=None):
        return self.readonly_fields + (('key',) if obj else ())

    def has_delete_permission(self, request, obj=None):
        return False

    def get_fields(self, request, obj=None):
        key = obj.key if obj else request.POST.get('key', request.GET.get('key', ''))
        fields = ['key', 'title']
        if not obj:
            fields.append('teacher_slug')
        if key == 'site':
            fields += ['college', 'english', 'motto', 'image', 'image_alt', 'address', 'phone', 'email', 'account_name', 'qr_image', 'website_qr_image', 'body']
        else:
            fields += ['collection', 'direction', 'subtitle', 'summary', 'body', 'date', 'image', 'image_alt', 'source_label', 'source_url', 'sort_order', 'is_visible']
            if key.startswith('teacher-') or key == '__new_teacher__' or not key:
                fields.insert(fields.index('subtitle'), 'teacher_category')
            if not key.startswith('teacher-') and key != '__new_teacher__':
                fields += ['service_url', 'service_label']
        return fields + ['publication_state', 'updated_at']

    def get_changeform_initial_data(self, request):
        data = super().get_changeform_initial_data(request)
        key = data.get('key')
        if key == 'site':
            data.update(catalog()['site'], title='学院站点信息')
        elif key in catalog()['slots']:
            data['title'] = catalog()['slots'][key].split(' / ')[-1]
            data.update(catalog().get('defaults', {}).get(key, {}))
        else:
            teacher = next((t for t in catalog()['teachers'] if t['key'] == key), None)
            if teacher:
                data.update(teacher)
        return data

    def changelist_view(self, request, extra_context=None):
        existing = dict(ContentEntry.objects.values_list('key', 'pk'))
        slots = [('site', '站点信息、联系与公众号')] + list(catalog()['slots'].items()) + [(t['key'], '教师：' + t['title']) for t in catalog()['teachers']]
        links = [{'label': label, 'url': reverse('admin:content_contententry_change', args=[existing[key]]) if key in existing else reverse('admin:content_contententry_add') + '?key=' + key} for key, label in slots]
        return super().changelist_view(request, {**(extra_context or {}), 'content_slots': links})

    def save_model(self, request, obj, form, change):
        # 编辑保存不覆盖并发发布的快照；草稿不会自动发布。
        obj.save(update_fields=[f.name for f in obj._meta.fields if f.name not in {'id', 'published'}] if change else None)

    def has_publish_permission(self, request):
        return request.user.has_perm('content.publish_contententry')

    @admin.action(description='将所选资料发布到预览前台（含撤下设置）', permissions=['publish'])
    def publish_selected(self, request, queryset):
        try:
            with transaction.atomic():
                for obj in queryset.select_for_update():
                    obj.full_clean()
                    obj.published = obj.snapshot()
                    obj.save(update_fields=['published'])
                    self.log_change(request, obj, '发布资料快照' if obj.is_visible else '撤下资料')
        except ValidationError as exc:
            self.message_user(request, '本次未发布，请修正资料：' + '；'.join(exc.messages), messages.ERROR)
            return
        self.message_user(request, '已发布所选资料；后续编辑仍需再次发布。', messages.SUCCESS)
