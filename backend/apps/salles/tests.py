"""
Tests pour l'application salles.

Couverture : modèles Salle et Table, validations serializers, API (salles, tables, action status).
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from apps.restaurant.models import Restaurant
from apps.salles.models import Salle, Table
from apps.salles.serializers import SalleSerializer, TableSerializer
from apps.staff.models import TypeEmploye, Employe, RestaurantEmploye

User = get_user_model()


def _make_restaurant(numero_siret="12345678901234", nom_restaurant="Restaurant Salles Test", **kwargs):
    """Crée un restaurant de test. numero_siret doit être unique par restaurant."""
    return Restaurant.objects.create(
        nom_restaurant=nom_restaurant,
        adresse_restaurant=kwargs.get("adresse_restaurant", "1 Rue Test"),
        code_postal=kwargs.get("code_postal", "75001"),
        ville=kwargs.get("ville", "Paris"),
        numero_telephone=kwargs.get("numero_telephone", "0123456789"),
        numero_siret=numero_siret,
    )


# --- Modèles ---


class SalleModelTests(TestCase):
    """Tests du modèle Salle."""

    def setUp(self):
        self.restaurant = _make_restaurant()

    def test_create_salle(self):
        """Création d'une salle."""
        salle = Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Salle Principale",
            capacite=50,
            etage=0,
        )
        self.assertEqual(salle.nom_salle, "Salle Principale")
        self.assertEqual(salle.capacite, 50)
        self.assertEqual(salle.etage, 0)
        self.assertIsNone(salle.description)

    def test_str(self):
        """Représentation string."""
        salle = Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Terrasse",
            capacite=20,
        )
        s = str(salle)
        self.assertIn("Terrasse", s)
        self.assertIn(self.restaurant.nom_restaurant, s)

    def test_to_dict(self):
        """Export to_dict."""
        salle = Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="VIP",
            capacite=10,
            etage=1,
            description="Salle privée",
        )
        d = salle.to_dict()
        self.assertEqual(d["nom"], "VIP")
        self.assertEqual(d["capacite"], 10)
        self.assertEqual(d["etage"], 1)
        self.assertIn("restaurant", d)

    def test_unique_together_restaurant_nom_salle(self):
        """Unicité (restaurant, nom_salle)."""
        Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Unique",
            capacite=30,
        )
        with self.assertRaises(Exception):
            Salle.objects.create(
                restaurant=self.restaurant,
                nom_salle="Unique",
                capacite=25,
            )

    def test_same_nom_different_restaurant_ok(self):
        """Même nom de salle dans un autre restaurant accepté."""
        Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Salle A",
            capacite=10,
        )
        autre_restaurant = _make_restaurant(
            numero_siret="99998888777766",
            nom_restaurant="Autre Restaurant",
        )
        salle2 = Salle.objects.create(
            restaurant=autre_restaurant,
            nom_salle="Salle A",
            capacite=15,
        )
        self.assertEqual(salle2.nom_salle, "Salle A")


class TableModelTests(TestCase):
    """Tests du modèle Table."""

    def setUp(self):
        self.restaurant = _make_restaurant()
        self.salle = Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Salle Tables",
            capacite=40,
        )
        self.user = User.objects.create_user(
            username="tableuser", email="table@test.com", password="testpass123"
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type="Serveur", description="Serveur"
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom="Dupont",
            prenom="Jean",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=self.employe)

    def test_create_table(self):
        """Création d'une table."""
        table = Table.objects.create(
            salle=self.salle,
            numero=1,
            capacity=4,
            employee_in_charge=self.employe,
        )
        self.assertEqual(table.numero, 1)
        self.assertEqual(table.capacity, 4)
        self.assertFalse(table.is_occupied)

    def test_str(self):
        """Représentation string."""
        table = Table.objects.create(
            salle=self.salle,
            numero=5,
            capacity=2,
            employee_in_charge=self.employe,
        )
        s = str(table)
        self.assertIn("5", s)
        self.assertIn(self.salle.nom_salle, s)
        self.assertIn(self.restaurant.nom_restaurant, s)

    def test_unique_together_salle_numero(self):
        """Unicité (salle, numero)."""
        Table.objects.create(
            salle=self.salle,
            numero=1,
            capacity=4,
            employee_in_charge=self.employe,
        )
        with self.assertRaises(Exception):
            Table.objects.create(
                salle=self.salle,
                numero=1,
                capacity=2,
                employee_in_charge=self.employe,
            )


# --- Serializers ---


