from django.contrib import admin
from django.urls import path, re_path
from content import views

urlpatterns = [
    path('preview-admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('index.html', views.home),
    path('news.html', views.listing, {'category': 'news'}, name='news'),
    path('notices.html', views.listing, {'category': 'notice'}, name='notices'),
    path('robots.txt', views.robots),
    path('healthz', views.health),
    re_path(r'^(?P<directory>assets|css|js)/(?P<filename>[A-Za-z0-9_.-]+)$', views.resource),
    path('<slug:slug>.html', views.detail_or_page, name='article'),
]
handler404 = views.not_found
