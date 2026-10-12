"""跨平台 WSGI；只监听回环，不使用开发服务器对外服务。"""
import os
from config.wsgi import application
from django.conf import settings
from waitress import serve

if __name__ == '__main__':
    # 公网实例只接受本机反向代理覆盖的协议头。私有实例始终走 SSH
    # 隧道，不信任代理头，避免 HTTPS 设置影响本地管理登录。
    proxy_options = {}
    if settings.PUBLIC_ONLY and settings.HTTPS:
        proxy_options = {
            'trusted_proxy': '127.0.0.1',
            'trusted_proxy_headers': {'x-forwarded-proto'},
        }
    serve(application, host='127.0.0.1', port=int(os.environ.get('IC_PORT', '8095')),
          threads=4, max_request_body_size=262144, max_request_header_size=16384,
          clear_untrusted_proxy_headers=True, channel_timeout=60, connection_limit=100,
          **proxy_options)
