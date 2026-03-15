"""
Tests pour l'application suppliers.

Couverture : Fournisseur, JourLivraison, CommandeFournisseur (modèles, serializers, API).
Filtres, action delivery-days, unicité numero_commande et (fournisseur, jour).
"""

from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, time

from apps.suppliers.models import Fournisseur, JourLivraison, CommandeFournisseur
from apps.restaurant.models import Restaurant

User = get_user_model()


def _make_restaurant(numero_siret="12345678901234"):
    return Restaurant.objects.create(
        nom_restaurant="Restaurant Suppliers Test",
        adresse_restaurant="1 Rue Test",
        code_postal="75001",
        ville="Paris",
        numero_telephone="0123456789",
        numero_siret=numero_siret,
    )


# --- Modèles ---


class FournisseurModelTests(TestCase):
    """Tests du modèle Fournisseur."""

    def test_create_minimal(self):
        """Création minimale (nom obligatoire)."""
        f = Fournisseur.objects.create(nom="Primeur Dupont")
        self.assertEqual(f.nom, "Primeur Dupont")
        self.assertTrue(f.actif)
        self.assertIsNotNone(f.created_at)
        self.assertIsNotNone(f.updated_at)

    def test_create_full(self):
        """Création avec tous les champs optionnels."""
        f = Fournisseur.objects.create(
            nom="Boucherie Martin",
            contact_nom="M. Martin",
            email="contact@martin.fr",
            telephone="0123456789",
            adresse="2 Rue Commerce",
            ville="Lyon",
            code_postal="69001",
            latitude=Decimal("45.75"),
            longitude=Decimal("4.85"),
            notes="Livraison le matin",
            actif=False,
        )
        self.assertEqual(f.ville, "Lyon")
        self.assertFalse(f.actif)
        self.assertEqual(float(f.latitude), 45.75)

    def test_str(self):
        """Représentation string."""
        f = Fournisseur.objects.create(nom="Epicerie Test")
        self.assertEqual(str(f), "Epicerie Test")

    def test_ordering(self):
        """Ordre par nom."""
        Fournisseur.objects.create(nom="Zebra")
        Fournisseur.objects.create(nom="Alpha")
        qs = list(Fournisseur.objects.all())
        self.assertEqual(qs[0].nom, "Alpha")
        self.assertEqual(qs[1].nom, "Zebra")


class JourLivraisonModelTests(TestCase):
    """Tests du modèle JourLivraison."""

    def setUp(self):
        self.fournisseur = Fournisseur.objects.create(nom="Fournisseur J")

    def test_create(self):
        """Création d'un jour de livraison."""
        j = JourLivraison.objects.create(
            fournisseur=self.fournisseur,
            jour="MONDAY",
            heure_livraison=time(8, 0),
        )
        self.assertEqual(j.jour, "MONDAY")
        self.assertEqual(j.heure_livraison, time(8, 0))

    def test_create_sans_heure(self):
        """Heure optionnelle."""
        j = JourLivraison.objects.create(
            fournisseur=self.fournisseur,
            jour="FRIDAY",
        )
        self.assertIsNone(j.heure_livraison)

    def test_str(self):
        """Représentation string."""
        j = JourLivraison.objects.create(
            fournisseur=self.fournisseur,
            jour="TUESDAY",
        )
        self.assertIn(self.fournisseur.nom, str(j))
        self.assertIn("Mardi", str(j))

    def test_unique_together_fournisseur_jour(self):
        """Unicité (fournisseur, jour)."""
        JourLivraison.objects.create(
            fournisseur=self.fournisseur,
            jour="WEDNESDAY",
        )
        with self.assertRaises(Exception):
            JourLivraison.objects.create(
                fournisseur=self.fournisseur,
                jour="WEDNESDAY",
            )

    def test_same_jour_different_fournisseur_ok(self):
        """Même jour pour un autre fournisseur accepté."""
        f2 = Fournisseur.objects.create(nom="Autre Fournisseur")
        JourLivraison.objects.create(fournisseur=self.fournisseur, jour="THURSDAY")
        j2 = JourLivraison.objects.create(fournisseur=f2, jour="THURSDAY")
        self.assertEqual(j2.fournisseur, f2)


