from django.urls import path
from .views import DashboardKPIsView, DashboardMapView

app_name = 'dashboard'

urlpatterns = [
    path('kpis/', DashboardKPIsView.as_view(), name='dashboard-kpis'),
    path('map/', DashboardMapView.as_view(), name='dashboard-map'),
]

