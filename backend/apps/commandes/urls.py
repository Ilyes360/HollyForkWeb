"""
Configuration des URLs pour l'application commandes.
"""

from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import CommandeViewSet, LigneCommandeViewSet

router = DefaultRouter()
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'lignes-commandes', LigneCommandeViewSet, basename='ligne-commande')

urlpatterns = [
    path('', include(router.urls)),
]

