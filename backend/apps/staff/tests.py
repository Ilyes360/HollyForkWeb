"""
Tests pour l'application staff.

Couverture : TypeEmploye, Employe, RestaurantEmploye (modèles, validations, API).
Gestion du personnel : types d'employés, employés, association restaurant–employé (dont unicité du PIN par restaurant).
"""

from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from apps.staff.models import TypeEmploye, Employe, RestaurantEmploye
from apps.restaurant.models import Restaurant

User = get_user_model()


def _make_restaurant(numero_siret="12345678901234"):
    return Restaurant.objects.create(
        nom_restaurant="Restaurant Staff Test",
        adresse_restaurant="1 Rue Test",
        code_postal="75001",
        ville="Paris",
        numero_telephone="0123456789",
        numero_siret=numero_siret,
    )


# --- Modèles ---


class TypeEmployeModelTests(TestCase):
    """Tests du modèle TypeEmploye."""

    def test_create(self):
        """Création d'un type d'employé."""
        t = TypeEmploye.objects.create(
            nom_type="Serveur",
            description="Employé en salle",
        )
        self.assertEqual(t.nom_type, "Serveur")
        self.assertEqual(t.description, "Employé en salle")

    def test_str(self):
        """Représentation string."""
        t = TypeEmploye.objects.create(nom_type="Manager", description="")
        self.assertEqual(str(t), "Manager")

    def test_unique_nom_type(self):
        """Unicité du nom de type."""
        TypeEmploye.objects.create(nom_type="Cuisinier", description="")
        with self.assertRaises(Exception):
            TypeEmploye.objects.create(nom_type="Cuisinier", description="Autre")


