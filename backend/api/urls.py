from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_root, name='api-root'),
    path('dashboard/', views.dashboard_data, name='dashboard-data'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/me/', views.current_user, name='current-user'),
    path('auth/delete-account/', views.delete_account, name='delete-account'),
    path('auth/verify-mfa/', views.verify_mfa, name='verify-mfa'),
    path('auth/mfa/setup/', views.mfa_setup, name='mfa-setup'),
    path('auth/mfa/confirm/', views.mfa_confirm, name='mfa-confirm'),
    path('auth/mfa/disable/', views.mfa_disable, name='mfa-disable'),
    path('auth/mfa/status/', views.mfa_status, name='mfa-status'),
    path('maps/', views.room_maps_list, name='room-maps-list'),
    path('maps/<int:pk>/', views.room_map_detail, name='room-map-detail'),
]