class SalleSerializerTests(TestCase):
    """Tests des validations du SalleSerializer."""

    def setUp(self):
        self.restaurant = _make_restaurant()

    def test_validate_duplicate_nom_salle_same_restaurant(self):
        """Nom de salle déjà existant dans le même restaurant → refusé."""
        Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Dupliquee",
            capacite=20,
        )
        data = {
            "name": "Dupliquee",
            "restaurant_id": self.restaurant.id_restaurant,
            "capacity": 15,
            "floor": 0,
        }
        serializer = SalleSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_validate_update_same_name_ok(self):
        """Mise à jour sans changer le nom → accepté."""
        salle = Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Existante",
            capacite=25,
        )
        data = {
            "name": "Existante",
            "restaurant_id": self.restaurant.id_restaurant,
            "capacity": 30,
            "floor": 0,
        }
        serializer = SalleSerializer(instance=salle, data=data, partial=True)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)


class TableSerializerTests(TestCase):
    """Tests des validations du TableSerializer."""

    def setUp(self):
        self.restaurant = _make_restaurant()
        self.salle = Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Salle Table Serial",
            capacite=30,
        )
        self.user = User.objects.create_user(
            username="serialtable", email="st@test.com", password="testpass123"
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type="Serveur", description=""
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom="Martin",
            prenom="Paul",
            type_employe=self.type_employe,
            pin_code="0000",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=self.employe)

    def test_validate_employee_not_in_restaurant_rejected(self):
        """Employé non associé au restaurant de la salle → refusé."""
        autre_restaurant = _make_restaurant(
            numero_siret="11112222333344",
            nom_restaurant="Autre Resto",
        )
        autre_user = User.objects.create_user(
            username="autre", email="autre@test.com", password="testpass123"
        )
        autre_employe = Employe.objects.create(
            user=autre_user,
            nom="Autre",
            prenom="Employe",
            type_employe=self.type_employe,
            pin_code="9999",
        )
        RestaurantEmploye.objects.create(
            restaurant=autre_restaurant, employe=autre_employe
        )
        data = {
            "numero": 1,
            "capacity": 4,
            "reserved_seats": 0,
            "salle_id": self.salle.id,
            "employee_in_charge_id": autre_employe.id,
        }
        serializer = TableSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_validate_capacity_zero_rejected(self):
        """Capacité nulle ou négative → refusé."""
        data = {
            "numero": 1,
            "capacity": 0,
            "reserved_seats": 0,
            "salle_id": self.salle.id,
            "employee_in_charge_id": self.employe.id,
        }
        serializer = TableSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_validate_reserved_seats_exceeds_capacity_rejected(self):
        """reserved_seats > capacity → refusé."""
        data = {
            "numero": 1,
            "capacity": 4,
            "reserved_seats": 5,
            "salle_id": self.salle.id,
            "employee_in_charge_id": self.employe.id,
        }
        serializer = TableSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_validate_duplicate_numero_same_salle_rejected(self):
        """Même numéro de table dans la même salle → refusé."""
        Table.objects.create(
            salle=self.salle,
            numero=3,
            capacity=4,
            employee_in_charge=self.employe,
        )
        data = {
            "numero": 3,
            "capacity": 2,
            "reserved_seats": 0,
            "salle_id": self.salle.id,
            "employee_in_charge_id": self.employe.id,
        }
        serializer = TableSerializer(data=data)
        self.assertFalse(serializer.is_valid())


# --- API Salles ---


