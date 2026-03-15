"""
URL configuration for HollyForkWeb backend (replicated from holly_pi).
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from apps.authentication.views import GetCSRFTokenView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('csrf/', GetCSRFTokenView.as_view(), name='get-csrf-token'),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/', include('apps.restaurant.urls')),
    path('api/', include('apps.staff.urls')),
    path('api/staff/permissions/', include('apps.staff.urls_permissions')),
    path('api/', include('apps.menu.urls')),
    path('api/', include('apps.commandes.urls')),
    path('api/', include('apps.inventory.urls')),
    path('api/', include('apps.salles.urls')),
    path('api/', include('apps.reservations.urls')),
    path('api/', include('apps.notes.urls')),
    path('api/', include('apps.billing.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/planning/', include('apps.planning.urls')),
    path('api/', include('apps.suppliers.urls')),
    path('api/settings/', include('apps.settings.urls')),
    path('api/', include('apps.reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
