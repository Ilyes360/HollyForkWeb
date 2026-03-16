from rest_framework.routers import SimpleRouter
from django.urls import path, include
from .views import ReportViewSet, EmployeesStatusView

router = SimpleRouter()
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('employees/status/', EmployeesStatusView.as_view({'get': 'list'}), name='employees-status'),
    path('', include(router.urls)),
]