class SalleAPITests(APITestCase):
    """Tests de l'API salles."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="salleapi",
            email="salle@test.com",
            password="testpass123",
        )
        self.restaurant = _make_restaurant()
        self.salle = Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Salle API",
            capacite=50,
            etage=0,
        )

    def test_list_requires_auth(self):
        """Liste des salles requiert une authentification."""
        response = self.client.get("/api/salles/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/salles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertIsInstance(results, list)

    def test_filter_by_restaurant_id(self):
        """Filtre par restaurant_id."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/salles/?restaurant_id={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Salle API")

    def test_filter_by_id_valid(self):
        """Filtre par id (entier valide)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/salles/?id={self.salle.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.salle.id)

    def test_filter_by_id_invalid_returns_empty(self):
        """Filtre par id invalide (non numérique) → liste vide."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/salles/?id=abc")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_retrieve_salle(self):
        """Détail d'une salle."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/salles/{self.salle.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Salle API")
        self.assertEqual(response.data["capacity"], 50)

    def test_create_salle_success(self):
        """Création d'une salle."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "name": "Nouvelle Salle",
            "restaurant_id": self.restaurant.id_restaurant,
            "capacity": 25,
            "floor": 1,
        }
        response = self.client.post("/api/salles/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Nouvelle Salle")
        self.assertEqual(response.data["capacity"], 25)

    def test_create_salle_400_duplicate_nom(self):
        """Création refusée si nom_salle déjà existant pour ce restaurant."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "name": "Salle API",
            "restaurant_id": self.restaurant.id_restaurant,
            "capacity": 30,
            "floor": 0,
        }
        response = self.client.post("/api/salles/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_salle(self):
        """Mise à jour partielle d'une salle."""
        self.client.force_authenticate(user=self.user)
        payload = {"capacity": 60, "description": "Grande salle"}
        response = self.client.patch(
            f"/api/salles/{self.salle.id}/", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.salle.refresh_from_db()
        self.assertEqual(self.salle.capacite, 60)
        self.assertEqual(self.salle.description, "Grande salle")

    def test_delete_salle(self):
        """Suppression d'une salle."""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/salles/{self.salle.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Salle.objects.filter(id=self.salle.id).exists())


# --- API Tables ---


class TableAPITests(APITestCase):
    """Tests de l'API tables."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="tableapi",
            email="tableapi@test.com",
            password="testpass123",
        )
        self.restaurant = _make_restaurant()
        self.salle = Salle.objects.create(
            restaurant=self.restaurant,
            nom_salle="Salle Tables API",
            capacite=40,
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type="Serveur", description=""
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom="API",
            prenom="Table",
            type_employe=self.type_employe,
            pin_code="5555",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=self.employe)
        self.table = Table.objects.create(
            salle=self.salle,
            numero=1,
            capacity=4,
            employee_in_charge=self.employe,
        )

    def test_list_requires_auth(self):
        """Liste des tables requiert une authentification."""
        response = self.client.get("/api/tables/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/tables/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_salle_id(self):
        """Filtre par salle_id."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/tables/?salle_id={self.salle.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertTrue(all(t["salle"]["id"] == self.salle.id for t in results))

    def test_filter_by_restaurant_id(self):
        """Filtre par restaurant_id."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/tables/?restaurant_id={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_id_invalid_returns_empty(self):
        """Filtre par id invalide → liste vide."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/tables/?id=xyz")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_retrieve_table(self):
        """Détail d'une table."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/tables/{self.table.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["numero"], 1)
        self.assertEqual(response.data["capacity"], 4)

    def test_create_table_success(self):
        """Création d'une table."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "numero": 2,
            "capacity": 6,
            "reserved_seats": 0,
            "salle_id": self.salle.id,
            "employee_in_charge_id": self.employe.id,
        }
        response = self.client.post("/api/tables/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["numero"], 2)
        self.assertEqual(response.data["capacity"], 6)

    def test_create_table_400_duplicate_numero(self):
        """Création refusée si même numéro dans la même salle."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "numero": 1,
            "capacity": 2,
            "reserved_seats": 0,
            "salle_id": self.salle.id,
            "employee_in_charge_id": self.employe.id,
        }
        response = self.client.post("/api/tables/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_table_400_capacity_zero(self):
        """Création refusée si capacity <= 0."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "numero": 3,
            "capacity": 0,
            "reserved_seats": 0,
            "salle_id": self.salle.id,
            "employee_in_charge_id": self.employe.id,
        }
        response = self.client.post("/api/tables/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_table(self):
        """Mise à jour partielle d'une table."""
        self.client.force_authenticate(user=self.user)
        payload = {"capacity": 8, "is_occupied": True}
        response = self.client.patch(
            f"/api/tables/{self.table.id}/", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.table.refresh_from_db()
        self.assertEqual(self.table.capacity, 8)
        self.assertTrue(self.table.is_occupied)

    def test_delete_table(self):
        """Suppression d'une table."""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/tables/{self.table.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Table.objects.filter(id=self.table.id).exists())

    def test_status_date_required(self):
        """Action status : date absente → 400."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/tables/status/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_status_invalid_date_400(self):
        """Action status : format de date invalide → 400."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/tables/status/?date=not-a-date")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_valid_date_200(self):
        """Action status : date valide → 200 avec liste de tables."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/tables/status/?date=2025-06-01")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("date", response.data)
        self.assertIn("tables", response.data)
        self.assertIsInstance(response.data["tables"], list)
        if response.data["tables"]:
            t = response.data["tables"][0]
            self.assertIn("table_id", t)
            self.assertIn("numero", t)
            self.assertIn("salle", t)
            self.assertIn("reservations_count", t)
            self.assertIn("commandes_count", t)

    def test_status_with_service_and_restaurant(self):
        """Action status avec service et restaurant_id."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            "/api/tables/status/?date=2025-06-01&service=midi"
            f"&restaurant_id={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["service"], "midi")
        self.assertIn("restaurant_id", response.data)
