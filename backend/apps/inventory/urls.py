"""
Configuration des URLs pour l'application inventory.
"""

from rest_framework.routers import SimpleRouter
from .views import IngredientViewSet, StockViewSet, ReapprovisionnementViewSet

router = SimpleRouter()
router.register(r'ingredients', IngredientViewSet, basename='ingredient')
router.register(r'stocks', StockViewSet, basename='stock')
router.register(r'reapprovisionnements', ReapprovisionnementViewSet, basename='reapprovisionnement')

urlpatterns = router.urls

