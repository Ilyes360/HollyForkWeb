"""
Tests pour l'application reservations.

Couverture : modèle, validation serializer (edge cases), API (filtres, CRUD, erreurs).
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from apps.restaurant.models import Restaurant
from apps.salles.models import Salle, Table
from apps.staff.models import Employe, RestaurantEmploye, TypeEmploye
from apps.reservations.models import Reservation
from apps.reservations.serializers import ReservationSerializer

User = get_user_model()


def _make_restaurant():
    return Restaurant.objects.create(
        nom_restaurant="Le Réservé",
        adresse_restaurant="1 Place de la Résa",
        code_postal="75010",
        ville="Paris",
        numero_telephone="0199887766",
        numero_siret="99988877766655",
    )


def _make_salle(restaurant, nom="Salle Principale", capacite=50):
    return Salle.objects.create(
        restaurant=restaurant,
        nom_salle=nom,
        capacite=capacite,
    )


def _make_table(salle, employe, numero=1, capacity=4):
    return Table.objects.create(
        salle=salle,
        numero=numero,
        capacity=capacity,
        employee_in_charge=employe,
    )


# --- Modèle ---


class ReservationModelTests(TestCase):
    """Tests du modèle Reservation."""

    @classmethod
    def setUpTestData(cls):
        cls.restaurant = _make_restaurant()
        cls.salle_principale = _make_salle(cls.restaurant, "Salle Principale", 50)
        cls.salle_terrasse = _make_salle(cls.restaurant, "Terrasse", 20)

    def test_creer_reservation(self):
        """Création basique d'une réservation."""
        date_heure_resa = timezone.now() + timedelta(days=7, hours=2)
        reservation = Reservation.objects.create(
            nom_client="Martin Dupont",
            nombre_personnes=4,
            date_heure=date_heure_resa,
            telephone="0601020304",
            salle=self.salle_principale,
        )
        self.assertEqual(reservation.nom_client, "Martin Dupont")
        self.assertEqual(reservation.nombre_personnes, 4)
        self.assertEqual(reservation.salle, self.salle_principale)

    def test_str_repr(self):
        """Représentation string de la réservation."""
        date_heure_resa = timezone.now() + timedelta(days=1)
        reservation = Reservation.objects.create(
            nom_client="Jean Dupont",
            nombre_personnes=2,
            date_heure=date_heure_resa,
            telephone="0612345678",
            salle=self.salle_principale,
        )
        s = str(reservation)
        self.assertIn("Jean Dupont", s)
        self.assertIn(self.restaurant.nom_restaurant, s)

    def test_creer_reservation_avec_table(self):
        """Création d'une réservation avec une table (nécessite Employe + Table)."""
        from apps.staff.models import TypeEmploye, Employe, RestaurantEmploye
        type_emp = TypeEmploye.objects.create(nom_type="Serveur", description="")
        user = User.objects.create_user(username="serveur_resa", password="test")
        employe = Employe.objects.create(
            user=user, nom="Serveur", prenom="Test",
            type_employe=type_emp, pin_code="1111",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=employe)
        table = Table.objects.create(
            salle=self.salle_principale, numero=10, capacity=4,
            employee_in_charge=employe,
        )
        date_heure_resa = timezone.now() + timedelta(days=2)
        reservation = Reservation.objects.create(
            nom_client="Avec Table",
            nombre_personnes=2,
            date_heure=date_heure_resa,
            telephone="0611223344",
            salle=self.salle_principale,
            table=table,
        )
        self.assertEqual(reservation.table_id, table.id)
        s = str(reservation)
        self.assertIn("Table 10", s)

    def test_nombre_personnes_minimum(self):
        """Réservation pour 1 personne (borne minimale PositiveInteger)."""
        date_heure_resa = timezone.now() + timedelta(days=1)
        r = Reservation.objects.create(
            nom_client="Solo",
            nombre_personnes=1,
            date_heure=date_heure_resa,
            telephone="0699999999",
            salle=self.salle_terrasse,
        )
        self.assertEqual(r.nombre_personnes, 1)

    def test_reservation_date_passee(self):
        """Le modèle accepte une date dans le passé (validation métier à faire en serializer si besoin)."""
        date_heure_passee = timezone.now() - timedelta(days=1)
        reservation_passee = Reservation.objects.create(
            nom_client="Client Passé",
            nombre_personnes=2,
            date_heure=date_heure_passee,
            telephone="0611223344",
            salle=self.salle_terrasse,
        )
        self.assertLess(reservation_passee.date_heure, timezone.now())

    def test_ordering_by_date_heure(self):
        """L'ordering Meta est respecté (date_heure croissant)."""
        base = timezone.now() + timedelta(days=1)
        Reservation.objects.create(
            nom_client="A", nombre_personnes=1, date_heure=base + timedelta(hours=2),
            telephone="0600000001", salle=self.salle_principale,
        )
        Reservation.objects.create(
            nom_client="B", nombre_personnes=1, date_heure=base,
            telephone="0600000002", salle=self.salle_principale,
        )
        qs = Reservation.objects.all()
        self.assertEqual(qs[0].nom_client, "B")
        self.assertEqual(qs[1].nom_client, "A")


