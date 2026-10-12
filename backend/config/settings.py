"""仅用于团队预览；不包含学校站群凭据或学校接口。"""
import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
# 仓库根目录（backend/ 的上一级）。本地默认数据目录是仓库内的 sandbox/；
# 服务器始终通过 IC_DATA_DIR 指向 /srv/ic-college/shared/data。
REPO_DIR = BASE_DIR.parent
DATA_DIR = Path(os.environ.get('IC_DATA_DIR', REPO_DIR / 'sandbox' / 'data')).resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)
key_file = DATA_DIR / 'secret.key'
SECRET_KEY = os.environ.get('IC_SECRET_KEY') or (key_file.read_text().strip() if key_file.exists() else '')
if len(SECRET_KEY) < 50:
    raise RuntimeError('先运行 prepare_local.py 在沙盒创建密钥，或设置 IC_SECRET_KEY。')
DEBUG = False
ALLOWED_HOSTS = os.environ.get('IC_ALLOWED_HOSTS', '127.0.0.1,localhost,[::1]').split(',')
PUBLIC_ONLY = os.environ.get('IC_PUBLIC_ONLY', '0') == '1'
HTTPS = os.environ.get('IC_HTTPS', '0') == '1'

INSTALLED_APPS = [
    'django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes',
    'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles',
    'axes', 'content',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'content.middleware.PreviewBoundaryMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'axes.middleware.AxesMiddleware',
]
AUTHENTICATION_BACKENDS = ['axes.backends.AxesStandaloneBackend', 'django.contrib.auth.backends.ModelBackend']
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=15)
AXES_LOCKOUT_PARAMETERS = ['ip_address']
AXES_RESET_ON_SUCCESS = True
AXES_ENABLE_ACCESS_FAILURE_LOG = False
AXES_IPWARE_PROXY_COUNT = 0
AXES_CLIENT_IP_CALLABLE = 'content.middleware.direct_client_ip'
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'], 'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
        'content.editable.site_context',
    ]},
}]
DATABASES = {'default': {
    'ENGINE': 'django.db.backends.sqlite3', 'NAME': DATA_DIR / 'ic-preview.sqlite3',
    'OPTIONS': {'timeout': 10, 'transaction_mode': 'IMMEDIATE'},
}}
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
STATIC_URL = '/static/'
STATIC_ROOT = DATA_DIR / 'static'
PREVIEW_ROOT = REPO_DIR / 'frontend' / 'preview'
WHITENOISE_ROOT = None
WHITENOISE_INDEX_FILE = False
# HTML 由明确的白名单视图提供，避免静态旧新闻绕过下架。
WHITENOISE_SKIP_COMPRESS_EXTENSIONS = ('jpg', 'jpeg', 'png', 'gif', 'webp')
WHITENOISE_AUTOREFRESH = False
WHITENOISE_MAX_AGE = 300
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = HTTPS
CSRF_COOKIE_SECURE = HTTPS
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_AGE = 3600
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SECURE_SSL_REDIRECT = HTTPS
SECURE_HSTS_SECONDS = 31536000 if HTTPS else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'same-origin'
X_FRAME_OPTIONS = 'DENY'
DATA_UPLOAD_MAX_MEMORY_SIZE = 256 * 1024
DATA_UPLOAD_MAX_NUMBER_FIELDS = 100
FILE_UPLOAD_MAX_MEMORY_SIZE = 0
# 没有上传入口；正文只接受纯文本，图片从已归档资源中选。
CSRF_FAILURE_VIEW = 'content.views.csrf_failure'
LOGGING = {
    'version': 1, 'disable_existing_loggers': False,
    'handlers': {'console': {'class': 'logging.StreamHandler'}},
    'root': {'handlers': ['console'], 'level': 'WARNING'},
}