class CommandeFournisseurModelTests(TestCase):
    """Tests du modèle CommandeFournisseur."""

    def setUp(self):
        self.fournisseur = Fournisseur.objects.create(nom="Fournisseur C")
        self.restaurant = _make_restaurant()

    def test_create(self):
        """Création d'une commande fournisseur."""
        c = CommandeFournisseur.objects.create(
            fournisseur=self.fournisseur,
            restaurant=self.restaurant,
            numero_commande="CMD-001",
            date_commande=date(2025, 2, 1),
            statut="DRAFT",
            montant_total=Decimal("150.00"),
        )
        self.assertEqual(c.numero_commande, "CMD-001")
        self.assertEqual(c.statut, "DRAFT")
        self.assertEqual(float(c.montant_total), 150.0)

    def test_create_with_date_livraison(self):
        """Date de livraison prévue optionnelle."""
        c = CommandeFournisseur.objects.create(
            fournisseur=self.fournisseur,
            restaurant=self.restaurant,
            numero_commande="CMD-002",
            date_commande=date(2025, 2, 1),
            date_livraison_prevue=date(2025, 2, 5),
            statut="SENT",
        )
        self.assertEqual(c.date_livraison_prevue, date(2025, 2, 5))

    def test_str(self):
        """Représentation string."""
        c = CommandeFournisseur.objects.create(
            fournisseur=self.fournisseur,
            restaurant=self.restaurant,
            numero_commande="CMD-STR",
            date_commande=date(2025, 2, 1),
        )
        self.assertIn("CMD-STR", str(c))
        self.assertIn(self.fournisseur.nom, str(c))

    def test_numero_commande_unique(self):
        """Unicité de numero_commande."""
        CommandeFournisseur.objects.create(
            fournisseur=self.fournisseur,
            restaurant=self.restaurant,
            numero_commande="CMD-UNIQUE",
            date_commande=date(2025, 2, 1),
        )
        with self.assertRaises(Exception):
            CommandeFournisseur.objects.create(
                fournisseur=self.fournisseur,
                restaurant=self.restaurant,
                numero_commande="CMD-UNIQUE",
                date_commande=date(2025, 2, 2),
            )


# --- Serializers ---


class FournisseurSerializerTests(TestCase):
    """Tests du FournisseurSerializer."""

    def test_serialize_with_jours_livraison(self):
        """Sérialisation avec jours_livraison imbriqués."""
        from apps.suppliers.serializers import FournisseurSerializer
        f = Fournisseur.objects.create(nom="Fournisseur S")
        JourLivraison.objects.create(fournisseur=f, jour="MONDAY", heure_livraison=time(9, 0))
        serializer = FournisseurSerializer(f)
        self.assertEqual(serializer.data["name"], "Fournisseur S")
        self.assertIn("jours_livraison", serializer.data)
        self.assertEqual(len(serializer.data["jours_livraison"]), 1)
        self.assertEqual(serializer.data["jours_livraison"][0]["jour"], "MONDAY")

    def test_create_valid(self):
        """Création via serializer valide."""
        from apps.suppliers.serializers import FournisseurSerializer
        data = {
            "name": "Nouveau Fournisseur",
            "contact_name": "Contact",
            "email": "n@test.com",
            "is_active": True,
        }
        serializer = FournisseurSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        obj = serializer.save()
        self.assertEqual(obj.nom, "Nouveau Fournisseur")


class JourLivraisonSerializerTests(TestCase):
    """Tests du JourLivraisonSerializer."""

    def setUp(self):
        self.fournisseur = Fournisseur.objects.create(nom="Fournisseur JL")

    def test_serialize(self):
        """Sérialisation."""
        from apps.suppliers.serializers import JourLivraisonSerializer
        j = JourLivraison.objects.create(
            fournisseur=self.fournisseur,
            jour="FRIDAY",
            heure_livraison=time(10, 30),
        )
        serializer = JourLivraisonSerializer(j)
        self.assertEqual(serializer.data["jour"], "FRIDAY")
        self.assertEqual(serializer.data["delivery_time"], "10:30:00")


class CommandeFournisseurSerializerTests(TestCase):
    """Tests du CommandeFournisseurSerializer."""

    def setUp(self):
        self.fournisseur = Fournisseur.objects.create(nom="Fournisseur CO")
        self.restaurant = _make_restaurant()

    def test_create_with_fournisseur_restaurant_ids(self):
        """Création avec fournisseur_id et restaurant_id."""
        from apps.suppliers.serializers import CommandeFournisseurSerializer
        data = {
            "fournisseur_id": self.fournisseur.id,
            "restaurant_id": self.restaurant.id_restaurant,
            "order_number": "CMD-SER-001",
            "order_date": "2025-02-10",
            "status": "DRAFT",
            "total_amount": "200.00",
        }
        serializer = CommandeFournisseurSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        obj = serializer.save()
        self.assertEqual(obj.fournisseur, self.fournisseur)
        self.assertEqual(obj.restaurant, self.restaurant)
        self.assertEqual(obj.numero_commande, "CMD-SER-001")


# --- API ---