# --- Serializer (edge cases de validation) ---


class ReservationSerializerValidationTests(TestCase):
    """Tests des validations du serializer (cas limites)."""

    @classmethod
    def setUpTestData(cls):
        cls.restaurant = _make_restaurant()
        cls.salle = _make_salle(cls.restaurant, "Salle Test", 10)
        cls.date_heure = timezone.now() + timedelta(days=3, hours=12)

    def test_validate_nombre_personnes_zero_rejected(self):
        """nombre_personnes <= 0 doit être refusé."""
        data = {
            "client_name": "Test",
            "party_size": 0,
            "datetime": self.date_heure,
            "phone_number": "0612345678",
            "salle_id": self.salle.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_validate_nombre_personnes_negative_rejected(self):
        """nombre_personnes négatif refusé (si passé au serializer)."""
        data = {
            "client_name": "Test",
            "party_size": -1,
            "datetime": self.date_heure,
            "phone_number": "0612345678",
            "salle_id": self.salle.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_validate_nombre_personnes_exceeds_capacite(self):
        """nombre_personnes > capacité de la salle → ValidationError."""
        data = {
            "client_name": "Trop",
            "party_size": 11,
            "datetime": self.date_heure,
            "phone_number": "0612345678",
            "salle_id": self.salle.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_validate_overlap_same_slot_exceeds_capacite(self):
        """Même créneau (jour + heure) : total personnes > capacité → refusé."""
        Reservation.objects.create(
            nom_client="Premier",
            nombre_personnes=8,
            date_heure=self.date_heure,
            telephone="0600000001",
            salle=self.salle,
        )
        data = {
            "client_name": "Second",
            "party_size": 5,
            "datetime": self.date_heure,
            "phone_number": "0600000002",
            "salle_id": self.salle.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_validate_overlap_capacite_exact_ok(self):
        """Même créneau : total exactement égal à la capacité → accepté."""
        Reservation.objects.create(
            nom_client="Premier",
            nombre_personnes=6,
            date_heure=self.date_heure,
            telephone="0600000001",
            salle=self.salle,
        )
        data = {
            "client_name": "Second",
            "party_size": 4,
            "datetime": self.date_heure,
            "phone_number": "0600000002",
            "salle_id": self.salle.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_validate_overlap_update_excludes_self(self):
        """À la mise à jour, la réservation en cours est exclue du total (pas de double comptage)."""
        reservation = Reservation.objects.create(
            nom_client="Existante",
            nombre_personnes=8,
            date_heure=self.date_heure,
            telephone="0600000001",
            salle=self.salle,
        )
        data = {
            "client_name": "Existante",
            "party_size": 3,
            "datetime": self.date_heure,
            "phone_number": "0600000001",
            "salle_id": self.salle.id,
        }
        serializer = ReservationSerializer(instance=reservation, data=data, partial=True)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_validate_different_hour_ok(self):
        """Même jour, heure différente : pas de conflit de capacité."""
        Reservation.objects.create(
            nom_client="Midi",
            nombre_personnes=10,
            date_heure=self.date_heure.replace(hour=12, minute=0),
            telephone="0600000001",
            salle=self.salle,
        )
        data = {
            "client_name": "Soir",
            "party_size": 10,
            "datetime": self.date_heure.replace(hour=20, minute=0),
            "phone_number": "0600000002",
            "salle_id": self.salle.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_validate_different_salle_ok(self):
        """Même créneau, autre salle : pas de conflit."""
        autre_salle = _make_salle(self.restaurant, "Autre Salle", 5)
        Reservation.objects.create(
            nom_client="Salle A",
            nombre_personnes=10,
            date_heure=self.date_heure,
            telephone="0600000001",
            salle=self.salle,
        )
        data = {
            "client_name": "Salle B",
            "party_size": 5,
            "datetime": self.date_heure,
            "phone_number": "0600000002",
            "salle_id": autre_salle.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_validate_table_id_exceeds_table_capacity(self):
        """Si table_id fourni : party_size > table.capacity → refusé."""
        type_emp = TypeEmploye.objects.create(nom_type="Serveur", description="")
        employe = Employe.objects.create(
            nom="S", prenom="T", type_employe=type_emp, pin_code="1234",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=employe)
        table = _make_table(self.salle, employe, numero=1, capacity=2)
        data = {
            "client_name": "Trop",
            "party_size": 4,
            "datetime": self.date_heure,
            "phone_number": "0612345678",
            "salle_id": self.salle.id,
            "table_id": table.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_validate_table_id_other_salle_rejected(self):
        """table_id d'une autre salle que salle_id → refusé."""
        autre_salle = _make_salle(self.restaurant, "Autre", 10)
        type_emp = TypeEmploye.objects.create(nom_type="Serveur", description="")
        employe = Employe.objects.create(
            nom="S", prenom="T", type_employe=type_emp, pin_code="1234",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=employe)
        table = _make_table(autre_salle, employe, numero=1, capacity=4)
        data = {
            "client_name": "Mix",
            "party_size": 2,
            "datetime": self.date_heure,
            "phone_number": "0612345678",
            "salle_id": self.salle.id,
            "table_id": table.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("table_id", serializer.errors)

    def test_validate_table_double_booking_rejected(self):
        """Même table au même créneau → refusé."""
        type_emp = TypeEmploye.objects.create(nom_type="Serveur", description="")
        employe = Employe.objects.create(
            nom="S", prenom="T", type_employe=type_emp, pin_code="1234",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=employe)
        table = _make_table(self.salle, employe, numero=1, capacity=4)
        Reservation.objects.create(
            nom_client="Premier",
            nombre_personnes=2,
            date_heure=self.date_heure,
            telephone="0600000001",
            salle=self.salle,
            table=table,
        )
        data = {
            "client_name": "Second",
            "party_size": 2,
            "datetime": self.date_heure,
            "phone_number": "0600000002",
            "salle_id": self.salle.id,
            "table_id": table.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("table_id", serializer.errors)

    def test_validate_table_id_ok(self):
        """Réservation avec table_id dans la même salle, capacité ok → accepté."""
        type_emp = TypeEmploye.objects.create(nom_type="Serveur", description="")
        employe = Employe.objects.create(
            nom="S", prenom="T", type_employe=type_emp, pin_code="1234",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=employe)
        table = _make_table(self.salle, employe, numero=1, capacity=4)
        data = {
            "client_name": "Avec Table",
            "party_size": 2,
            "datetime": self.date_heure,
            "phone_number": "0612345678",
            "salle_id": self.salle.id,
            "table_id": table.id,
        }
        serializer = ReservationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)
        obj = serializer.save()
        self.assertEqual(obj.table_id, table.id)


# --- API ---


class ReservationAPITests(APITestCase):
    """Tests de l'API réservations (filtres, CRUD, edge cases)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="resauser",
            email="resa@test.com",
            password="testpass123",
        )
        self.restaurant = _make_restaurant()
        self.salle = _make_salle(self.restaurant, "Salle API", 10)
        self.type_employe = TypeEmploye.objects.create(nom_type="Serveur", description="")
        self.employe = Employe.objects.create(
            user=self.user,
            nom="API",
            prenom="Serveur",
            type_employe=self.type_employe,
            pin_code="1234",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=self.employe)
        self.table = _make_table(self.salle, self.employe, numero=1, capacity=6)
        self.date_heure = timezone.now() + timedelta(days=5, hours=19)
        self.reservation = Reservation.objects.create(
            nom_client="API Client",
            nombre_personnes=4,
            date_heure=self.date_heure,
            telephone="0698765432",
            salle=self.salle,
        )

    def test_list_requires_auth(self):
        """Liste des réservations requiert une authentification."""
        response = self.client.get("/api/reservations/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/reservations/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertIsInstance(results, list)

    def test_filter_by_restaurant_id(self):
        """Filtre par restaurant_id."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/reservations/?restaurant_id={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["client_name"], "API Client")

    def test_filter_by_salle_id(self):
        """Filtre par salle_id."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/reservations/?salle_id={self.salle.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertTrue(all(r["salle"]["id"] == self.salle.id for r in results))

    def test_filter_by_date_valid(self):
        """Filtre par date (format YYYY-MM-DD)."""
        self.client.force_authenticate(user=self.user)
        date_str = self.date_heure.strftime("%Y-%m-%d")
        response = self.client.get(f"/api/reservations/?date={date_str}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)

    def test_filter_by_date_invalid(self):
        """Filtre par date invalide : pas d'erreur, filtre ignoré (comportement actuel)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/reservations/?date=not-a-date")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_service_midi(self):
        """Filtre service=midi (heure < 15h)."""
        Reservation.objects.create(
            nom_client="Midi",
            nombre_personnes=2,
            date_heure=timezone.now() + timedelta(days=1, hours=12),
            telephone="0600000001",
            salle=self.salle,
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/reservations/?service=midi")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        for r in results:
            hour = int(r["datetime"].split("T")[1][:2])
            self.assertLess(hour, 15, msg="service=midi doit retourner heure < 15")

    def test_filter_by_service_soir(self):
        """Filtre service=soir (heure >= 15h)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/reservations/?service=soir")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        for r in results:
            hour = int(r["datetime"].split("T")[1][:2])
            self.assertGreaterEqual(hour, 15, msg="service=soir doit retourner heure >= 15")

    def test_filter_by_id_valid(self):
        """Filtre par id (entier valide)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/reservations/?id={self.reservation.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.reservation.id)

    def test_filter_by_id_invalid_returns_empty(self):
        """Filtre par id invalide (non numérique) → liste vide."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/reservations/?id=abc")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 0)

    def test_retrieve_reservation(self):
        """Détail d'une réservation."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/reservations/{self.reservation.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["client_name"], "API Client")
        self.assertEqual(response.data["party_size"], 4)
        self.assertIn("table", response.data)
        self.assertIn("table_id", response.data)

    def test_filter_by_table_id(self):
        """Filtre par table_id."""
        Reservation.objects.filter(id=self.reservation.id).update(table=self.table)
        self.reservation.refresh_from_db()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/reservations/?table_id={self.table.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)
        self.assertTrue(any(r.get("table_id") == self.table.id for r in results))

    def test_create_reservation_with_table_id(self):
        """Création d'une réservation avec table_id."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "client_name": "Client Table",
            "party_size": 2,
            "datetime": (timezone.now() + timedelta(days=10, hours=20)).isoformat(),
            "phone_number": "0687654321",
            "salle_id": self.salle.id,
            "table_id": self.table.id,
        }
        response = self.client.post("/api/reservations/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["table_id"], self.table.id)
        self.assertIsNotNone(response.data.get("table"))

    def test_create_reservation_success(self):
        """Création d'une réservation valide."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "client_name": "Nouveau Client",
            "party_size": 2,
            "datetime": (timezone.now() + timedelta(days=10, hours=20)).isoformat(),
            "phone_number": "0687654321",
            "salle_id": self.salle.id,
        }
        response = self.client.post("/api/reservations/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["client_name"], "Nouveau Client")
        self.assertEqual(response.data["party_size"], 2)

    def test_create_reservation_400_nombre_personnes_zero(self):
        """Création refusée si nombre_personnes = 0."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "client_name": "Zero",
            "party_size": 0,
            "datetime": (timezone.now() + timedelta(days=10)).isoformat(),
            "phone_number": "0600000000",
            "salle_id": self.salle.id,
        }
        response = self.client.post("/api/reservations/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reservation_400_exceeds_capacite(self):
        """Création refusée si nombre_personnes > capacité de la salle."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "client_name": "Trop",
            "party_size": 15,
            "datetime": (timezone.now() + timedelta(days=10)).isoformat(),
            "phone_number": "0600000000",
            "salle_id": self.salle.id,
        }
        response = self.client.post("/api/reservations/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reservation_400_overlap_exceeds_capacite(self):
        """Création refusée si le créneau (même jour/heure) dépasse la capacité."""
        Reservation.objects.create(
            nom_client="Déjà là",
            nombre_personnes=8,
            date_heure=self.date_heure,
            telephone="0600000001",
            salle=self.salle,
        )
        self.client.force_authenticate(user=self.user)
        payload = {
            "client_name": "En plus",
            "party_size": 5,
            "datetime": self.date_heure.isoformat(),
            "phone_number": "0600000002",
            "salle_id": self.salle.id,
        }
        response = self.client.post("/api/reservations/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reservation_201_exact_capacite(self):
        """Création acceptée quand total = capacité exacte sur le créneau."""
        slot_plus_un = self.date_heure + timedelta(hours=1)
        Reservation.objects.create(
            nom_client="Premier",
            nombre_personnes=6,
            date_heure=slot_plus_un,
            telephone="0600000001",
            salle=self.salle,
        )
        self.client.force_authenticate(user=self.user)
        payload = {
            "client_name": "Deuxième",
            "party_size": 4,
            "datetime": slot_plus_un.isoformat(),
            "phone_number": "0600000002",
            "salle_id": self.salle.id,
        }
        response = self.client.post("/api/reservations/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_reservation(self):
        """Mise à jour partielle d'une réservation."""
        self.client.force_authenticate(user=self.user)
        payload = {"client_name": "Client Modifié", "party_size": 3}
        response = self.client.patch(
            f"/api/reservations/{self.reservation.id}/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.nom_client, "Client Modifié")
        self.assertEqual(self.reservation.nombre_personnes, 3)

    def test_delete_reservation(self):
        """Suppression d'une réservation."""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/reservations/{self.reservation.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Reservation.objects.filter(id=self.reservation.id).exists())

    def test_retrieve_404(self):
        """Détail d'une réservation inexistante → 404."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/reservations/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
