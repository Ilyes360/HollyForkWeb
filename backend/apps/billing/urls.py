from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.billing.views import FactureViewSet, PaiementViewSet, MethodePaiementViewSet

router = DefaultRouter()
router.register(r'factures', FactureViewSet, basename='facture')
router.register(r'paiements', PaiementViewSet, basename='paiement')
router.register(r'methodes-paiement', MethodePaiementViewSet, basename='methodepaiement')

urlpatterns = [
    path('', include(router.urls)),
]

