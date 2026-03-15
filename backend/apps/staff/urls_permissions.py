"""
URLs pour les endpoints de gestion des permissions dans Holly Pi.

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

from django.urls import path
from apps.staff import views_permissions

app_name = 'staff_permissions'

urlpatterns = [
    # Consultation des rôles et permissions
    path('roles/', views_permissions.get_all_roles, name='all-roles'),
    path('list/', views_permissions.get_all_permissions, name='all-permissions'),
    path('roles/<str:role_name>/permissions/', views_permissions.get_role_permissions_view, name='role-permissions'),
    path('<str:permission_name>/roles/', views_permissions.get_permission_roles_view, name='permission-roles'),
    
    # Permissions de l'utilisateur connecté
    path('me/', views_permissions.get_my_permissions, name='my-permissions'),
    
    # Vérification de permissions
    path('check/', views_permissions.check_permission, name='check-permission'),
    path('check-multiple/', views_permissions.check_multiple_permissions, name='check-multiple-permissions'),
    
    # Hiérarchie et matrice (admin only)
    path('hierarchy/', views_permissions.get_role_hierarchy, name='role-hierarchy'),
    path('matrix/', views_permissions.get_permission_matrix, name='permission-matrix'),
    
    # Comparaison de rôles
    path('compare-roles/', views_permissions.compare_roles, name='compare-roles'),
]

