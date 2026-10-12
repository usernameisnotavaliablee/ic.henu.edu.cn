#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""对运行中的预览服务做全站链接与资源实测（不需要浏览器）。

从首页出发，抓取所有站内 href/src，逐个请求并核对状态码；
同时核对页面之间的一致性（每页有标题、无重复 id）。

用法：
    python check_live_links.py http://127.0.0.1:8095
不带参数时默认 http://127.0.0.1:8095（需先建立 SSH 隧道）。
"""
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8095').rstrip('/')
SKIP_SCHEMES = ('mailto:', 'tel:', 'javascript:', 'data:')

ATTR = re.compile(r'(?:href|src)\s*=\s*"([^"]+)"')
ID = re.compile(r'\sid\s*=\s*"([^"]+)"')
TITLE = re.compile(r'<title[^>]*>(.*?)</title>', re.S)
CSS_URL = re.compile(r'url\(\s*[\'"]?([^\'")]+)[\'"]?\s*\)')


def resolve(path, raw):
    """把页面里的相对链接解析成可请求的目标，**保留查询串**。
    只取 .path 会把 ?page=2 丢掉，导致分页页永远爬不到。"""
    parsed = urllib.parse.urlparse(urllib.parse.urljoin(path, raw))
    if not parsed.path:
        return ''
    return parsed.path + (('?' + parsed.query) if parsed.query else '')


def fetch(path):
    url = path if path.startswith('http') else BASE + path
    req = urllib.request.Request(url, headers={'User-Agent': 'ic-college-linkcheck'})
    try:
        r = urllib.request.urlopen(req, timeout=20)
        return r.getcode(), r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')
    except Exception as e:  # noqa: BLE001
        return 0, str(e)


def main():
    seen, queue, failures, checked = set(), ['/index.html'], [], 0
    pages = 0

    while queue:
        path = queue.pop(0)
        if path in seen:
            continue
        seen.add(path)
        code, body = fetch(path)
        checked += 1
        if code != 200:
            failures.append((path, code))
            continue
        if path.endswith('.css'):
            # CSS 里 url(...) 引用的背景图也要一起核对。
            for raw in CSS_URL.findall(body):
                if raw.startswith(('http', 'data:', '#')):
                    continue
                target = resolve(path, raw)
                if target and target not in seen:
                    queue.append(target)
            continue
        if not path.split('?')[0].endswith('.html'):
            continue
        pages += 1

        title = TITLE.search(body)
        if not title or not title.group(1).strip():
            failures.append((path, '缺少 <title>'))

        ids = ID.findall(body)
        dupes = {i for i in ids if ids.count(i) > 1}
        if dupes:
            failures.append((path, '重复 id: %s' % ','.join(sorted(dupes))))

        for raw in ATTR.findall(body):
            if raw.startswith('#') or raw.startswith(SKIP_SCHEMES) or raw.startswith('http'):
                continue
            target = resolve(path, raw)
            if target and target not in seen:
                queue.append(target)

    print('起始页：%s' % BASE)
    print('抓取页面 %d 个，检查资源/页面 %d 个' % (pages, checked))
    if failures:
        print('\n失败项 %d 个：' % len(failures))
        for path, why in failures:
            print('  %-40s %s' % (path, why))
        return 1
    print('全部站内链接与资源均返回 200，页面标题齐全，无重复 id。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
