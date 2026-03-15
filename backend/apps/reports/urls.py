from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ReportViewSet, EmployeesStatusView

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('employees/status/', EmployeesStatusView.as_view({'get': 'list'}), name='employees-status'),
    path('', include(router.urls)),
]

