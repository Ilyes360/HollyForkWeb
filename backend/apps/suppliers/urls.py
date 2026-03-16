from rest_framework.routers import SimpleRouter
from django.urls import path, include
from .views import FournisseurViewSet, CommandeFournisseurViewSet

# Fournisseurs à /api/suppliers/
router = SimpleRouter()
router.register(r'', FournisseurViewSet, basename='supplier')

# Commandes à /api/suppliers/orders/
orders_router = SimpleRouter()
orders_router.register(r'', CommandeFournisseurViewSet, basename='supplier-order')

urlpatterns = [
    path('suppliers/orders/', include(orders_router.urls)),
    path('suppliers/', include(router.urls)),
]

