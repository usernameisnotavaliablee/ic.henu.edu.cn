#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""预览后台功能闭环验收（真实 HTTP，不用测试客户端）。

走一遍：登录 → 新增 → 保存草稿 → 提交审核 → 批准 → 前台展示
      → 修改草稿但前台保留旧版 → 再次批准后更新 → 撤下后前台移除。
新闻与通知各走一遍。口令从服务器凭据文件读取，不打印、不落日志。

在服务器上运行：
    python3 /srv/ic-college/current/docs/deployment/acceptance_flow.py
"""
import http.cookiejar
import re
import sqlite3
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE = 'http://127.0.0.1:8095'
# 前台列表按 (-date, -approved_at, -pk) 排序，首页只取每栏最新 4 条。
# 验收内容故意用一个最新的日期，这样它必定落在列表第 1 页与首页前 4，
# "批准后前台展示""首页联动"才能是严格断言，而不受库里已有内容多少的影响。
# （日期留空的话 SQLite 会把 NULL 排在最后，内容一多该项就会被挤到末页。）
TEST_DATE = '2099-12-31'
DATA_DIR = Path('/srv/ic-college/shared/data')
DB = DATA_DIR / 'ic-preview.sqlite3'
ACCESS = DATA_DIR.parent / 'access.txt'
ADMIN = '/preview-admin/'

PASSED, FAILED = [], []


def check(name, ok, detail=''):
    (PASSED if ok else FAILED).append(name)
    print(('  [通过] ' if ok else '  [失败] ') + name + (('  -> ' + str(detail)) if detail else ''))


def read_password():
    m = re.search(r'密码：(.+)', ACCESS.read_text(encoding='utf-8'))
    if not m:
        sys.exit('未在 %s 中找到口令行' % ACCESS)
    return m.group(1).strip()


class Client:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def csrf(self):
        for c in self.jar:
            if c.name == 'csrftoken':
                return c.value
        return ''

    def request(self, path, data=None):
        url = BASE + path
        body = urllib.parse.urlencode(data).encode('utf-8') if data is not None else None
        req = urllib.request.Request(url, data=body)
        if body is not None:
            req.add_header('Content-Type', 'application/x-www-form-urlencoded')
            req.add_header('Referer', url)
        try:
            r = self.opener.open(req, timeout=30)
            return r.getcode(), r.read().decode('utf-8', 'replace')
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode('utf-8', 'replace')

    def get(self, path):
        return self.request(path)

    def post(self, path, data):
        return self.request(path, data)


def query(sql, args=()):
    con = sqlite3.connect('file:%s?mode=ro' % DB, uri=True)
    con.row_factory = sqlite3.Row
    try:
        return [dict(r) for r in con.execute(sql, args).fetchall()]
    finally:
        con.close()


def article(slug):
    rows = query('select * from content_article where slug=?', (slug,))
    return rows[0] if rows else None


def publication(slug):
    rows = query('select * from content_publication where slug=?', (slug,))
    return rows[0] if rows else None


def front_has(client, slug, needle):
    """前台详情页是否可访问，且包含指定文字。"""
    code, body = client.get('/%s.html' % slug)
    return code, (code == 200 and needle in body)


def save_article(client, slug, title, revision, submit, article_id=None,
                 category='news', summary='自动验收摘要（非正式发布）',
                 body='第一段正文。\n\n第二段正文。'):
    data = {
        'csrfmiddlewaretoken': client.csrf(),
        'category': category,
        'slug': slug,
        'title': title,
        'summary': summary,
        'body': body,
        'source': '自动验收 · 非正式发布',
        'date': TEST_DATE,
        'image': 'chip-banner.svg',
        'image_alt': '原创芯片学科示意，非新闻现场',
        'is_placeholder': 'on',
        'expected_revision': str(revision),
        '_save': '保存',
    }
    if submit:
        data['submit_for_review'] = 'on'
    path = ('/preview-admin/content/article/%d/change/' % article_id) if article_id \
        else '/preview-admin/content/article/add/'
    return client.post(path, data)


def review(client, article_id, revision, decision):
    return client.post('/preview-admin/content/article/%d/review/' % article_id, {
        'csrfmiddlewaretoken': client.csrf(),
        'expected_revision': str(revision),
        'decision': decision,
    })


def run_flow(client, category, slug, label, list_path):
    print('\n===== %s：%s =====' % (label, slug))
    title_v1 = '%s闭环验收标题 v1（自动测试）' % label
    title_v2 = '%s闭环验收标题 v2（修改后）' % label

    existing = article(slug)
    if existing is None:
        code, _ = save_article(client, slug, title_v1, 0, submit=True, category=category)
        row = article(slug)
        check('%s 新增并提交审核成功' % label, row is not None and code in (200, 302),
              'HTTP %s，state=%s' % (code, row['state'] if row else '未创建'))
        if row is None:
            return
    else:
        row = existing
        print('  注意：%s 已存在，沿用现有草稿继续验收（state=%s rev=%s）' % (slug, row['state'], row['revision']))
        if row['state'] == 'approved':
            review(client, row['id'], row['revision'], 'withdraw')
            row = article(slug)
        code, _ = save_article(client, slug, title_v1, row['revision'], submit=True,
                               article_id=row['id'], category=category)
        row = article(slug)

    aid = row['id']
    check('%s 草稿已进入待审核' % label, row['state'] == 'submitted', 'state=%s' % row['state'])

    code, hit = front_has(client, slug, title_v1)
    check('%s 未批准时前台不展示（草稿不泄漏）' % label, code == 404, 'HTTP %s' % code)

    review(client, aid, row['revision'], 'approve')
    row = article(slug)
    pub = publication(slug)
    code, hit = front_has(client, slug, title_v1)
    check('%s 批准后前台详情展示 v1' % label, code == 200 and hit, 'HTTP %s' % code)
    check('%s 生成批准快照' % label, pub is not None and pub['title'] == title_v1,
          '快照 rev=%s' % (pub['revision'] if pub else '无'))

    code, body = client.get(list_path)
    check('%s 出现在列表页' % label, code == 200 and ('/%s.html' % slug) in body, 'HTTP %s' % code)

    # 首页按栏目取最新批准的 4 条；本条刚刚批准，必然是最新的，必须真的出现在首页，
    # 而不是只断言首页返回 200。
    code, body = client.get('/index.html')
    on_home = title_v1 in body
    check('%s 首页联动：刚批准的标题确实出现在首页' % label,
          code == 200 and on_home, 'HTTP %s，首页含标题=%s' % (code, on_home))

    # 修改草稿但不提交：前台必须继续显示 v1
    save_article(client, slug, title_v2, article(slug)['revision'], submit=False,
                 article_id=aid, category=category)
    row = article(slug)
    code, hit_v2 = front_has(client, slug, title_v2)
    code2, hit_v1 = front_has(client, slug, title_v1)
    check('%s 改草稿后前台仍显示旧版 v1' % label, hit_v1 and not hit_v2,
          '草稿 state=%s rev=%s；前台 404=%s' % (row['state'], row['revision'], code == 404))

    # 重新提交并批准：前台更新为 v2
    save_article(client, slug, title_v2, article(slug)['revision'], submit=True,
                 article_id=aid, category=category)
    row = article(slug)
    check('%s 再次提交进入待审核' % label, row['state'] == 'submitted', 'state=%s' % row['state'])
    review(client, aid, row['revision'], 'approve')
    pub = publication(slug)
    code, hit_v2 = front_has(client, slug, title_v2)
    check('%s 再次批准后前台更新为 v2' % label, code == 200 and hit_v2,
          '快照 rev=%s' % (pub['revision'] if pub else '无'))

    # 撤下
    review(client, aid, article(slug)['revision'], 'withdraw')
    pub = publication(slug)
    code, _ = front_has(client, slug, title_v2)
    check('%s 撤下后前台移除并返回 404' % label, pub is None and code == 404,
          '快照=%s，HTTP %s' % ('已删除' if pub is None else '仍存在', code))
    row = article(slug)
    check('%s 撤下保留草稿与日志' % label, row is not None and row['state'] == 'draft',
          'state=%s rev=%s' % (row['state'], row['revision']))


def main():
    password = read_password()
    client = Client()

    code, body = client.get(ADMIN + 'login/')
    check('后台登录页可访问（SSH 隧道内的回环地址）', code == 200, 'HTTP %s' % code)

    client.post(ADMIN + 'login/', {
        'csrfmiddlewaretoken': client.csrf(),
        'username': 'preview-admin',
        'password': password,
        'next': ADMIN,
    })
    code, body = client.get(ADMIN)
    check('登录成功并进入后台首页', code == 200 and '开发预览管理' in body, 'HTTP %s' % code)

    code, body = client.get(ADMIN + 'content/article/')
    check('可打开“新闻与通知草稿”列表', code == 200 and '新闻与通知草稿' in body, 'HTTP %s' % code)

    run_flow(client, 'news', 'news-demo-20261012', '新闻', '/news.html')
    run_flow(client, 'notice', 'notice-demo-20261012', '通知', '/notices.html')

    print('\n===== 操作日志（content_auditevent） =====')
    for r in query("select a.slug, e.action, e.revision, e.occurred_at from content_auditevent e "
                   "join content_article a on a.id=e.article_id "
                   "where a.slug in ('news-demo-20261012','notice-demo-20261012') "
                   "order by e.id"):
        print('  %-24s %-10s rev=%-3s %s' % (r['slug'], r['action'], r['revision'], r['occurred_at']))

    print('\n===== 汇总：通过 %d 项，失败 %d 项 =====' % (len(PASSED), len(FAILED)))
    for name in FAILED:
        print('  失败：' + name)
    return 1 if FAILED else 0


if __name__ == '__main__':
    sys.exit(main())
