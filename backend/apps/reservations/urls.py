"""
Configuration des URLs pour l'application reservations.
"""

from rest_framework.routers import SimpleRouter
from .views import ReservationViewSet

router = SimpleRouter()
router.register(r'reservations', ReservationViewSet, basename='reservation')

urlpatterns = router.urls

