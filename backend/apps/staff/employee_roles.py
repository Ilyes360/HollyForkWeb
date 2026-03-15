"""
Définition des rôles d'employés et de leurs permissions dans Holly Pi.

Ce fichier centralise la hiérarchie des rôles et leurs permissions associées.
Il servira de référence pour l'implémentation future du système de permissions.

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

from enum import Enum
from typing import Dict, List, Set


class EmployeeRole(str, Enum):
    """Énumération des rôles d'employés disponibles dans Holly Pi."""
    
    # Rôles RESTO - Administration et Direction
    SUPER_ADMIN_GROUPE = "Super Admin Groupe"
    ADMIN_ETABLISSEMENT = "Admin Établissement"
    DIRECTEUR = "Directeur"
    
    # Rôles RESTO - Management
    MANAGER_SALLE = "Manager Salle"
    MANAGER_CUISINE = "Manager Cuisine"
    
    # Rôles RESTO - Opérationnel
    CHEF_DE_RANG = "Chef de rang"
    RUNNER = "Runner"
    SERVEUR = "Serveur"
    BARMAN = "Barman"
    PERSONNE_CAISSE = "Personne de Caisse"
    
    # Rôles RESTO - Logistique
    RESPONSABLE_STOCK = "Responsable Stock"
    RESPONSABLE_ACHATS = "Responsable Achats"
    LIVREUR = "Livreur"
    
    # Rôles RESTO - Finance
    COMPTABLE = "Comptable"
    EXPERT_COMPTABLE = "Expert-comptable"
    
    # Rôles RESTO - Temporaire
    STAGIAIRE = "Stagiaire"
    EXTRA = "Extra"
    
    # Rôles EXTERNES
    FOURNISSEUR = "Fournisseur"
    CONSULTANT = "Consultant"
    AUDITEUR = "Auditeur"


class Permission(str, Enum):
    """Énumération des permissions disponibles dans le système."""
    
    # Permissions globales
    VIEW_ALL_ESTABLISHMENTS = "view_all_establishments"
    MANAGE_LICENSES = "manage_licenses"
    VIEW_GLOBAL_STATS = "view_global_stats"
    
    # Permissions établissement
    MANAGE_ESTABLISHMENT = "manage_establishment"
    CONFIGURE_ESTABLISHMENT = "configure_establishment"
    MANAGE_MENUS = "manage_menus"
    MANAGE_PRICING = "manage_pricing"
    MANAGE_STAFF = "manage_staff"
    MANAGE_SCHEDULES = "manage_schedules"
    
    # Permissions salle
    MANAGE_SERVICE = "manage_service"
    MANAGE_RESERVATIONS = "manage_reservations"
    ASSIGN_TABLES = "assign_tables"
    ASSIGN_SERVERS = "assign_servers"
    EDIT_NOTES = "edit_notes"
    
    # Permissions cuisine
    MANAGE_MENU_ITEMS = "manage_menu_items"
    MANAGE_RECIPES = "manage_recipes"
    MANAGE_MATERIAL_NEEDS = "manage_material_needs"
    MANAGE_OUT_OF_STOCK = "manage_out_of_stock"
    VALIDATE_INVENTORY = "validate_inventory"
    
    # Permissions opérationnelles
    TAKE_ORDERS = "take_orders"
    PROCESS_PAYMENTS = "process_payments"
    TRACK_TABLES = "track_tables"
    SEND_TO_KITCHEN = "send_to_kitchen"
    SEND_TO_BAR = "send_to_bar"
    
    # Permissions bar
    MANAGE_BAR_ORDERS = "manage_bar_orders"
    MANAGE_BEVERAGE_STOCK = "manage_beverage_stock"
    MANAGE_COCKTAIL_RECIPES = "manage_cocktail_recipes"
    
    # Permissions caisse
    PROCESS_CASH = "process_cash"
    CLOSE_REGISTER = "close_register"
    GENERATE_INVOICES = "generate_invoices"
    
    # Permissions stock/achats
    MANAGE_SUPPLIER_ORDERS = "manage_supplier_orders"
    VALIDATE_DELIVERIES = "validate_deliveries"
    MANAGE_INVENTORY = "manage_inventory"
    MANAGE_STOCK_ALERTS = "manage_stock_alerts"
    
    # Permissions financières
    ACCESS_ACCOUNTING_EXPORTS = "access_accounting_exports"
    VIEW_REVENUE = "view_revenue"
    VIEW_VAT = "view_vat"
    VIEW_FINANCIAL_REPORTS = "view_financial_reports"
    
    # Permissions livraison
    ACCESS_DELIVERY_ORDERS = "access_delivery_orders"
    UPDATE_DELIVERY_STATUS = "update_delivery_status"
    
    # Permissions consultation
    VIEW_STATS = "view_stats"
    VIEW_SALES = "view_sales"
    VIEW_RATIOS = "view_ratios"
    
    # Permissions fournisseur
    ACCESS_CATALOG = "access_catalog"
    VIEW_ORDERS = "view_orders"


