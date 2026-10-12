from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import OperationalError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import path, reverse
from django.utils.html import format_html
from .forms import ArticleForm, ReviewForm
from .models import Article, Publication, AuditEvent
from .services import save_draft, review_article, Conflict
from . import entry_admin  # 注册教师、栏目与站点资料的后台入口

admin.site.site_header = '学院网站 · 开发预览管理'
admin.site.site_title = '开发预览管理'
admin.site.index_title = '仅供演示，不会发布到学校官网'

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    form = ArticleForm
    list_display = ('title', 'category', 'state', 'revision', 'updated_at', 'review_link')
    list_filter = ('category', 'state', 'is_placeholder')
    search_fields = ('title', 'summary')
    list_per_page = 20
    readonly_fields = ('state', 'revision', 'updated_at', 'updated_by', 'review_link')
    fields = ('category', 'slug', 'title', 'summary', 'body', 'source', 'date', 'image', 'image_alt', 'is_placeholder', 'state', 'revision', 'updated_at', 'updated_by', 'review_link', 'expected_revision', 'submit_for_review')
    save_on_top = True
    actions = None

    def get_readonly_fields(self, request, obj=None):
        return self.readonly_fields + (('slug',) if obj else ())

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description='审核与预览')
    def review_link(self, obj):
        if not obj.pk:
            return '保存后可查看'
        return format_html('<a href="{}">查看草稿并审核 →</a>', reverse('admin:content_article_review', args=[obj.pk]))

    def get_urls(self):
        return [path('<int:article_id>/review/', self.admin_site.admin_view(self.review_view), name='content_article_review')] + super().get_urls()

    def save_model(self, request, obj, form, change):
        save_draft(obj, form.cleaned_data['expected_revision'], request.user, form.cleaned_data['submit_for_review'])

    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        try:
            return super().changeform_view(request, object_id, form_url, extra_context)
        except Conflict as exc:
            return HttpResponse(str(exc), status=409, content_type='text/plain; charset=utf-8')
        except OperationalError as exc:
            if 'locked' not in str(exc).lower():
                raise
            return HttpResponse('数据库正忙，本次没有保存。请稍后重新打开。', status=409)

    def review_view(self, request, article_id):
        if not self.has_view_permission(request):
            raise PermissionDenied
        article = get_object_or_404(Article, pk=article_id)
        can_review = request.user.has_perm('content.review_article')
        form = ReviewForm(request.POST or None, initial={'expected_revision': article.revision})
        if request.method == 'POST':
            if not can_review:
                raise PermissionDenied
            if form.is_valid():
                try:
                    review_article(article_id, form.cleaned_data['expected_revision'], request.user, form.cleaned_data['decision'])
                except (Conflict, ValidationError) as exc:
                    form.add_error(None, str(exc))
                else:
                    self.message_user(request, '操作已保存到开发预览，学校官网不受影响。', messages.SUCCESS)
                    return redirect('admin:content_article_changelist')
        return render(request, 'admin/article_review.html', {
            **self.admin_site.each_context(request), 'title': '核对草稿并审核',
            'article': article, 'form': form, 'can_review': can_review,
            'opts': self.model._meta,
        })

@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'revision', 'approved_at', 'approved_by')
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ('occurred_at', 'article', 'actor', 'action', 'revision')
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
