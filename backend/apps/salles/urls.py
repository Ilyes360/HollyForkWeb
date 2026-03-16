"""
Configuration des URLs pour l'application salles.
"""

from rest_framework.routers import SimpleRouter
from .views import SalleViewSet, TableViewSet

router = SimpleRouter()
router.register(r'salles', SalleViewSet, basename='salle')
router.register(r'tables', TableViewSet, basename='table')

urlpatterns = router.urls

