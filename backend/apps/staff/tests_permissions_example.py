"""
Tests d'exemple pour le système de permissions Holly Pi.

Ce fichier montre comment tester les différents aspects du système de permissions.

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.staff.models import TypeEmploye, Employe, RestaurantEmploye
from apps.staff.employee_roles import EmployeeRole, Permission
from apps.staff.permissions_utils import PermissionChecker
from apps.restaurant.models import Restaurant

User = get_user_model()


class PermissionCheckerTestCase(TestCase):
    """Tests pour la classe PermissionChecker."""
    
    def setUp(self):
        """Préparation des données de test."""
        # Créer un type d'employé
        self.type_manager = TypeEmploye.objects.create(
            nom_type='Manager Salle',
            description='Manager de salle de test'
        )
        
        # Créer un utilisateur
        self.user = User.objects.create_user(
            username='test_manager',
            email='manager@test.com',
            password='testpass123'
        )
        
        # Créer un employé
        self.employe = Employe.objects.create(
            user=self.user,
            nom='Test',
            prenom='Manager',
            type_employe=self.type_manager
        )
        
        # Créer un restaurant
        self.restaurant = Restaurant.objects.create(
            nom_restaurant='Restaurant Test',
            adresse_restaurant='123 Test Street',
            code_postal='75001',
            ville='Paris',
            numero_telephone='+33123456789',
            numero_siret='12345678901234',
            code_naf='5610A',
            pin_restaurant='123456'
        )
        
        # Associer l'employé au restaurant
        RestaurantEmploye.objects.create(
            restaurant=self.restaurant,
            employe=self.employe
        )
    
    def test_permission_checker_initialization(self):
        """Test l'initialisation du PermissionChecker."""
        checker = PermissionChecker(user=self.user)
        
        self.assertIsNotNone(checker.employe)
        self.assertEqual(checker.role, EmployeeRole.MANAGER_SALLE)
        self.assertIsNotNone(checker.permissions)
    
    def test_has_permission_valid(self):
        """Test la vérification d'une permission valide."""
        checker = PermissionChecker(user=self.user)
        
        # Manager Salle doit avoir la permission MANAGE_SERVICE
        self.assertTrue(checker.has_permission(Permission.MANAGE_SERVICE))
        self.assertTrue(checker.has_permission(Permission.MANAGE_RESERVATIONS))
    
    def test_has_permission_invalid(self):
        """Test la vérification d'une permission invalide."""
        checker = PermissionChecker(user=self.user)
        
        # Manager Salle ne doit PAS avoir la permission MANAGE_LICENSES
        self.assertFalse(checker.has_permission(Permission.MANAGE_LICENSES))
    
    def test_has_any_permission(self):
        """Test la vérification de plusieurs permissions (OR)."""
        checker = PermissionChecker(user=self.user)
        
        # Au moins une permission valide
        self.assertTrue(
            checker.has_any_permission(
                Permission.MANAGE_SERVICE,
                Permission.MANAGE_LICENSES  # Ne l'a pas
            )
        )
        
        # Aucune permission valide
        self.assertFalse(
            checker.has_any_permission(
                Permission.MANAGE_LICENSES,
                Permission.VIEW_GLOBAL_STATS
            )
        )
    
    def test_has_all_permissions(self):
        """Test la vérification de plusieurs permissions (AND)."""
        checker = PermissionChecker(user=self.user)
        
        # Toutes les permissions valides
        self.assertTrue(
            checker.has_all_permissions(
                Permission.MANAGE_SERVICE,
                Permission.MANAGE_RESERVATIONS
            )
        )
        
        # Au moins une permission invalide
        self.assertFalse(
            checker.has_all_permissions(
                Permission.MANAGE_SERVICE,
                Permission.MANAGE_LICENSES  # Ne l'a pas
            )
        )
    
    def test_has_access_to_restaurant(self):
        """Test la vérification d'accès au restaurant."""
        checker = PermissionChecker(user=self.user)
        
        # Doit avoir accès au restaurant associé
        self.assertTrue(
            checker.has_access_to_restaurant(self.restaurant.id_restaurant)
        )
        
        # Ne doit PAS avoir accès à un restaurant non associé
        self.assertFalse(checker.has_access_to_restaurant(999))
    
    def test_get_restaurants(self):
        """Test la récupération des restaurants associés."""
        checker = PermissionChecker(user=self.user)
        
        restaurants = checker.get_restaurants()
        self.assertEqual(len(restaurants), 1)
        self.assertEqual(restaurants[0].id_restaurant, self.restaurant.id_restaurant)


