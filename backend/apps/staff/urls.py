"""
Configuration des URLs pour l'application staff.
"""

from rest_framework.routers import SimpleRouter
from .views import TypeEmployeViewSet, EmployeViewSet, RestaurantEmployeViewSet

router = SimpleRouter()
router.register(r'employes', EmployeViewSet, basename='employe')
router.register(r'restaurant-employes', RestaurantEmployeViewSet, basename='restaurant-employe')
router.register(r'type-employes', TypeEmployeViewSet, basename='type-employe')

urlpatterns = router.urls
