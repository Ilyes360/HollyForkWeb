"""
Classes de permissions pour Django REST Framework dans Holly Pi.

Ce fichier contient les classes de permissions personnalisées
pour protéger les endpoints API.

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

from typing import Union, List
from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.staff.employee_roles import Permission, EmployeeRole
from apps.staff.permissions_utils import PermissionChecker


class BaseHollyPermission(permissions.BasePermission):
    """Classe de base pour toutes les permissions Holly Pi."""
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        """
        Vérifie si l'utilisateur est authentifié et a un employé associé.
        
        Args:
            request: La requête HTTP
            view: La vue appelée
            
        Returns:
            True si l'utilisateur est authentifié avec un employé, False sinon
        """
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            checker = PermissionChecker(user=request.user)
            return checker.employe is not None
        except Exception:
            return False


class HasPermission(BaseHollyPermission):
    """
    Classe de permission générique pour vérifier une ou plusieurs permissions.
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [HasPermission]
            required_permission = Permission.MANAGE_STAFF
            
        # Ou avec plusieurs permissions (au moins une requise)
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [HasPermission]
            required_permissions = [Permission.MANAGE_STAFF, Permission.MANAGE_SERVICE]
            
        # Ou avec toutes les permissions requises
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [HasPermission]
            required_permissions = [Permission.MANAGE_STAFF, Permission.MANAGE_SERVICE]
            require_all_permissions = True
    """
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        """Vérifie les permissions requises."""
        if not super().has_permission(request, view):
            return False
        
        try:
            checker = PermissionChecker(user=request.user)
            
            # Récupérer les permissions requises : d'abord depuis la classe de permission (self), puis la vue
            required_perms: List[Union[Permission, str]] = []
            
            # Depuis la classe de permission (ex: CanAccessFinancialReports.required_permission)
            if hasattr(self, 'required_permission'):
                required_perms.append(self.required_permission)
            if hasattr(self, 'required_permissions'):
                required_perms.extend(self.required_permissions)
            
            # Depuis la vue (ex: MyViewSet.required_permission)
            if hasattr(view, 'required_permission'):
                required_perms.append(view.required_permission)
            if hasattr(view, 'required_permissions'):
                required_perms.extend(view.required_permissions)
            
            if not required_perms:
                # Si aucune permission n'est définie, autoriser par défaut
                return True
            
            # Vérifier si toutes les permissions sont requises ou seulement une
            require_all = getattr(self, 'require_all_permissions', False) or getattr(view, 'require_all_permissions', False)
            
            if require_all:
                return checker.has_all_permissions(*required_perms)
            else:
                return checker.has_any_permission(*required_perms)
        
        except Exception:
            return False


class HasRole(BaseHollyPermission):
    """
    Classe de permission pour vérifier le rôle d'un utilisateur.
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [HasRole]
            required_role = EmployeeRole.ADMIN_ETABLISSEMENT
            
        # Ou avec plusieurs rôles autorisés
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [HasRole]
            required_roles = [EmployeeRole.ADMIN_ETABLISSEMENT, EmployeeRole.DIRECTEUR]
    """
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        """Vérifie le rôle requis."""
        if not super().has_permission(request, view):
            return False
        
        try:
            checker = PermissionChecker(user=request.user)
            
            if not checker.role:
                return False
            
            # Récupérer les rôles requis de la vue
            required_roles = []
            
            # Cas 1: required_role (singulier)
            if hasattr(view, 'required_role'):
                required_roles.append(view.required_role)
            
            # Cas 2: required_roles (pluriel)
            if hasattr(view, 'required_roles'):
                required_roles.extend(view.required_roles)
            
            if not required_roles:
                # Si aucun rôle n'est défini, autoriser par défaut
                return True
            
            # Convertir les strings en EmployeeRole si nécessaire
            allowed_roles = []
            for role in required_roles:
                if isinstance(role, str):
                    try:
                        role = EmployeeRole(role)
                    except ValueError:
                        continue
                allowed_roles.append(role)
            
            return checker.role in allowed_roles
        
        except Exception:
            return False


class HasRestaurantAccess(BaseHollyPermission):
    """
    Classe de permission pour vérifier l'accès à un restaurant.
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [HasRestaurantAccess]
            restaurant_field = 'restaurant_id'  # Champ dans les données de la requête
            
        # Pour les objets existants
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [HasRestaurantAccess]
            
            def has_object_permission(self, request, view, obj):
                # obj.restaurant doit exister
                pass
    """
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        """Vérifie l'accès au restaurant dans la requête."""
        if not super().has_permission(request, view):
            return False
        
        try:
            checker = PermissionChecker(user=request.user)
            
            # Super Admin Groupe a accès à tous les restaurants
            if checker.role == EmployeeRole.SUPER_ADMIN_GROUPE:
                return True
            
            # Récupérer le champ du restaurant depuis la vue
            restaurant_field = getattr(view, 'restaurant_field', 'restaurant_id')
            
            # Essayer de récupérer l'ID du restaurant
            restaurant_id = None
            
            # Chercher dans les query params
            if restaurant_field in request.query_params:
                restaurant_id = request.query_params.get(restaurant_field)
            
            # Chercher dans les données du body
            elif hasattr(request, 'data') and restaurant_field in request.data:
                restaurant_id = request.data.get(restaurant_field)
            
            # Si pas d'ID trouvé, autoriser (sera vérifié dans has_object_permission)
            if not restaurant_id:
                return True
            
            # Convertir en int
            try:
                restaurant_id = int(restaurant_id)
            except (ValueError, TypeError):
                return False
            
            return checker.has_access_to_restaurant(restaurant_id)
        
        except Exception:
            return False
    
    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        """Vérifie l'accès au restaurant de l'objet."""
        try:
            checker = PermissionChecker(user=request.user)
            
            # Super Admin Groupe a accès à tous les restaurants
            if checker.role == EmployeeRole.SUPER_ADMIN_GROUPE:
                return True
            
            # Essayer de récupérer le restaurant de l'objet
            restaurant = None
            
            if hasattr(obj, 'restaurant'):
                restaurant = obj.restaurant
            elif hasattr(obj, 'restaurant_id'):
                restaurant_id = obj.restaurant_id
            else:
                # Pas de restaurant associé, autoriser par défaut
                return True
            
            if restaurant:
                restaurant_id = restaurant.id_restaurant if hasattr(restaurant, 'id_restaurant') else restaurant.id
            
            if not restaurant_id:
                return False
            
            return checker.has_access_to_restaurant(restaurant_id)
        
        except Exception:
            return False