# Matrice des permissions par rôle
ROLE_PERMISSIONS: Dict[EmployeeRole, Set[Permission]] = {
    
    # Super Admin Groupe - Accès complet à tout
    EmployeeRole.SUPER_ADMIN_GROUPE: {
        Permission.VIEW_ALL_ESTABLISHMENTS,
        Permission.MANAGE_LICENSES,
        Permission.VIEW_GLOBAL_STATS,
        Permission.MANAGE_ESTABLISHMENT,
        Permission.CONFIGURE_ESTABLISHMENT,
        Permission.MANAGE_MENUS,
        Permission.MANAGE_PRICING,
        Permission.MANAGE_STAFF,
        Permission.MANAGE_SCHEDULES,
        Permission.MANAGE_SERVICE,
        Permission.MANAGE_RESERVATIONS,
        Permission.ASSIGN_TABLES,
        Permission.ASSIGN_SERVERS,
        Permission.EDIT_NOTES,
        Permission.MANAGE_MENU_ITEMS,
        Permission.MANAGE_RECIPES,
        Permission.MANAGE_MATERIAL_NEEDS,
        Permission.MANAGE_OUT_OF_STOCK,
        Permission.VALIDATE_INVENTORY,
        Permission.ACCESS_ACCOUNTING_EXPORTS,
        Permission.VIEW_REVENUE,
        Permission.VIEW_VAT,
        Permission.VIEW_FINANCIAL_REPORTS,
    },
    
    # Admin Établissement / Directeur - Gestion complète de l'établissement
    EmployeeRole.ADMIN_ETABLISSEMENT: {
        Permission.MANAGE_ESTABLISHMENT,
        Permission.CONFIGURE_ESTABLISHMENT,
        Permission.MANAGE_MENUS,
        Permission.MANAGE_PRICING,
        Permission.MANAGE_STAFF,
        Permission.MANAGE_SCHEDULES,
        Permission.MANAGE_SERVICE,
        Permission.MANAGE_RESERVATIONS,
        # Accès opérationnel complet (service, caisse) + dashboard
        Permission.TAKE_ORDERS,
        Permission.PROCESS_PAYMENTS,
        Permission.PROCESS_CASH,
        Permission.CLOSE_REGISTER,
        Permission.GENERATE_INVOICES,
        Permission.TRACK_TABLES,
        Permission.SEND_TO_KITCHEN,
        Permission.SEND_TO_BAR,
        Permission.VIEW_STATS,
        Permission.VIEW_SALES,
        Permission.VIEW_RATIOS,
        Permission.MANAGE_MENU_ITEMS,
        Permission.MANAGE_RECIPES,
        Permission.VALIDATE_INVENTORY,
        Permission.ACCESS_ACCOUNTING_EXPORTS,
        Permission.VIEW_REVENUE,
        Permission.VIEW_VAT,
        Permission.VIEW_FINANCIAL_REPORTS,
    },
    
    EmployeeRole.DIRECTEUR: {
        Permission.MANAGE_ESTABLISHMENT,
        Permission.CONFIGURE_ESTABLISHMENT,
        Permission.MANAGE_MENUS,
        Permission.MANAGE_PRICING,
        Permission.MANAGE_STAFF,
        Permission.MANAGE_SCHEDULES,
        Permission.MANAGE_SERVICE,
        Permission.MANAGE_RESERVATIONS,
        # Accès opérationnel complet (réservations, service, caisse) + dashboard
        Permission.TAKE_ORDERS,
        Permission.PROCESS_PAYMENTS,
        Permission.PROCESS_CASH,
        Permission.CLOSE_REGISTER,
        Permission.GENERATE_INVOICES,
        Permission.TRACK_TABLES,
        Permission.SEND_TO_KITCHEN,
        Permission.SEND_TO_BAR,
        Permission.VIEW_STATS,
        Permission.VIEW_SALES,
        Permission.VIEW_RATIOS,
        Permission.MANAGE_MENU_ITEMS,
        Permission.MANAGE_RECIPES,
        Permission.VALIDATE_INVENTORY,
        Permission.ACCESS_ACCOUNTING_EXPORTS,
        Permission.VIEW_REVENUE,
        Permission.VIEW_VAT,
        Permission.VIEW_FINANCIAL_REPORTS,
    },
    
    # Manager Salle / Responsable de Salle
    EmployeeRole.MANAGER_SALLE: {
        Permission.MANAGE_SERVICE,
        Permission.MANAGE_RESERVATIONS,
        Permission.ASSIGN_TABLES,
        Permission.ASSIGN_SERVERS,
        Permission.EDIT_NOTES,
        Permission.TAKE_ORDERS,
        Permission.TRACK_TABLES,
        Permission.PROCESS_PAYMENTS,
        Permission.PROCESS_CASH,
        Permission.GENERATE_INVOICES,
        Permission.CLOSE_REGISTER,
        # Dashboard restaurant
        Permission.VIEW_STATS,
        Permission.VIEW_SALES,
        Permission.VIEW_RATIOS,
        Permission.VIEW_FINANCIAL_REPORTS,
    },
    
    # Manager Cuisine
    EmployeeRole.MANAGER_CUISINE: {
        Permission.MANAGE_MENU_ITEMS,
        Permission.MANAGE_RECIPES,
        Permission.MANAGE_MATERIAL_NEEDS,
        Permission.MANAGE_OUT_OF_STOCK,
        Permission.VALIDATE_INVENTORY,
        Permission.MANAGE_INVENTORY,
        # Accès aux réservations et au dashboard pour la cuisine
        Permission.MANAGE_RESERVATIONS,
        Permission.VIEW_STATS,
        Permission.VIEW_SALES,
        Permission.VIEW_RATIOS,
    },
    
    # Chef de rang - accès service complet (réservation, prise de commande, encaissement)
    EmployeeRole.CHEF_DE_RANG: {
        Permission.MANAGE_RESERVATIONS,
        Permission.TAKE_ORDERS,
        Permission.PROCESS_PAYMENTS,
        Permission.PROCESS_CASH,
        Permission.GENERATE_INVOICES,
        Permission.TRACK_TABLES,
        Permission.SEND_TO_KITCHEN,
        Permission.SEND_TO_BAR,
    },
    
    # Runner - même base que Chef de rang (service opérationnel complet)
    EmployeeRole.RUNNER: {
        Permission.MANAGE_RESERVATIONS,
        Permission.TAKE_ORDERS,
        Permission.PROCESS_PAYMENTS,
        Permission.PROCESS_CASH,
        Permission.GENERATE_INVOICES,
        Permission.TRACK_TABLES,
        Permission.SEND_TO_KITCHEN,
        Permission.SEND_TO_BAR,
    },
    
    # Serveur - même base opérationnelle (réservation, prise de commande, encaissement)
    EmployeeRole.SERVEUR: {
        Permission.MANAGE_RESERVATIONS,
        Permission.TAKE_ORDERS,
        Permission.PROCESS_PAYMENTS,
        Permission.PROCESS_CASH,
        Permission.GENERATE_INVOICES,
        Permission.TRACK_TABLES,
        Permission.SEND_TO_KITCHEN,
        Permission.SEND_TO_BAR,
    },
    
    # Barman
    EmployeeRole.BARMAN: {
        Permission.MANAGE_BAR_ORDERS,
        Permission.MANAGE_BEVERAGE_STOCK,
        Permission.MANAGE_COCKTAIL_RECIPES,
        Permission.TAKE_ORDERS,
    },
    
    # Personne de Caisse
    EmployeeRole.PERSONNE_CAISSE: {
        Permission.PROCESS_CASH,
        Permission.CLOSE_REGISTER,
        Permission.GENERATE_INVOICES,
        Permission.PROCESS_PAYMENTS,
    },
    
    # Responsable Stock
    EmployeeRole.RESPONSABLE_STOCK: {
        Permission.MANAGE_SUPPLIER_ORDERS,
        Permission.VALIDATE_DELIVERIES,
        Permission.MANAGE_INVENTORY,
        Permission.MANAGE_STOCK_ALERTS,
    },
    
    # Responsable Achats
    EmployeeRole.RESPONSABLE_ACHATS: {
        Permission.MANAGE_SUPPLIER_ORDERS,
        Permission.VALIDATE_DELIVERIES,
        Permission.MANAGE_INVENTORY,
        Permission.MANAGE_STOCK_ALERTS,
    },
    
    # Comptable
    EmployeeRole.COMPTABLE: {
        Permission.ACCESS_ACCOUNTING_EXPORTS,
        Permission.VIEW_REVENUE,
        Permission.VIEW_VAT,
        Permission.VIEW_FINANCIAL_REPORTS,
    },
    
    # Expert-comptable
    EmployeeRole.EXPERT_COMPTABLE: {
        Permission.ACCESS_ACCOUNTING_EXPORTS,
        Permission.VIEW_REVENUE,
        Permission.VIEW_VAT,
        Permission.VIEW_FINANCIAL_REPORTS,
    },
    
    # Livreur
    EmployeeRole.LIVREUR: {
        Permission.ACCESS_DELIVERY_ORDERS,
        Permission.UPDATE_DELIVERY_STATUS,
    },
    
    # Stagiaire - Accès limité
    EmployeeRole.STAGIAIRE: {
        Permission.TAKE_ORDERS,
        Permission.TRACK_TABLES,
    },
    
    # Extra - même base que les rôles opérationnels standards (service)
    EmployeeRole.EXTRA: {
        Permission.MANAGE_RESERVATIONS,
        Permission.TAKE_ORDERS,
        Permission.PROCESS_PAYMENTS,
        Permission.PROCESS_CASH,
        Permission.GENERATE_INVOICES,
        Permission.TRACK_TABLES,
        Permission.SEND_TO_KITCHEN,
        Permission.SEND_TO_BAR,
    },
    
    # Fournisseur
    EmployeeRole.FOURNISSEUR: {
        Permission.ACCESS_CATALOG,
        Permission.VIEW_ORDERS,
    },
    
    # Consultant - Lecture seule
    EmployeeRole.CONSULTANT: {
        Permission.VIEW_STATS,
        Permission.VIEW_SALES,
        Permission.VIEW_RATIOS,
    },
    
    # Auditeur - Lecture seule
    EmployeeRole.AUDITEUR: {
        Permission.VIEW_STATS,
        Permission.VIEW_SALES,
        Permission.VIEW_RATIOS,
        Permission.VIEW_FINANCIAL_REPORTS,
    },
}


