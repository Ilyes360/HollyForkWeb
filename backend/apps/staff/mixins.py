"""
Mixins pour la gestion des permissions dans Holly Pi.

Ce fichier contient les mixins réutilisables pour ajouter
facilement la gestion des permissions aux vues.

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

from typing import Optional
from django.core.exceptions import PermissionDenied
from rest_framework import status
from rest_framework.response import Response

from apps.staff.employee_roles import Permission, EmployeeRole
from apps.staff.permissions_utils import PermissionChecker


class PermissionMixin:
    """
    Mixin de base pour ajouter la vérification des permissions aux vues.
    
    Usage:
        class MyView(PermissionMixin, APIView):
            required_permission = Permission.MANAGE_STAFF
            
            def get(self, request):
                # La permission est automatiquement vérifiée
                ...
    """
    
    required_permission: Optional[Permission] = None
    required_permissions: Optional[list] = None
    require_all_permissions: bool = False
    
    def get_permission_checker(self):
        """Retourne un PermissionChecker pour l'utilisateur actuel."""
        if not hasattr(self, 'request') or not self.request.user.is_authenticated:
            return None
        return PermissionChecker(user=self.request.user)
    
    def check_permissions(self):
        """
        Vérifie les permissions requises.
        
        Raises:
            PermissionDenied: Si l'utilisateur n'a pas les permissions
        """
        checker = self.get_permission_checker()
        
        if not checker:
            raise PermissionDenied("Authentification requise")
        
        # Collecter les permissions requises
        required_perms = []
        if self.required_permission:
            required_perms.append(self.required_permission)
        if self.required_permissions:
            required_perms.extend(self.required_permissions)
        
        if not required_perms:
            return  # Pas de permissions requises
        
        # Vérifier les permissions
        if self.require_all_permissions:
            if not checker.has_all_permissions(*required_perms):
                perm_names = ', '.join(p.value for p in required_perms)
                raise PermissionDenied(f"Toutes ces permissions sont requises: {perm_names}")
        else:
            if not checker.has_any_permission(*required_perms):
                perm_names = ', '.join(p.value for p in required_perms)
                raise PermissionDenied(f"Au moins une de ces permissions est requise: {perm_names}")


class RoleMixin:
    """
    Mixin pour vérifier le rôle d'un utilisateur.
    
    Usage:
        class MyView(RoleMixin, APIView):
            required_role = EmployeeRole.ADMIN_ETABLISSEMENT
            
            def get(self, request):
                # Le rôle est automatiquement vérifié
                ...
    """
    
    required_role: Optional[EmployeeRole] = None
    required_roles: Optional[list] = None
    
    def get_permission_checker(self):
        """Retourne un PermissionChecker pour l'utilisateur actuel."""
        if not hasattr(self, 'request') or not self.request.user.is_authenticated:
            return None
        return PermissionChecker(user=self.request.user)
    
    def check_role(self):
        """
        Vérifie le rôle requis.
        
        Raises:
            PermissionDenied: Si l'utilisateur n'a pas le bon rôle
        """
        checker = self.get_permission_checker()
        
        if not checker:
            raise PermissionDenied("Authentification requise")
        
        if not checker.role:
            raise PermissionDenied("Aucun rôle assigné à cet utilisateur")
        
        # Collecter les rôles requis
        required_roles = []
        if self.required_role:
            required_roles.append(self.required_role)
        if self.required_roles:
            required_roles.extend(self.required_roles)
        
        if not required_roles:
            return  # Pas de rôle requis
        
        # Vérifier le rôle
        if checker.role not in required_roles:
            role_names = ', '.join(r.value for r in required_roles)
            raise PermissionDenied(f"Un de ces rôles est requis: {role_names}")


