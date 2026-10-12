from django import forms
from .models import Article

class ArticleForm(forms.ModelForm):
    expected_revision = forms.IntegerField(widget=forms.HiddenInput, min_value=0, initial=0)
    submit_for_review = forms.BooleanField(label='保存后提交审核', required=False, help_text='不勾选则只保存草稿；前台继续显示上次批准的内容。')

    class Meta:
        model = Article
        fields = ['category', 'slug', 'title', 'summary', 'body', 'source', 'date', 'image', 'image_alt', 'is_placeholder']
        widgets = {'body': forms.Textarea(attrs={'rows': 18})}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields['expected_revision'].initial = self.instance.revision

    def clean_slug(self):
        slug = self.cleaned_data['slug']
        if not slug.startswith(('news-', 'notice-')):
            raise forms.ValidationError('地址标识须以 news- 或 notice- 开头，如 news-demo-20261012。')
        return slug

    def clean(self):
        cleaned = super().clean()
        if self.instance.pk and not Article.objects.filter(pk=self.instance.pk, revision=cleaned.get('expected_revision')).exists():
            raise forms.ValidationError('此内容已更新，请复制你的修改文字后重新打开。为防止覆盖，本次没有保存。')
        return cleaned

class ReviewForm(forms.Form):
    expected_revision = forms.IntegerField(widget=forms.HiddenInput, min_value=1)
    decision = forms.ChoiceField(label='操作', choices=[('approve', '批准到开发预览'), ('return', '退回修改（保留旧预览）'), ('withdraw', '撤下前台预览')])