# Hiérarchie des rôles (du plus élevé au plus bas)
ROLE_HIERARCHY: List[EmployeeRole] = [
    EmployeeRole.SUPER_ADMIN_GROUPE,
    EmployeeRole.ADMIN_ETABLISSEMENT,
    EmployeeRole.DIRECTEUR,
    EmployeeRole.MANAGER_SALLE,
    EmployeeRole.MANAGER_CUISINE,
    EmployeeRole.COMPTABLE,
    EmployeeRole.EXPERT_COMPTABLE,
    EmployeeRole.RESPONSABLE_STOCK,
    EmployeeRole.RESPONSABLE_ACHATS,
    EmployeeRole.SERVEUR,
    EmployeeRole.CHEF_DE_RANG,
    EmployeeRole.RUNNER,
    EmployeeRole.BARMAN,
    EmployeeRole.PERSONNE_CAISSE,
    EmployeeRole.LIVREUR,
    EmployeeRole.STAGIAIRE,
    EmployeeRole.EXTRA,
    EmployeeRole.CONSULTANT,
    EmployeeRole.AUDITEUR,
    EmployeeRole.FOURNISSEUR,
]


def has_permission(role: EmployeeRole, permission: Permission) -> bool:
    """
    Vérifie si un rôle possède une permission donnée.
    
    Args:
        role: Le rôle à vérifier
        permission: La permission à vérifier
        
    Returns:
        True si le rôle possède la permission, False sinon
    """
    return permission in ROLE_PERMISSIONS.get(role, set())


def get_role_permissions(role: EmployeeRole) -> Set[Permission]:
    """
    Retourne l'ensemble des permissions d'un rôle.
    
    Args:
        role: Le rôle dont on veut les permissions
        
    Returns:
        Set des permissions du rôle
    """
    return ROLE_PERMISSIONS.get(role, set())


def get_roles_with_permission(permission: Permission) -> List[EmployeeRole]:
    """
    Retourne la liste des rôles possédant une permission donnée.
    
    Args:
        permission: La permission recherchée
        
    Returns:
        Liste des rôles possédant cette permission
    """
    return [
        role for role, perms in ROLE_PERMISSIONS.items()
        if permission in perms
    ]


def is_higher_role(role1: EmployeeRole, role2: EmployeeRole) -> bool:
    """
    Compare deux rôles dans la hiérarchie.
    
    Args:
        role1: Premier rôle
        role2: Deuxième rôle
        
    Returns:
        True si role1 est plus élevé que role2 dans la hiérarchie
    """
    try:
        index1 = ROLE_HIERARCHY.index(role1)
        index2 = ROLE_HIERARCHY.index(role2)
        return index1 < index2
    except ValueError:
        return False