class RestaurantAccessMixin:
    """
    Mixin pour vérifier l'accès à un restaurant.
    
    Usage:
        class MyView(RestaurantAccessMixin, APIView):
            restaurant_field = 'restaurant_id'
            
            def get(self, request):
                # L'accès au restaurant est automatiquement vérifié
                restaurant_id = self.get_restaurant_id()
                ...
    """
    
    restaurant_field: str = 'restaurant_id'
    
    def get_permission_checker(self):
        """Retourne un PermissionChecker pour l'utilisateur actuel."""
        if not hasattr(self, 'request') or not self.request.user.is_authenticated:
            return None
        return PermissionChecker(user=self.request.user)
    
    def get_restaurant_id(self) -> Optional[int]:
        """
        Récupère l'ID du restaurant depuis la requête.
        
        Returns:
            L'ID du restaurant ou None
        """
        restaurant_id = None
        
        # Chercher dans kwargs (URL)
        if hasattr(self, 'kwargs') and self.restaurant_field in self.kwargs:
            restaurant_id = self.kwargs[self.restaurant_field]
        
        # Chercher dans query params
        elif hasattr(self, 'request'):
            if hasattr(self.request, 'query_params') and self.restaurant_field in self.request.query_params:
                restaurant_id = self.request.query_params.get(self.restaurant_field)
            
            # Chercher dans les données du body
            elif hasattr(self.request, 'data') and self.restaurant_field in self.request.data:
                restaurant_id = self.request.data.get(self.restaurant_field)
        
        if restaurant_id:
            try:
                return int(restaurant_id)
            except (ValueError, TypeError):
                return None
        
        return None
    
    def check_restaurant_access(self):
        """
        Vérifie l'accès au restaurant.
        
        Raises:
            PermissionDenied: Si l'utilisateur n'a pas accès au restaurant
        """
        checker = self.get_permission_checker()
        
        if not checker:
            raise PermissionDenied("Authentification requise")
        
        # Super Admin a accès à tous les restaurants
        if checker.role == EmployeeRole.SUPER_ADMIN_GROUPE:
            return
        
        restaurant_id = self.get_restaurant_id()
        
        if not restaurant_id:
            raise PermissionDenied(f"Paramètre '{self.restaurant_field}' requis")
        
        if not checker.has_access_to_restaurant(restaurant_id):
            raise PermissionDenied(f"Accès refusé au restaurant {restaurant_id}")


class PermissionViewMixin(PermissionMixin):
    """
    Mixin combiné pour les vues Django classiques.
    Vérifie automatiquement les permissions lors de la dispatch.
    """
    
    def dispatch(self, request, *args, **kwargs):
        """Override dispatch pour vérifier les permissions."""
        try:
            self.check_permissions()
        except PermissionDenied as e:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden(str(e))
        
        return super().dispatch(request, *args, **kwargs)


class RoleViewMixin(RoleMixin):
    """
    Mixin combiné pour les vues Django classiques.
    Vérifie automatiquement le rôle lors de la dispatch.
    """
    
    def dispatch(self, request, *args, **kwargs):
        """Override dispatch pour vérifier le rôle."""
        try:
            self.check_role()
        except PermissionDenied as e:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden(str(e))
        
        return super().dispatch(request, *args, **kwargs)


class RestaurantAccessViewMixin(RestaurantAccessMixin):
    """
    Mixin combiné pour les vues Django classiques.
    Vérifie automatiquement l'accès au restaurant lors de la dispatch.
    """
    
    def dispatch(self, request, *args, **kwargs):
        """Override dispatch pour vérifier l'accès au restaurant."""
        try:
            self.check_restaurant_access()
        except PermissionDenied as e:
            from django.http import HttpResponseForbidden
            return HttpResponseForbidden(str(e))
        
        return super().dispatch(request, *args, **kwargs)


class APIPermissionMixin(PermissionMixin):
    """
    Mixin pour les vues API (DRF).
    Retourne des réponses JSON appropriées.
    """
    
    def initial(self, request, *args, **kwargs):
        """Override initial pour vérifier les permissions."""
        super().initial(request, *args, **kwargs)
        try:
            self.check_permissions()
        except PermissionDenied as e:
            from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
            raise DRFPermissionDenied(detail=str(e))


class APIRoleMixin(RoleMixin):
    """
    Mixin pour les vues API (DRF).
    Retourne des réponses JSON appropriées.
    """
    
    def initial(self, request, *args, **kwargs):
        """Override initial pour vérifier le rôle."""
        super().initial(request, *args, **kwargs)
        try:
            self.check_role()
        except PermissionDenied as e:
            from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
            raise DRFPermissionDenied(detail=str(e))


class APIRestaurantAccessMixin(RestaurantAccessMixin):
    """
    Mixin pour les vues API (DRF).
    Retourne des réponses JSON appropriées.
    """
    
    def initial(self, request, *args, **kwargs):
        """Override initial pour vérifier l'accès au restaurant."""
        super().initial(request, *args, **kwargs)
        try:
            self.check_restaurant_access()
        except PermissionDenied as e:
            from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
            raise DRFPermissionDenied(detail=str(e))


class FullPermissionMixin(PermissionMixin, RoleMixin, RestaurantAccessMixin):
    """
    Mixin combiné qui inclut toutes les vérifications de permissions.
    
    Usage:
        class MyView(FullPermissionMixin, APIView):
            required_permission = Permission.MANAGE_STAFF
            required_role = EmployeeRole.ADMIN_ETABLISSEMENT
            restaurant_field = 'restaurant_id'
            
            def get(self, request):
                # Toutes les vérifications sont effectuées
                ...
    """
    
    def check_all_permissions(self):
        """Vérifie toutes les permissions, rôles et accès restaurant."""
        self.check_permissions()
        self.check_role()
        self.check_restaurant_access()

