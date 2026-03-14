from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .viewsets import (
    SalleViewSet,
    RoleViewSet,
    TableViewSet,
    ClientViewSet,
    ReservationViewSet,
    MenuViewSet,
    GroupeMenuViewSet,
    PlatViewSet,
    FormuleViewSet,
    IngredientViewSet,
    IngredientMovementViewSet,
    FournisseurViewSet,
    CommandeFournisseurViewSet,
    LigneCommandeFournisseurViewSet,
    CategorieProduitViewSet,
    ProduitViewSet,
    StockMovementViewSet,
    CommandeViewSet,
    LigneCommandeViewSet,
    FactureViewSet,
    PaiementViewSet,
    TypeApportViewSet,
    ApportViewSet,
    EmployeeViewSet,
    PlanningShiftViewSet,
    PlanningCapacityViewSet,
    SupplierOrderViewSet,
    TeamShiftViewSet,
)

router = DefaultRouter()
router.register(r'salles', SalleViewSet, basename='salle')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'tables', TableViewSet, basename='table')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'menus', MenuViewSet, basename='menu')
router.register(r'groupes-menu', GroupeMenuViewSet, basename='groupe-menu')
router.register(r'plats', PlatViewSet, basename='plat')
router.register(r'formules', FormuleViewSet, basename='formule')
router.register(r'stock', IngredientViewSet, basename='stock')  # stock = ingredients the restaurant has
router.register(r'stock-movements', IngredientMovementViewSet, basename='stock-movement')
router.register(r'fournisseurs', FournisseurViewSet, basename='fournisseur')
router.register(r'commandes-fournisseur', CommandeFournisseurViewSet, basename='commande-fournisseur')
router.register(r'lignes-commande-fournisseur', LigneCommandeFournisseurViewSet, basename='ligne-commande-fournisseur')
router.register(r'categories-produit', CategorieProduitViewSet, basename='categorie-produit')
router.register(r'produits', ProduitViewSet, basename='produit')
router.register(r'product-stock-movements', StockMovementViewSet, basename='product-stock-movement')
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'lignes-commande', LigneCommandeViewSet, basename='ligne-commande')
router.register(r'factures', FactureViewSet, basename='facture')
router.register(r'paiements', PaiementViewSet, basename='paiement')
router.register(r'types-apport', TypeApportViewSet, basename='type-apport')
router.register(r'apports', ApportViewSet, basename='apport')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'planning-shifts', PlanningShiftViewSet, basename='planning-shift')
router.register(r'planning-capacities', PlanningCapacityViewSet, basename='planning-capacity')
router.register(r'supplier-orders', SupplierOrderViewSet, basename='supplier-order')
router.register(r'team-shifts', TeamShiftViewSet, basename='team-shift')

urlpatterns = [
    path('', views.api_root, name='api-root'),
    path('dashboard/', views.dashboard_data, name='dashboard-data'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/me/', views.current_user, name='current-user'),
    path('auth/profile/', views.profile_update, name='profile-update'),
    path('auth/delete-account/', views.delete_account, name='delete-account'),
    path('auth/verify-mfa/', views.verify_mfa, name='verify-mfa'),
    path('auth/mfa/setup/', views.mfa_setup, name='mfa-setup'),
    path('auth/mfa/confirm/', views.mfa_confirm, name='mfa-confirm'),
    path('auth/mfa/disable/', views.mfa_disable, name='mfa-disable'),
    path('auth/mfa/status/', views.mfa_status, name='mfa-status'),
    path('maps/', views.room_maps_list, name='room-maps-list'),
    path('maps/<int:pk>/', views.room_map_detail, name='room-map-detail'),
    path('planning/week/', views.planning_week, name='planning-week'),
    path('planning/week/copy/', views.planning_week_copy, name='planning-week-copy'),
    path('', include(router.urls)),
]