class EmployeModelTests(TestCase):
    """Tests du modèle Employe."""

    def setUp(self):
        self.type_employe = TypeEmploye.objects.create(
            nom_type="Serveur",
            description="Employé en salle",
        )
        self.user = User.objects.create_user(
            username="empuser",
            email="emp@test.com",
            password="testpass123",
        )

    def test_create_with_user(self):
        """Création d'un employé lié à un user."""
        e = Employe.objects.create(
            user=self.user,
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        self.assertEqual(e.nom, "Dupont")
        self.assertEqual(e.prenom, "Jean")
        self.assertEqual(e.pin_code, "1234")

    def test_create_without_user(self):
        """Création d'un employé sans user (user null autorisé)."""
        e = Employe.objects.create(
            nom="Martin",
            prenom="Paul",
            type_employe=self.type_employe,
            pin_code="0000",
        )
        self.assertIsNone(e.user)
        self.assertEqual(e.nom_complet, "Paul Martin")

    def test_str(self):
        """Représentation string."""
        e = Employe.objects.create(
            user=self.user,
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        s = str(e)
        self.assertIn("Jean", s)
        self.assertIn("Dupont", s)
        self.assertIn("Serveur", s)

    def test_nom_complet(self):
        """Propriété nom_complet."""
        e = Employe.objects.create(
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        self.assertEqual(e.nom_complet, "Jean Dupont")

    def test_calculer_anciennete(self):
        """Calcul d'ancienneté en années."""
        e = Employe.objects.create(
            user=self.user,
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        n = e.calculer_anciennete()
        self.assertIsInstance(n, int)
        self.assertGreaterEqual(n, 0)

    def test_to_dict(self):
        """Export to_dict."""
        e = Employe.objects.create(
            user=self.user,
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        d = e.to_dict()
        self.assertEqual(d["nom"], "Dupont")
        self.assertEqual(d["prenom"], "Jean")
        self.assertIn("nom_complet", d)
        self.assertEqual(d["type_employe"], "Serveur")


class RestaurantEmployeModelTests(TestCase):
    """Tests du modèle RestaurantEmploye (association restaurant–employé)."""

    def setUp(self):
        self.restaurant = _make_restaurant()
        self.type_employe = TypeEmploye.objects.create(nom_type="Serveur", description="")
        self.user = User.objects.create_user(
            username="reuser",
            email="re@test.com",
            password="testpass123",
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )

    def test_create(self):
        """Création d'une association restaurant–employé."""
        re = RestaurantEmploye.objects.create(
            restaurant=self.restaurant,
            employe=self.employe,
        )
        self.assertEqual(re.restaurant, self.restaurant)
        self.assertEqual(re.employe, self.employe)

    def test_str(self):
        """Représentation string."""
        RestaurantEmploye.objects.create(
            restaurant=self.restaurant,
            employe=self.employe,
        )
        re = RestaurantEmploye.objects.get(restaurant=self.restaurant, employe=self.employe)
        s = str(re)
        self.assertIn(self.restaurant.nom_restaurant, s)
        self.assertIn("Jean Dupont", s)

    def test_unique_together_restaurant_employe(self):
        """Unicité (restaurant, employe)."""
        RestaurantEmploye.objects.create(
            restaurant=self.restaurant,
            employe=self.employe,
        )
        with self.assertRaises(Exception):
            RestaurantEmploye.objects.create(
                restaurant=self.restaurant,
                employe=self.employe,
            )

    def test_pin_code_unique_per_restaurant(self):
        """Deux employés avec le même PIN dans le même restaurant → ValidationError au save du second lien."""
        employe2 = Employe.objects.create(
            nom="Martin",
            prenom="Paul",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        RestaurantEmploye.objects.create(
            restaurant=self.restaurant,
            employe=self.employe,
        )
        with self.assertRaises(ValidationError):
            RestaurantEmploye.objects.create(
                restaurant=self.restaurant,
                employe=employe2,
            )

    def test_same_pin_different_restaurant_ok(self):
        """Même PIN dans un autre restaurant accepté."""
        autre_restaurant = _make_restaurant(numero_siret="99998888777766")
        employe2 = Employe.objects.create(
            nom="Martin",
            prenom="Paul",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        RestaurantEmploye.objects.create(
            restaurant=self.restaurant,
            employe=self.employe,
        )
        re2 = RestaurantEmploye.objects.create(
            restaurant=autre_restaurant,
            employe=employe2,
        )
        self.assertEqual(re2.employe.pin_code, "1234")


# --- Serializers (validations) ---


class EmployeSerializerTests(TestCase):
    """Tests des validations du EmployeSerializer."""

    def setUp(self):
        self.type_employe = TypeEmploye.objects.create(nom_type="Serveur", description="")
        self.user = User.objects.create_user(
            username="serialuser",
            email="serial@test.com",
            password="testpass123",
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )

    def test_validate_user_already_linked_rejected(self):
        """Un user déjà associé à un autre employé ne peut pas être réutilisé."""
        from apps.staff.serializers import EmployeSerializer
        user2 = User.objects.create_user(
            username="other",
            email="other@test.com",
            password="testpass123",
        )
        Employe.objects.create(
            user=user2,
            nom="Autre",
            prenom="Employe",
            type_employe=self.type_employe,
            pin_code="9999",
        )
        data = {
            "user_id": self.user.id,
            "last_name": "Nouveau",
            "first_name": "Employe",
            "type_employe_id": self.type_employe.id,
        }
        serializer = EmployeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("user", serializer.errors)


class RestaurantEmployeSerializerTests(TestCase):
    """Tests des validations du RestaurantEmployeSerializer."""

    def setUp(self):
        self.restaurant = _make_restaurant()
        self.type_employe = TypeEmploye.objects.create(nom_type="Serveur", description="")
        self.employe = Employe.objects.create(
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        RestaurantEmploye.objects.create(
            restaurant=self.restaurant,
            employe=self.employe,
        )

    def test_validate_duplicate_association_rejected(self):
        """Association (restaurant, employe) déjà existante → refusé."""
        from apps.staff.serializers import RestaurantEmployeSerializer
        data = {
            "restaurant_id": self.restaurant.id_restaurant,
            "employe_id": self.employe.id,
        }
        serializer = RestaurantEmployeSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)


# --- API ---


class TypeEmployeAPITests(APITestCase):
    """Tests de l'API types d'employés."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="typeapi",
            email="type@test.com",
            password="testpass123",
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type="Serveur",
            description="Employé en salle",
        )

    def test_list_requires_auth(self):
        """Liste requiert une authentification."""
        response = self.client.get("/api/type-employes/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/type-employes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertIsInstance(results, list)

    def test_filter_by_id_valid(self):
        """Filtre par id (entier valide)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/type-employes/?id={self.type_employe.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["type_name"], "Serveur")

    def test_filter_by_id_invalid_returns_empty(self):
        """Filtre par id invalide (non numérique) → liste vide."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/type-employes/?id=abc")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_retrieve(self):
        """Détail d'un type d'employé."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/type-employes/{self.type_employe.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["type_name"], "Serveur")

    def test_create_type_employe(self):
        """Création d'un type d'employé."""
        self.client.force_authenticate(user=self.user)
        payload = {"type_name": "Barman", "description": "Employé au bar"}
        response = self.client.post("/api/type-employes/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["type_name"], "Barman")

    def test_update_type_employe(self):
        """Mise à jour d'un type d'employé."""
        self.client.force_authenticate(user=self.user)
        payload = {"description": "Nouvelle description"}
        response = self.client.patch(
            f"/api/type-employes/{self.type_employe.id}/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.type_employe.refresh_from_db()
        self.assertEqual(self.type_employe.description, "Nouvelle description")


class EmployeAPITests(APITestCase):
    """Tests de l'API employés."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="empapi",
            email="empapi@test.com",
            password="testpass123",
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type="Serveur",
            description="",
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )

    def test_list_requires_auth(self):
        """Liste requiert une authentification."""
        response = self.client.get("/api/employes/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/employes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertIsInstance(results, list)

    def test_filter_by_id_valid(self):
        """Filtre par id (entier valide)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/employes/?id={self.employe.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["last_name"], "Dupont")

    def test_filter_by_id_invalid_returns_empty(self):
        """Filtre par id invalide → liste vide."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/employes/?id=xyz")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_retrieve(self):
        """Détail d'un employé."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/employes/{self.employe.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["last_name"], "Dupont")
        self.assertEqual(response.data["first_name"], "Jean")

    def test_create_employe(self):
        """Création d'un employé (sans user)."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "last_name": "Martin",
            "first_name": "Paul",
            "type_employe_id": self.type_employe.id,
        }
        response = self.client.post("/api/employes/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["last_name"], "Martin")
        self.assertEqual(response.data["first_name"], "Paul")

    def test_update_employe(self):
        """Mise à jour partielle d'un employé."""
        self.client.force_authenticate(user=self.user)
        payload = {"last_name": "Dupond", "phone_number": "+33612345678"}
        response = self.client.patch(
            f"/api/employes/{self.employe.id}/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.employe.refresh_from_db()
        self.assertEqual(self.employe.nom, "Dupond")


class RestaurantEmployeAPITests(APITestCase):
    """Tests de l'API associations restaurant–employé."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="reapi",
            email="reapi@test.com",
            password="testpass123",
        )
        self.restaurant = _make_restaurant()
        self.type_employe = TypeEmploye.objects.create(nom_type="Serveur", description="")
        self.employe = Employe.objects.create(
            user=self.user,
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        self.association = RestaurantEmploye.objects.create(
            restaurant=self.restaurant,
            employe=self.employe,
        )

    def test_list_requires_auth(self):
        """Liste requiert une authentification."""
        response = self.client.get("/api/restaurant-employes/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/restaurant-employes/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_restaurant(self):
        """Filtre par restaurant."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/restaurant-employes/?restaurant={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["restaurant"]["restaurant_id"], self.restaurant.id_restaurant)

    def test_filter_by_employe(self):
        """Filtre par employe."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/restaurant-employes/?employe={self.employe.id}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["employe"]["id"], self.employe.id)

    def test_filter_by_id_invalid_returns_empty(self):
        """Filtre par id invalide → liste vide."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/restaurant-employes/?id=abc")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_retrieve(self):
        """Détail d'une association."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/restaurant-employes/{self.association.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.association.id)

    def test_create_association(self):
        """Création d'une association restaurant–employé."""
        autre_restaurant = _make_restaurant(numero_siret="11112222333344")
        autre_employe = Employe.objects.create(
            nom="Martin",
            prenom="Paul",
            type_employe=self.type_employe,
            pin_code="5678",
        )
        self.client.force_authenticate(user=self.user)
        payload = {
            "restaurant_id": autre_restaurant.id_restaurant,
            "employe_id": autre_employe.id,
        }
        response = self.client.post(
            "/api/restaurant-employes/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["employe"]["last_name"], "Martin")

    def test_create_duplicate_association_400(self):
        """Création d'une association déjà existante → 400."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "restaurant_id": self.restaurant.id_restaurant,
            "employe_id": self.employe.id,
        }
        response = self.client.post(
            "/api/restaurant-employes/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_association(self):
        """Suppression d'une association."""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(
            f"/api/restaurant-employes/{self.association.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            RestaurantEmploye.objects.filter(id=self.association.id).exists()
        )
