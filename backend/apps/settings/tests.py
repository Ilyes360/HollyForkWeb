"""
Tests pour l'application settings.

L'app settings centralise les paramètres par restaurant :
- NotificationSettings : alertes email/SMS, stock, réservations, commandes
- BillingSettings : TVA par défaut, devise, facturation automatique
- RestaurantSettingsView : lecture / mise à jour des infos restaurant
- UsersSettingsView : liste / création / mise à jour d'utilisateurs (profil)
"""

from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from apps.restaurant.models import Restaurant
from apps.settings.models import NotificationSettings, BillingSettings

User = get_user_model()


def _make_restaurant(numero_siret="12345678901234"):
    return Restaurant.objects.create(
        nom_restaurant="Restaurant Settings Test",
        adresse_restaurant="1 Rue Test",
        code_postal="75001",
        ville="Paris",
        numero_telephone="0123456789",
        numero_siret=numero_siret,
    )


# --- Modèles ---


class NotificationSettingsModelTests(TestCase):
    """Tests du modèle NotificationSettings."""

    def setUp(self):
        self.restaurant = _make_restaurant()

    def test_create_defaults(self):
        """Création avec valeurs par défaut."""
        ns = NotificationSettings.objects.create(restaurant=self.restaurant)
        self.assertTrue(ns.email_notifications)
        self.assertFalse(ns.sms_notifications)
        self.assertTrue(ns.stock_alerts)
        self.assertTrue(ns.reservation_alerts)
        self.assertTrue(ns.command_alerts)

    def test_create_custom(self):
        """Création avec valeurs personnalisées."""
        ns = NotificationSettings.objects.create(
            restaurant=self.restaurant,
            email_notifications=False,
            sms_notifications=True,
            stock_alerts=False,
        )
        self.assertFalse(ns.email_notifications)
        self.assertTrue(ns.sms_notifications)
        self.assertFalse(ns.stock_alerts)

    def test_str(self):
        """Représentation string."""
        ns = NotificationSettings.objects.create(restaurant=self.restaurant)
        self.assertIn("Notifications", str(ns))
        self.assertIn(self.restaurant.nom_restaurant, str(ns))

    def test_one_to_one_per_restaurant(self):
        """Un seul NotificationSettings par restaurant (OneToOne)."""
        NotificationSettings.objects.create(restaurant=self.restaurant)
        with self.assertRaises(Exception):
            NotificationSettings.objects.create(restaurant=self.restaurant)


class BillingSettingsModelTests(TestCase):
    """Tests du modèle BillingSettings."""

    def setUp(self):
        self.restaurant = _make_restaurant()

    def test_create_defaults(self):
        """Création avec valeurs par défaut."""
        bs = BillingSettings.objects.create(restaurant=self.restaurant)
        self.assertEqual(bs.tva_par_defaut, Decimal("20.00"))
        self.assertEqual(bs.devise, "EUR")
        self.assertTrue(bs.facture_auto)

    def test_create_custom(self):
        """Création avec valeurs personnalisées."""
        bs = BillingSettings.objects.create(
            restaurant=self.restaurant,
            tva_par_defaut=Decimal("10.00"),
            devise="USD",
            facture_auto=False,
        )
        self.assertEqual(bs.tva_par_defaut, Decimal("10.00"))
        self.assertEqual(bs.devise, "USD")
        self.assertFalse(bs.facture_auto)

    def test_str(self):
        """Représentation string."""
        bs = BillingSettings.objects.create(restaurant=self.restaurant)
        self.assertIn("Facturation", str(bs))
        self.assertIn(self.restaurant.nom_restaurant, str(bs))

    def test_one_to_one_per_restaurant(self):
        """Un seul BillingSettings par restaurant (OneToOne)."""
        BillingSettings.objects.create(restaurant=self.restaurant)
        with self.assertRaises(Exception):
            BillingSettings.objects.create(restaurant=self.restaurant)


# --- API ---


