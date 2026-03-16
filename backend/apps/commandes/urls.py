"""
Configuration des URLs pour l'application commandes.
"""

from rest_framework.routers import SimpleRouter
from django.urls import path, include
from .views import CommandeViewSet, LigneCommandeViewSet

router = SimpleRouter()
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'lignes-commandes', LigneCommandeViewSet, basename='ligne-commande')

urlpatterns = [
    path('', include(router.urls)),
]