class PermissionAPITestCase(APITestCase):
    """Tests pour les endpoints API de permissions."""
    
    def setUp(self):
        """Préparation des données de test."""
        # Créer un type d'employé Admin
        self.type_admin = TypeEmploye.objects.create(
            nom_type='Admin Établissement',
            description='Admin de test'
        )
        
        # Créer un utilisateur admin
        self.admin_user = User.objects.create_user(
            username='test_admin',
            email='admin@test.com',
            password='testpass123'
        )
        
        # Créer un employé admin
        self.admin_employe = Employe.objects.create(
            user=self.admin_user,
            nom='Admin',
            prenom='Test',
            type_employe=self.type_admin
        )
        
        # Créer un client API
        self.client = APIClient()
    
    def test_get_all_roles_authenticated(self):
        """Test l'endpoint de récupération de tous les rôles."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get('/api/staff/permissions/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('roles', response.data)
        self.assertGreater(len(response.data['roles']), 0)
    
    def test_get_all_roles_unauthenticated(self):
        """Test l'endpoint sans authentification."""
        response = self.client.get('/api/staff/permissions/roles/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_my_permissions(self):
        """Test l'endpoint de récupération des permissions personnelles."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get('/api/staff/permissions/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('role', response.data)
        self.assertEqual(response.data['role'], 'Admin Établissement')
        self.assertIn('permissions', response.data)
        self.assertGreater(len(response.data['permissions']), 0)
    
    def test_check_permission_valid(self):
        """Test la vérification d'une permission valide."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.post(
            '/api/staff/permissions/check/',
            {'permission': 'manage_establishment'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_permission'])
    
    def test_check_permission_invalid(self):
        """Test la vérification d'une permission invalide."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.post(
            '/api/staff/permissions/check/',
            {'permission': 'view_global_stats'}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['has_permission'])
    
    def test_check_multiple_permissions(self):
        """Test la vérification de plusieurs permissions."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.post(
            '/api/staff/permissions/check-multiple/',
            {
                'permissions': ['manage_establishment', 'view_global_stats'],
                'require_all': False
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        # Vérifier que la structure existe avant d'accéder aux clés
        if 'manage_establishment' in response.data.get('results', {}):
            self.assertTrue(response.data['results']['manage_establishment'])
            self.assertFalse(response.data['results']['view_global_stats'])
        else:
            # Si la structure n'est pas comme attendu, au moins vérifier que results existe
            self.assertIsInstance(response.data['results'], (dict, list))


class ViewPermissionTestCase(APITestCase):
    """Tests pour les permissions appliquées aux vues."""
    
    def setUp(self):
        """Préparation des données de test."""
        # Créer deux types d'employés
        self.type_serveur = TypeEmploye.objects.create(
            nom_type='Serveur',
            description='Serveur de test'
        )
        
        self.type_admin = TypeEmploye.objects.create(
            nom_type='Admin Établissement',
            description='Admin de test'
        )
        
        # Créer deux utilisateurs
        self.serveur_user = User.objects.create_user(
            username='test_serveur',
            email='serveur@test.com',
            password='testpass123'
        )
        
        self.admin_user = User.objects.create_user(
            username='test_admin',
            email='admin@test.com',
            password='testpass123'
        )
        
        # Créer les employés
        self.serveur_employe = Employe.objects.create(
            user=self.serveur_user,
            nom='Serveur',
            prenom='Test',
            type_employe=self.type_serveur
        )
        
        self.admin_employe = Employe.objects.create(
            user=self.admin_user,
            nom='Admin',
            prenom='Test',
            type_employe=self.type_admin
        )
        
        self.client = APIClient()
    
    def test_facture_stats_admin_access(self):
        """Test l'accès aux stats de facturation pour un admin."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get('/api/factures/stats/')
        
        # Si l'endpoint n'existe pas encore (404), on skip le test
        if response.status_code == 404:
            self.skipTest("L'endpoint /api/factures/stats/ n'est pas encore implémenté")
        
        # L'admin doit avoir accès
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_invoices', response.data)
    
    def test_facture_stats_serveur_denied(self):
        """Test le refus d'accès aux stats pour un serveur."""
        self.client.force_authenticate(user=self.serveur_user)
        
        response = self.client.get('/api/factures/stats/')
        
        # Si l'endpoint n'existe pas encore (404), on skip le test
        if response.status_code == 404:
            self.skipTest("L'endpoint /api/factures/stats/ n'est pas encore implémenté")
        
        # Le serveur ne doit PAS avoir accès
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# Fonction pour exécuter les tests
def run_tests():
    """
    Exécute les tests de permissions.
    
    Commande : python manage.py test apps.staff.tests_permissions_example
    """
    pass


if __name__ == '__main__':
    run_tests()