class NotificationSettingsAPITests(APITestCase):
    """Tests de l'API paramètres de notifications."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="setuser",
            email="set@test.com",
            password="testpass123",
        )
        self.restaurant = _make_restaurant()
        self.notif_settings = NotificationSettings.objects.create(
            restaurant=self.restaurant,
            email_notifications=True,
            stock_alerts=False,
        )

    def test_list_requires_auth(self):
        """Liste requiert une authentification."""
        response = self.client.get("/api/settings/notifications/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/settings/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertIsInstance(results, list)

    def test_filter_by_restaurant_id(self):
        """Filtre par restaurant_id."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/settings/notifications/?restaurant_id={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["email_notifications"], True)
        self.assertEqual(results[0]["stock_alerts"], False)

    def test_retrieve(self):
        """Détail d'un paramètre de notifications."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/settings/notifications/{self.notif_settings.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.notif_settings.id)

    def test_create_notification_settings(self):
        """Création de paramètres de notifications pour un restaurant."""
        autre_restaurant = _make_restaurant(numero_siret="99998888777766")
        self.client.force_authenticate(user=self.user)
        payload = {
            "restaurant_id": autre_restaurant.id_restaurant,
            "email_notifications": False,
            "sms_notifications": True,
            "stock_alerts": True,
            "reservation_alerts": False,
            "command_alerts": True,
        }
        response = self.client.post(
            "/api/settings/notifications/", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["sms_notifications"], True)
        self.assertEqual(response.data["reservation_alerts"], False)

    def test_update_notification_settings(self):
        """Mise à jour partielle des paramètres de notifications."""
        self.client.force_authenticate(user=self.user)
        payload = {"stock_alerts": True, "command_alerts": False}
        response = self.client.patch(
            f"/api/settings/notifications/{self.notif_settings.id}/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif_settings.refresh_from_db()
        self.assertTrue(self.notif_settings.stock_alerts)
        self.assertFalse(self.notif_settings.command_alerts)


class BillingSettingsAPITests(APITestCase):
    """Tests de l'API paramètres de facturation."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="billset",
            email="billset@test.com",
            password="testpass123",
        )
        self.restaurant = _make_restaurant()
        self.billing_settings = BillingSettings.objects.create(
            restaurant=self.restaurant,
            tva_par_defaut=Decimal("20.00"),
            devise="EUR",
            facture_auto=True,
        )

    def test_list_requires_auth(self):
        """Liste requiert une authentification."""
        response = self.client.get("/api/settings/billing/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/settings/billing/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_restaurant_id(self):
        """Filtre par restaurant_id."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/settings/billing/?restaurant_id={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(Decimal(results[0]["default_vat_rate"]), Decimal("20.00"))
        self.assertEqual(results[0]["currency"], "EUR")

    def test_retrieve(self):
        """Détail des paramètres de facturation."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/settings/billing/{self.billing_settings.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["auto_invoice"], True)

    def test_create_billing_settings(self):
        """Création de paramètres de facturation."""
        autre_restaurant = _make_restaurant(numero_siret="11112222333344")
        self.client.force_authenticate(user=self.user)
        payload = {
            "restaurant_id": autre_restaurant.id_restaurant,
            "default_vat_rate": "10.00",
            "currency": "USD",
            "auto_invoice": False,
        }
        response = self.client.post(
            "/api/settings/billing/", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["currency"], "USD")
        self.assertEqual(response.data["auto_invoice"], False)

    def test_update_billing_settings(self):
        """Mise à jour partielle des paramètres de facturation."""
        self.client.force_authenticate(user=self.user)
        payload = {"default_vat_rate": "5.50", "auto_invoice": False}
        response = self.client.patch(
            f"/api/settings/billing/{self.billing_settings.id}/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.billing_settings.refresh_from_db()
        self.assertEqual(self.billing_settings.tva_par_defaut, Decimal("5.50"))
        self.assertFalse(self.billing_settings.facture_auto)


class RestaurantSettingsViewTests(APITestCase):
    """Tests de la vue paramètres restaurant (GET/PATCH par restaurant_id)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="restoset",
            email="restoset@test.com",
            password="testpass123",
        )
        self.restaurant = _make_restaurant()

    def test_get_restaurant_requires_auth(self):
        """GET /api/settings/restaurant/ requiert une authentification."""
        response = self.client.get(
            f"/api/settings/restaurant/?restaurant_id={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_restaurant_without_restaurant_id_400(self):
        """GET sans restaurant_id renvoie 400."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/settings/restaurant/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_get_restaurant_not_found_404(self):
        """GET avec restaurant_id inexistant renvoie 404."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            "/api/settings/restaurant/?restaurant_id=99999"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_restaurant_ok(self):
        """GET avec restaurant_id valide renvoie les infos restaurant."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/settings/restaurant/?restaurant_id={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["name"],
            self.restaurant.nom_restaurant,
        )

    def test_patch_restaurant_without_restaurant_id_400(self):
        """PATCH sans restaurant_id renvoie 400."""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            "/api/settings/restaurant/",
            {"nom_restaurant": "Nouveau nom"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UsersSettingsViewTests(APITestCase):
    """Tests de la vue paramètres utilisateurs (liste / création / mise à jour)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="userset",
            email="userset@test.com",
            password="testpass123",
        )

    def test_get_users_requires_auth(self):
        """GET /api/settings/users/ requiert une authentification."""
        response = self.client.get("/api/settings/users/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_users_authenticated_200(self):
        """GET /api/settings/users/ renvoie la liste des utilisateurs."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/settings/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
