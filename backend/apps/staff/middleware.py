"""
Middleware pour la gestion des permissions dans Holly Pi.

Ce fichier contient le middleware qui ajoute automatiquement
le PermissionChecker à chaque requête.

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

from django.utils.deprecation import MiddlewareMixin
from apps.staff.permissions_utils import PermissionChecker


class PermissionCheckerMiddleware(MiddlewareMixin):
    """
    Middleware qui ajoute un PermissionChecker à chaque requête.
    
    Après l'installation de ce middleware, vous pouvez accéder
    au PermissionChecker via request.permission_checker dans vos vues.
    
    Configuration dans settings.py:
        MIDDLEWARE = [
            ...
            'apps.staff.middleware.PermissionCheckerMiddleware',
            ...
        ]
    
    Usage dans les vues:
        def my_view(request):
            if request.permission_checker.has_permission(Permission.MANAGE_STAFF):
                # Faire quelque chose
                ...
    """
    
    def process_request(self, request):
        """
        Ajoute le PermissionChecker à la requête.
        
        Args:
            request: La requête HTTP
        """
        # Initialiser le PermissionChecker à None
        request.permission_checker = None
        
        # Si l'utilisateur est authentifié, créer le PermissionChecker
        if request.user and request.user.is_authenticated:
            try:
                request.permission_checker = PermissionChecker(user=request.user)
            except Exception:
                # En cas d'erreur, laisser à None
                pass
        
        return None


class RestaurantContextMiddleware(MiddlewareMixin):
    """
    Middleware qui ajoute le contexte restaurant à la requête.
    
    Ce middleware détecte automatiquement le restaurant concerné
    par la requête et l'ajoute au contexte.
    
    Configuration dans settings.py:
        MIDDLEWARE = [
            ...
            'apps.staff.middleware.PermissionCheckerMiddleware',
            'apps.staff.middleware.RestaurantContextMiddleware',
            ...
        ]
    
    Usage dans les vues:
        def my_view(request):
            if request.current_restaurant:
                # Utiliser le restaurant
                ...
    """
    
    def process_request(self, request):
        """
        Détecte et ajoute le restaurant à la requête.
        
        Args:
            request: La requête HTTP
        """
        from apps.restaurant.models import Restaurant
        
        # Initialiser le restaurant courant à None
        request.current_restaurant = None
        request.current_restaurant_id = None
        
        # Essayer de récupérer l'ID du restaurant de différentes sources
        restaurant_id = None
        
        # 1. Depuis les paramètres de l'URL (GET)
        if hasattr(request, 'GET') and 'restaurant_id' in request.GET:
            restaurant_id = request.GET.get('restaurant_id')
        
        # 2. Depuis les données POST
        elif hasattr(request, 'POST') and 'restaurant_id' in request.POST:
            restaurant_id = request.POST.get('restaurant_id')
        
        # 3. Depuis le resolver_match (URL pattern)
        elif hasattr(request, 'resolver_match') and request.resolver_match:
            kwargs = request.resolver_match.kwargs
            if 'restaurant_id' in kwargs:
                restaurant_id = kwargs['restaurant_id']
            elif 'pk' in kwargs:
                # Si c'est un endpoint de restaurant, le pk peut être l'ID du restaurant
                restaurant_id = kwargs['pk']
        
        # Convertir en int et récupérer le restaurant
        if restaurant_id:
            try:
                restaurant_id = int(restaurant_id)
                request.current_restaurant_id = restaurant_id
                
                # Récupérer le restaurant
                try:
                    request.current_restaurant = Restaurant.objects.get(
                        id_restaurant=restaurant_id
                    )
                except Restaurant.DoesNotExist:
                    pass
            except (ValueError, TypeError):
                pass
        
        return None


class EmployeeContextMiddleware(MiddlewareMixin):
    """
    Middleware qui ajoute le contexte employé à la requête.
    
    Ce middleware ajoute l'employé courant à la requête s'il existe.
    
    Configuration dans settings.py:
        MIDDLEWARE = [
            ...
            'apps.staff.middleware.PermissionCheckerMiddleware',
            'apps.staff.middleware.EmployeeContextMiddleware',
            ...
        ]
    
    Usage dans les vues:
        def my_view(request):
            if request.current_employe:
                # Utiliser l'employé
                ...
    """
    
    def process_request(self, request):
        """
        Ajoute l'employé à la requête.
        
        Args:
            request: La requête HTTP
        """
        from apps.staff.models import Employe
        
        # Initialiser l'employé courant à None
        request.current_employe = None
        request.current_employe_role = None
        
        # Si l'utilisateur est authentifié, récupérer l'employé
        if request.user and request.user.is_authenticated:
            try:
                employe = Employe.objects.select_related('type_employe').get(user=request.user)
                request.current_employe = employe
                
                # Ajouter le rôle
                if employe.type_employe:
                    request.current_employe_role = employe.type_employe.nom_type
            except Employe.DoesNotExist:
                pass
        
        return None


class HollyPermissionMiddleware(MiddlewareMixin):
    """
    Middleware combiné qui ajoute tous les contextes nécessaires.
    
    Ce middleware combine les fonctionnalités de:
    - PermissionCheckerMiddleware
    - RestaurantContextMiddleware
    - EmployeeContextMiddleware
    
    Configuration dans settings.py:
        MIDDLEWARE = [
            ...
            'apps.staff.middleware.HollyPermissionMiddleware',
            ...
        ]
    """
    
    def process_request(self, request):
        """
        Ajoute tous les contextes nécessaires à la requête.
        
        Args:
            request: La requête HTTP
        """
        from apps.restaurant.models import Restaurant
        from apps.staff.models import Employe
        
        # 1. Ajouter le PermissionChecker
        request.permission_checker = None
        request.current_employe = None
        request.current_employe_role = None
        request.current_restaurant = None
        request.current_restaurant_id = None
        
        # Si l'utilisateur est authentifié
        if request.user and request.user.is_authenticated:
            # Créer le PermissionChecker et récupérer l'employé
            try:
                employe = Employe.objects.select_related('type_employe').get(user=request.user)
                request.current_employe = employe
                
                # Ajouter le rôle
                if employe.type_employe:
                    request.current_employe_role = employe.type_employe.nom_type
                
                # Créer le PermissionChecker
                request.permission_checker = PermissionChecker(user=request.user, employe=employe)
            except Employe.DoesNotExist:
                # Si l'utilisateur n'a pas d'employé associé
                try:
                    request.permission_checker = PermissionChecker(user=request.user)
                except Exception:
                    pass
        
        # 2. Détecter le restaurant
        restaurant_id = None
        
        # Depuis les paramètres GET
        if hasattr(request, 'GET') and 'restaurant_id' in request.GET:
            restaurant_id = request.GET.get('restaurant_id')
        
        # Depuis les données POST
        elif hasattr(request, 'POST') and 'restaurant_id' in request.POST:
            restaurant_id = request.POST.get('restaurant_id')
        
        # Depuis l'URL pattern
        elif hasattr(request, 'resolver_match') and request.resolver_match:
            kwargs = request.resolver_match.kwargs
            if 'restaurant_id' in kwargs:
                restaurant_id = kwargs['restaurant_id']
        
        # Convertir et récupérer le restaurant
        if restaurant_id:
            try:
                restaurant_id = int(restaurant_id)
                request.current_restaurant_id = restaurant_id
                
                try:
                    request.current_restaurant = Restaurant.objects.get(
                        id_restaurant=restaurant_id
                    )
                except Restaurant.DoesNotExist:
                    pass
            except (ValueError, TypeError):
                pass
        
        return None

