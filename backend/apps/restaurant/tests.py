"""
Tests pour l'application restaurant.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.restaurant.models import Restaurant

User = get_user_model()


class TestRestaurantModel(TestCase):
    """Tests pour le modèle Restaurant."""
    
    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            nom_restaurant='Restaurant Test',
            adresse_restaurant='123 Rue Test',
            code_postal='75001',
            ville='Paris',
            numero_telephone='0123456789',
            numero_siret='12345678901234',
            pin_restaurant='123456'
        )
    
    def test_create_restaurant(self):
        """Test de création d'un restaurant."""
        self.assertEqual(self.restaurant.nom_restaurant, 'Restaurant Test')
        self.assertEqual(self.restaurant.ville, 'Paris')
        self.assertEqual(self.restaurant.numero_siret, '12345678901234')
    
    def test_restaurant_str(self):
        """Test de la représentation string."""
        self.assertIn('Restaurant Test', str(self.restaurant))
    
    def test_siret_validation(self):
        """Test de validation du SIRET."""
        with self.assertRaises(ValidationError):
            restaurant = Restaurant(
                nom_restaurant='Test',
                adresse_restaurant='Adresse',
                code_postal='75001',
                ville='Paris',
                numero_telephone='0123456789',
                numero_siret='123'  # SIRET invalide
            )
            restaurant.full_clean()
    
    def test_siret_unique(self):
        """Test d'unicité du SIRET."""
        with self.assertRaises(Exception):
            Restaurant.objects.create(
                nom_restaurant='Autre Restaurant',
                adresse_restaurant='456 Rue Test',
                code_postal='75002',
                ville='Paris',
                numero_telephone='0987654321',
                numero_siret='12345678901234'  # Même SIRET
            )


class TestRestaurantAPI(APITestCase):
    """Tests pour l'API Restaurant."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.restaurant = Restaurant.objects.create(
            nom_restaurant='Restaurant Test',
            adresse_restaurant='123 Rue Test',
            code_postal='75001',
            ville='Paris',
            numero_telephone='0123456789',
            numero_siret='12345678901234',
            pin_restaurant='123456'
        )
    
    def test_list_restaurants_requires_auth(self):
        """Test que la liste nécessite l'authentification."""
        response = self.client.get('/api/restaurants/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_restaurants(self):
        """Test de liste des restaurants."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/restaurants/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_restaurant_detail(self):
        """Test de détail d'un restaurant."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/restaurants/{self.restaurant.id_restaurant}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Restaurant Test')
    
    def test_create_restaurant(self):
        """Test de création d'un restaurant."""
        self.client.force_authenticate(user=self.user)
        data = {
            'name': 'Nouveau Restaurant',
            'address': '789 Rue Nouvelle',
            'postal_code': '75003',
            'city': 'Paris',
            'phone_number': '0111222333',
            'siret': '98765432109876',
            'pin': '654321'
        }
        response = self.client.post('/api/restaurants/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Nouveau Restaurant')
