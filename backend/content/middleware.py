from ipaddress import ip_address
from django.conf import settings
from django.http import HttpResponse

def direct_client_ip(request):
    # 不信任客户端伪造的 X-Forwarded-For，管理入口使用直连或 SSH 隧道。
    return request.META.get('REMOTE_ADDR', '')

class PreviewBoundaryMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 主动检查 Host；静态资源同样不能绕过主机白名单。
        request.get_host()
        admin = request.path.startswith('/preview-admin')
        try:
            local = ip_address(direct_client_ip(request)).is_loopback
        except ValueError:
            local = False
        if settings.PUBLIC_ONLY and (admin or request.method not in ('GET', 'HEAD', 'OPTIONS')):
            return HttpResponse('未找到此页面。', status=404)
        if admin and not local:
            return HttpResponse('管理入口仅通过本机或 SSH 隧道访问。', status=403)
        response = self.get_response(request)
        response['X-Robots-Tag'] = 'noindex, nofollow, noarchive'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Referrer-Policy'] = 'same-origin'
        response['X-Frame-Options'] = 'DENY'
        response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
        if admin or response.get('Content-Type', '').startswith('text/html'):
            response['Cache-Control'] = 'no-store'
        return response
