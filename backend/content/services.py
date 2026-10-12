from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import Article, Publication, AuditEvent, CONTENT_FIELDS

class Conflict(Exception):
    """读取后内容已经变化，必须重新打开，不覆盖他人修改。"""

@transaction.atomic
def save_draft(article, expected_revision, user, submit=False):
    permission = 'content.change_article' if article.pk else 'content.add_article'
    if not user.has_perm(permission):
        raise PermissionDenied
    article.full_clean(exclude=['updated_by'])
    values = {name: getattr(article, name) for name in CONTENT_FIELDS}
    values.update(state='submitted' if submit else 'draft', updated_by=user, updated_at=timezone.now())
    if article.pk:
        current = Article.objects.get(pk=article.pk)
        if current.slug != article.slug:
            raise ValidationError('地址标识创建后不能更改。')
        changed = Article.objects.filter(pk=article.pk, revision=expected_revision).update(**values, revision=F('revision') + 1)
        if not changed:
            raise Conflict('此内容已由其他窗口修改，请重新打开后再保存。')
        article.refresh_from_db()
    else:
        for name, value in values.items():
            setattr(article, name, value)
        article.revision = 1
        article.save()
    AuditEvent.objects.create(article=article, actor=user, action='提交审核' if submit else '保存草稿', revision=article.revision)
    return article

@transaction.atomic
def review_article(article_id, expected_revision, user, decision):
    if not user.has_perm('content.review_article'):
        raise PermissionDenied
    article = Article.objects.get(pk=article_id)
    if article.revision != expected_revision:
        raise Conflict('草稿已更新，请查看新版本后再审核。')
    if decision == 'approve':
        if article.state != 'submitted':
            raise ValidationError('请先将草稿提交审核。')
        Publication.objects.update_or_create(article=article, defaults={
            **{name: getattr(article, name) for name in CONTENT_FIELDS},
            'revision': article.revision, 'approved_by': user,
        })
        action, state = '批准预览', 'approved'
    elif decision == 'withdraw':
        Publication.objects.filter(article=article).delete()
        action, state = '撤下预览', 'draft'
    elif decision == 'return':
        action, state = '退回修改', 'draft'
    else:
        raise ValidationError('不支持的操作。')
    # 审核也推进版本，防止审核前打开的编辑页覆盖新的审核状态。
    changed = Article.objects.filter(pk=article_id, revision=expected_revision).update(state=state, revision=F('revision') + 1, updated_at=timezone.now())
    if not changed:
        raise Conflict('草稿已更新，请重新打开。')
    AuditEvent.objects.create(article=article, actor=user, action=action, revision=expected_revision)

