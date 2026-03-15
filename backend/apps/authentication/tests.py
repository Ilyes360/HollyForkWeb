"""
Tests pour l'application authentication.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class TestHollyUser(TestCase):
    """Tests pour le modèle HollyUser."""
    
    def test_create_user(self):
        """Test de création d'un utilisateur."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
    
    def test_create_superuser(self):
        """Test de création d'un superutilisateur."""
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
    
    def test_user_str(self):
        """Test de la représentation string."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.assertIn('testuser', str(user))
    
    def test_get_full_name(self):
        """Test de get_full_name."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Jean',
            last_name='Dupont'
        )
        self.assertEqual(user.get_full_name(), 'Jean Dupont')
    
    def test_get_full_name_empty(self):
        """Test de get_full_name sans nom."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        # Retourne username si pas de nom complet
        self.assertEqual(user.get_full_name(), 'testuser')


class TestAuthenticationAPI(APITestCase):
    """Tests pour les endpoints d'authentification."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_csrf_token_endpoint(self):
        """Test de l'endpoint CSRF."""
        response = self.client.get('/csrf/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('csrfToken', response.data)
    
    def test_logout_unauthenticated(self):
        """Test de déconnexion sans être connecté."""
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_profile_requires_auth(self):
        """Test que le profil requiert l'authentification."""
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_profile_authenticated(self):
        """Test d'accès au profil authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user.username)
