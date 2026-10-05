from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

api_v1_patterns = [
    path('', include('apps.accounts.urls')),
    path('branches/', include('apps.branches.urls')),
    path('sports/', include('apps.sports.urls')),
    path('trials/', include('apps.trials.urls')),
    path('forms/', include('apps.forms.urls')),
    path('submissions/', include('apps.submissions.urls')),
    path('selections/', include('apps.selections.urls')),
    path('dashboard/', include('apps.dashboard.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),

    # OpenAPI / Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
