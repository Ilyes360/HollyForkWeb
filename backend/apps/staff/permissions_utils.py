"""
Utilitaires pour la gestion des permissions dans Holly Pi.

Ce fichier contient les fonctions utilitaires pour vérifier les permissions
des employés en fonction de leur rôle.

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

from typing import Optional, Set, Union
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied

from apps.staff.models import Employe, RestaurantEmploye
from apps.staff.employee_roles import (
    EmployeeRole, 
    Permission, 
    ROLE_PERMISSIONS,
    has_permission as role_has_permission,
    get_role_permissions,
    is_higher_role
)

User = get_user_model()


class PermissionChecker:
    """Classe pour vérifier les permissions d'un employé."""
    
    def __init__(self, user: Optional[User] = None, employe: Optional[Employe] = None):
        """
        Initialise le vérificateur de permissions.
        
        Args:
            user: L'utilisateur Django (optionnel)
            employe: L'employé Holly Pi (optionnel)
        """
        if user is None and employe is None:
            raise ValueError("Au moins un paramètre (user ou employe) doit être fourni")
        
        self.user = user
        self.employe = employe
        
        # Si on a un user mais pas d'employé, essayer de le récupérer
        if self.user and not self.employe:
            try:
                self.employe = self.user.employe
            except (AttributeError, Employe.DoesNotExist):
                self.employe = None
        
        # Si on a un employé mais pas de user, essayer de le récupérer
        if self.employe and not self.user:
            self.user = self.employe.user
    
    @property
    def role(self) -> Optional[EmployeeRole]:
        """Retourne le rôle de l'employé."""
        if not self.employe or not self.employe.type_employe:
            return None
        
        try:
            return EmployeeRole(self.employe.type_employe.nom_type)
        except ValueError:
            return None
    
    @property
    def permissions(self) -> Set[Permission]:
        """Retourne l'ensemble des permissions de l'employé."""
        if not self.role:
            return set()
        return get_role_permissions(self.role)
    
    def has_permission(self, permission: Union[Permission, str]) -> bool:
        """
        Vérifie si l'employé possède une permission.
        
        Args:
            permission: La permission à vérifier (enum ou string)
            
        Returns:
            True si l'employé a la permission, False sinon
        """
        if not self.role:
            return False
        
        # Convertir la string en Permission si nécessaire
        if isinstance(permission, str):
            try:
                permission = Permission(permission)
            except ValueError:
                return False
        
        return role_has_permission(self.role, permission)
    
    def has_any_permission(self, *permissions: Union[Permission, str]) -> bool:
        """
        Vérifie si l'employé possède au moins une des permissions.
        
        Args:
            *permissions: Les permissions à vérifier
            
        Returns:
            True si l'employé a au moins une permission, False sinon
        """
        return any(self.has_permission(perm) for perm in permissions)
    
    def has_all_permissions(self, *permissions: Union[Permission, str]) -> bool:
        """
        Vérifie si l'employé possède toutes les permissions.
        
        Args:
            *permissions: Les permissions à vérifier
            
        Returns:
            True si l'employé a toutes les permissions, False sinon
        """
        return all(self.has_permission(perm) for perm in permissions)
    
    def check_permission(self, permission: Union[Permission, str], raise_exception: bool = True) -> bool:
        """
        Vérifie une permission et lève une exception si nécessaire.
        
        Args:
            permission: La permission à vérifier
            raise_exception: Si True, lève une exception si la permission est refusée
            
        Returns:
            True si l'employé a la permission
            
        Raises:
            PermissionDenied: Si l'employé n'a pas la permission et raise_exception=True
        """
        has_perm = self.has_permission(permission)
        
        if not has_perm and raise_exception:
            perm_name = permission.value if isinstance(permission, Permission) else permission
            raise PermissionDenied(
                f"Permission refusée: {perm_name}. "
                f"Rôle requis avec cette permission."
            )
        
        return has_perm
    
    def is_higher_than(self, other_role: Union[EmployeeRole, str]) -> bool:
        """
        Vérifie si le rôle de l'employé est plus élevé qu'un autre rôle.
        
        Args:
            other_role: Le rôle à comparer (enum ou string)
            
        Returns:
            True si le rôle de l'employé est plus élevé, False sinon
        """
        if not self.role:
            return False
        
        # Convertir la string en EmployeeRole si nécessaire
        if isinstance(other_role, str):
            try:
                other_role = EmployeeRole(other_role)
            except ValueError:
                return False
        
        return is_higher_role(self.role, other_role)
    
    def get_restaurants(self):
        """
        Retourne la liste des restaurants auxquels l'employé a accès.
        
        Returns:
            QuerySet des restaurants
        """
        if not self.employe:
            return []
        
        # Super Admin Groupe a accès à tous les restaurants
        if self.role == EmployeeRole.SUPER_ADMIN_GROUPE:
            from apps.restaurant.models import Restaurant
            return Restaurant.objects.all()
        
        # Les autres employés ont accès uniquement à leurs restaurants
        return [re.restaurant for re in RestaurantEmploye.objects.filter(employe=self.employe)]
    
    def has_access_to_restaurant(self, restaurant_id: int) -> bool:
        """
        Vérifie si l'employé a accès à un restaurant spécifique.
        
        Args:
            restaurant_id: L'ID du restaurant
            
        Returns:
            True si l'employé a accès, False sinon
        """
        if not self.employe:
            return False
        
        # Super Admin Groupe a accès à tous les restaurants
        if self.role == EmployeeRole.SUPER_ADMIN_GROUPE:
            return True
        
        # Vérifier si l'employé est associé au restaurant
        return RestaurantEmploye.objects.filter(
            employe=self.employe,
            restaurant_id=restaurant_id
        ).exists()


def get_permission_checker(user_or_employe: Union[User, Employe]) -> PermissionChecker:
    """
    Factory pour créer un PermissionChecker.
    
    Args:
        user_or_employe: Un User ou un Employe
        
    Returns:
        Une instance de PermissionChecker
    """
    if isinstance(user_or_employe, User):
        return PermissionChecker(user=user_or_employe)
    elif isinstance(user_or_employe, Employe):
        return PermissionChecker(employe=user_or_employe)
    else:
        raise TypeError("Le paramètre doit être un User ou un Employe")


def user_has_permission(user: User, permission: Union[Permission, str]) -> bool:
    """
    Vérifie rapidement si un utilisateur a une permission.
    
    Args:
        user: L'utilisateur
        permission: La permission à vérifier
        
    Returns:
        True si l'utilisateur a la permission, False sinon
    """
    try:
        checker = PermissionChecker(user=user)
        return checker.has_permission(permission)
    except Exception:
        return False


def employe_has_permission(employe: Employe, permission: Union[Permission, str]) -> bool:
    """
    Vérifie rapidement si un employé a une permission.
    
    Args:
        employe: L'employé
        permission: La permission à vérifier
        
    Returns:
        True si l'employé a la permission, False sinon
    """
    try:
        checker = PermissionChecker(employe=employe)
        return checker.has_permission(permission)
    except Exception:
        return False