# Permissions spécifiques pour certaines opérations courantes

class CanTakeOrders(HasPermission):
    """Permission pour prendre des commandes."""
    required_permission = Permission.TAKE_ORDERS


class CanManageStaff(HasPermission):
    """Permission pour gérer le personnel."""
    required_permission = Permission.MANAGE_STAFF


class CanManageService(HasPermission):
    """Permission pour gérer le service."""
    required_permission = Permission.MANAGE_SERVICE


class CanManageReservations(HasPermission):
    """Permission pour gérer les réservations."""
    required_permission = Permission.MANAGE_RESERVATIONS


class CanManageInventory(HasPermission):
    """Permission pour gérer les inventaires."""
    required_permission = Permission.MANAGE_INVENTORY


class CanAccessFinancialReports(HasPermission):
    """Permission pour accéder aux rapports financiers."""
    required_permission = Permission.VIEW_FINANCIAL_REPORTS


class CanManageEstablishment(HasPermission):
    """Permission pour gérer l'établissement."""
    required_permission = Permission.MANAGE_ESTABLISHMENT


class IsAdminOrDirector(HasRole):
    """Permission pour les administrateurs et directeurs uniquement."""
    required_roles = [
        EmployeeRole.SUPER_ADMIN_GROUPE,
        EmployeeRole.ADMIN_ETABLISSEMENT,
        EmployeeRole.DIRECTEUR
    ]


class IsManager(HasRole):
    """Permission pour les managers (salle ou cuisine)."""
    required_roles = [
        EmployeeRole.SUPER_ADMIN_GROUPE,
        EmployeeRole.ADMIN_ETABLISSEMENT,
        EmployeeRole.DIRECTEUR,
        EmployeeRole.MANAGER_SALLE,
        EmployeeRole.MANAGER_CUISINE
    ]


class CanProcessPayments(HasPermission):
    """Permission pour traiter les paiements."""
    required_permissions = [
        Permission.PROCESS_PAYMENTS,
        Permission.PROCESS_CASH
    ]
    require_all_permissions = False  # Au moins une des deux


# Permission composée pour des cas complexes
class ComposedPermission(BaseHollyPermission):
    """
    Permission composée pour combiner plusieurs vérifications.
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [ComposedPermission]
            
            def get_permissions(self):
                if self.action == 'create':
                    return [CanManageStaff()]
                elif self.action in ['update', 'partial_update']:
                    return [IsAdminOrDirector()]
                elif self.action == 'destroy':
                    return [IsAdminOrDirector(), HasRestaurantAccess()]
                return super().get_permissions()
    """
    pass

