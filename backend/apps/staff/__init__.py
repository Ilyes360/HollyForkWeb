"""
Module de gestion du personnel et des permissions Holly Pi.

Ce module contient tous les éléments nécessaires pour gérer
les employés, leurs rôles et leurs permissions.

Pour utiliser les permissions, importez directement depuis les sous-modules :

    from apps.staff.employee_roles import EmployeeRole, Permission
    from apps.staff.permissions_utils import PermissionChecker
    from apps.staff.decorators import require_permission, require_role
    from apps.staff.permissions import HasPermission, CanManageStaff
    from apps.staff.mixins import APIPermissionMixin

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

# Ne pas faire d'imports ici pour éviter les problèmes d'importation circulaire
# au démarrage de Django. Les utilisateurs doivent importer directement depuis
# les sous-modules.