class FournisseurAPITests(APITestCase):
    """Tests de l'API fournisseurs."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="supplierapi",
            email="supplier@test.com",
            password="testpass123",
        )
        self.fournisseur = Fournisseur.objects.create(
            nom="Fournisseur API",
            actif=True,
        )

    def test_list_requires_auth(self):
        """Liste requiert une authentification."""
        response = self.client.get("/api/suppliers/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/suppliers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertIsInstance(results, list)

    def test_filter_by_actif(self):
        """Filtre par actif."""
        self.client.force_authenticate(user=self.user)
        Fournisseur.objects.create(nom="Inactif", actif=False)
        response = self.client.get("/api/suppliers/?actif=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertIsInstance(results, list)
        self.assertTrue(all(r["is_active"] for r in results))

    def test_retrieve(self):
        """Détail d'un fournisseur."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/suppliers/{self.fournisseur.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Fournisseur API")
        self.assertIn("jours_livraison", response.data)

    def test_create(self):
        """Création d'un fournisseur."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "name": "Nouveau Fournisseur API",
            "email": "api@fournisseur.fr",
            "is_active": True,
        }
        response = self.client.post("/api/suppliers/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Nouveau Fournisseur API")

    def test_update(self):
        """Mise à jour partielle."""
        self.client.force_authenticate(user=self.user)
        payload = {"contact_name": "Nouveau Contact", "is_active": False}
        response = self.client.patch(
            f"/api/suppliers/{self.fournisseur.id}/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.fournisseur.refresh_from_db()
        self.assertEqual(self.fournisseur.contact_nom, "Nouveau Contact")
        self.assertFalse(self.fournisseur.actif)

    def test_delete(self):
        """Suppression d'un fournisseur."""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/suppliers/{self.fournisseur.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Fournisseur.objects.filter(pk=self.fournisseur.id).exists())

    def test_delivery_days_action(self):
        """Action GET delivery-days retourne les jours de livraison."""
        self.client.force_authenticate(user=self.user)
        JourLivraison.objects.create(
            fournisseur=self.fournisseur,
            jour="MONDAY",
            heure_livraison=time(8, 0),
        )
        response = self.client.get(
            f"/api/suppliers/{self.fournisseur.id}/delivery-days/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["jour"], "MONDAY")


class CommandeFournisseurAPITests(APITestCase):
    """Tests de l'API commandes fournisseurs."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="orderapi",
            email="order@test.com",
            password="testpass123",
        )
        self.fournisseur = Fournisseur.objects.create(nom="Fournisseur Orders")
        self.restaurant = _make_restaurant()
        self.commande = CommandeFournisseur.objects.create(
            fournisseur=self.fournisseur,
            restaurant=self.restaurant,
            numero_commande="CMD-API-001",
            date_commande=date(2025, 2, 1),
            statut="DRAFT",
            montant_total=Decimal("100.00"),
        )

    def test_list_requires_auth(self):
        """Liste requiert une authentification."""
        response = self.client.get("/api/suppliers/orders/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste avec utilisateur authentifié."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/suppliers/orders/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertIsInstance(results, list)

    def test_filter_by_restaurant(self):
        """Filtre par restaurant."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/suppliers/orders/?restaurant={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["order_number"], "CMD-API-001")

    def test_filter_by_restaurant_id_query_param(self):
        """Filtre via query param restaurant_id (entier valide)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/suppliers/orders/?restaurant_id={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)

    def test_filter_by_restaurant_id_invalid_ignored(self):
        """restaurant_id non numérique ignoré (pas d'erreur)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/suppliers/orders/?restaurant_id=abc")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_fournisseur(self):
        """Filtre par fournisseur."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/suppliers/orders/?fournisseur={self.fournisseur.id}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)

    def test_filter_by_statut(self):
        """Filtre par statut."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/suppliers/orders/?statut=DRAFT")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], "DRAFT")

    def test_retrieve(self):
        """Détail d'une commande."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/suppliers/orders/{self.commande.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_number"], "CMD-API-001")
        self.assertIn("fournisseur", response.data)
        self.assertIn("restaurant", response.data)

    def test_create(self):
        """Création d'une commande fournisseur."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "fournisseur_id": self.fournisseur.id,
            "restaurant_id": self.restaurant.id_restaurant,
            "order_number": "CMD-API-NEW",
            "order_date": "2025-02-15",
            "status": "DRAFT",
            "total_amount": "250.00",
        }
        response = self.client.post(
            "/api/suppliers/orders/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["order_number"], "CMD-API-NEW")

    def test_create_duplicate_numero_commande_400(self):
        """Création avec numero_commande déjà existant → 400."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "fournisseur_id": self.fournisseur.id,
            "restaurant_id": self.restaurant.id_restaurant,
            "order_number": "CMD-API-001",
            "order_date": "2025-02-20",
            "status": "DRAFT",
            "total_amount": "50.00",
        }
        response = self.client.post(
            "/api/suppliers/orders/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update(self):
        """Mise à jour partielle (statut, notes)."""
        self.client.force_authenticate(user=self.user)
        payload = {"status": "SENT", "notes": "Envoyée par email"}
        response = self.client.patch(
            f"/api/suppliers/orders/{self.commande.id}/",
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.commande.refresh_from_db()
        self.assertEqual(self.commande.statut, "SENT")
        self.assertEqual(self.commande.notes, "Envoyée par email")

    def test_delete(self):
        """Suppression d'une commande."""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(
            f"/api/suppliers/orders/{self.commande.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            CommandeFournisseur.objects.filter(pk=self.commande.id).exists()
        )
