"""
Décorateurs pour la gestion des permissions dans Holly Pi.

Ce fichier contient les décorateurs pour protéger les vues Django
et Django REST Framework avec des vérifications de permissions.

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

from functools import wraps
from typing import Union, Callable, List
from django.core.exceptions import PermissionDenied
from django.contrib.auth.decorators import login_required
from rest_framework import status
from rest_framework.response import Response

from apps.staff.employee_roles import Permission, EmployeeRole
from apps.staff.permissions_utils import PermissionChecker


def require_permission(*permissions: Union[Permission, str], require_all: bool = False):
    """
    Décorateur pour vérifier qu'un utilisateur a les permissions requises.
    
    Args:
        *permissions: Les permissions requises
        require_all: Si True, toutes les permissions sont requises.
                    Si False, au moins une permission est requise.
    
    Usage:
        @require_permission(Permission.MANAGE_STAFF)
        def my_view(request):
            ...
            
        @require_permission(Permission.TAKE_ORDERS, Permission.MANAGE_SERVICE, require_all=False)
        def my_view(request):
            ...
    """
    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        @login_required
        def wrapped_view(request, *args, **kwargs):
            try:
                checker = PermissionChecker(user=request.user)
                
                if require_all:
                    has_perms = checker.has_all_permissions(*permissions)
                    error_msg = f"Permissions requises: {', '.join(p.value if isinstance(p, Permission) else p for p in permissions)}"
                else:
                    has_perms = checker.has_any_permission(*permissions)
                    error_msg = f"Au moins une des permissions requises: {', '.join(p.value if isinstance(p, Permission) else p for p in permissions)}"
                
                if not has_perms:
                    raise PermissionDenied(error_msg)
                
                return view_func(request, *args, **kwargs)
            except Exception as e:
                if isinstance(e, PermissionDenied):
                    raise
                raise PermissionDenied("Erreur lors de la vérification des permissions")
        
        return wrapped_view
    return decorator


def require_role(*roles: Union[EmployeeRole, str]):
    """
    Décorateur pour vérifier qu'un utilisateur a l'un des rôles requis.
    
    Args:
        *roles: Les rôles autorisés
    
    Usage:
        @require_role(EmployeeRole.ADMIN_ETABLISSEMENT, EmployeeRole.DIRECTEUR)
        def my_view(request):
            ...
    """
    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        @login_required
        def wrapped_view(request, *args, **kwargs):
            try:
                checker = PermissionChecker(user=request.user)
                
                if not checker.role:
                    raise PermissionDenied("Aucun rôle assigné à cet utilisateur")
                
                # Convertir les strings en EmployeeRole si nécessaire
                allowed_roles = []
                for role in roles:
                    if isinstance(role, str):
                        try:
                            role = EmployeeRole(role)
                        except ValueError:
                            continue
                    allowed_roles.append(role)
                
                if checker.role not in allowed_roles:
                    raise PermissionDenied(
                        f"Rôle requis: {', '.join(r.value for r in allowed_roles)}"
                    )
                
                return view_func(request, *args, **kwargs)
            except Exception as e:
                if isinstance(e, PermissionDenied):
                    raise
                raise PermissionDenied("Erreur lors de la vérification du rôle")
        
        return wrapped_view
    return decorator


def require_restaurant_access(restaurant_param: str = 'restaurant_id'):
    """
    Décorateur pour vérifier qu'un utilisateur a accès à un restaurant.
    
    Args:
        restaurant_param: Le nom du paramètre contenant l'ID du restaurant
                         (dans kwargs pour les URL patterns, ou dans request.data/GET pour les API)
    
    Usage:
        @require_restaurant_access('restaurant_id')
        def my_view(request, restaurant_id):
            ...
    """
    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        @login_required
        def wrapped_view(request, *args, **kwargs):
            try:
                checker = PermissionChecker(user=request.user)
                
                # Essayer de récupérer l'ID du restaurant
                restaurant_id = None
                
                # 1. Chercher dans kwargs (URL pattern)
                if restaurant_param in kwargs:
                    restaurant_id = kwargs[restaurant_param]
                
                # 2. Chercher dans GET params
                elif hasattr(request, 'GET') and restaurant_param in request.GET:
                    restaurant_id = request.GET.get(restaurant_param)
                
                # 3. Chercher dans POST data
                elif hasattr(request, 'POST') and restaurant_param in request.POST:
                    restaurant_id = request.POST.get(restaurant_param)
                
                # 4. Chercher dans request.data (DRF)
                elif hasattr(request, 'data') and restaurant_param in request.data:
                    restaurant_id = request.data.get(restaurant_param)
                
                if not restaurant_id:
                    raise PermissionDenied(f"Paramètre '{restaurant_param}' requis")
                
                # Convertir en int si nécessaire
                try:
                    restaurant_id = int(restaurant_id)
                except (ValueError, TypeError):
                    raise PermissionDenied(f"ID de restaurant invalide: {restaurant_id}")
                
                # Vérifier l'accès
                if not checker.has_access_to_restaurant(restaurant_id):
                    raise PermissionDenied(
                        f"Accès refusé au restaurant {restaurant_id}"
                    )
                
                return view_func(request, *args, **kwargs)
            except Exception as e:
                if isinstance(e, PermissionDenied):
                    raise
                raise PermissionDenied("Erreur lors de la vérification de l'accès au restaurant")
        
        return wrapped_view
    return decorator


def api_require_permission(*permissions: Union[Permission, str], require_all: bool = False):
    """
    Décorateur pour les vues API (DRF) nécessitant des permissions.
    
    Args:
        *permissions: Les permissions requises
        require_all: Si True, toutes les permissions sont requises.
                    Si False, au moins une permission est requise.
    
    Usage:
        @api_require_permission(Permission.MANAGE_STAFF)
        def my_api_view(request):
            ...
    """
    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Vérifier l'authentification
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentification requise'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            try:
                checker = PermissionChecker(user=request.user)
                
                if require_all:
                    has_perms = checker.has_all_permissions(*permissions)
                else:
                    has_perms = checker.has_any_permission(*permissions)
                
                if not has_perms:
                    perm_names = ', '.join(
                        p.value if isinstance(p, Permission) else p 
                        for p in permissions
                    )
                    return Response(
                        {
                            'error': 'Permission refusée',
                            'required_permissions': perm_names,
                            'require_all': require_all
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                return view_func(request, *args, **kwargs)
            except Exception as e:
                return Response(
                    {'error': 'Erreur lors de la vérification des permissions', 'detail': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return wrapped_view
    return decorator


def api_require_role(*roles: Union[EmployeeRole, str]):
    """
    Décorateur pour les vues API (DRF) nécessitant un rôle spécifique.
    
    Args:
        *roles: Les rôles autorisés
    
    Usage:
        @api_require_role(EmployeeRole.ADMIN_ETABLISSEMENT, EmployeeRole.DIRECTEUR)
        def my_api_view(request):
            ...
    """
    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # Vérifier l'authentification
            if not request.user or not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentification requise'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            try:
                checker = PermissionChecker(user=request.user)
                
                if not checker.role:
                    return Response(
                        {'error': 'Aucun rôle assigné à cet utilisateur'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Convertir les strings en EmployeeRole si nécessaire
                allowed_roles = []
                for role in roles:
                    if isinstance(role, str):
                        try:
                            role = EmployeeRole(role)
                        except ValueError:
                            continue
                    allowed_roles.append(role)
                
                if checker.role not in allowed_roles:
                    return Response(
                        {
                            'error': 'Rôle insuffisant',
                            'required_roles': [r.value for r in allowed_roles],
                            'current_role': checker.role.value
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                return view_func(request, *args, **kwargs)
            except Exception as e:
                return Response(
                    {'error': 'Erreur lors de la vérification du rôle', 'detail': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return wrapped_view
    return decorator

