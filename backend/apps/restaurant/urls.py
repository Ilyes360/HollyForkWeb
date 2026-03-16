"""
Configuration des URLs pour l'application restaurant.
"""

from rest_framework.routers import SimpleRouter
from .views import RestaurantViewSet

router = SimpleRouter()
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')

urlpatterns = router.urls
