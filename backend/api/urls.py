from django.urls import path
from . import views

urlpatterns = [
    path('', views.api_root, name='api-root'),
    path('dashboard/', views.dashboard_data, name='dashboard-data'),
]

