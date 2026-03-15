"""
Tests pour l'application billing.

Couverture : modèles (Facture, LigneFacture, MethodePaiement, Paiement),
sérialisation, et API (factures, paiements, méthodes de paiement).
"""

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.billing.models import Facture, LigneFacture, MethodePaiement, Paiement
from apps.shared.models import TauxTVA
from apps.restaurant.models import Restaurant
from apps.menu.models import CategorieArticle, Article
from apps.commandes.models import CommandeHistoric
from apps.staff.models import TypeEmploye, Employe, RestaurantEmploye
from apps.staff.employee_roles import EmployeeRole

User = get_user_model()


def _create_taux_tva(taux=Decimal("20.00"), description="Taux normal"):
    """Crée un taux de TVA pour les tests."""
    return TauxTVA.objects.create(taux=taux, description=description, actif=True)


def _create_restaurant():
    """Crée un restaurant pour les tests."""
    return Restaurant.objects.create(
        nom_restaurant="Restaurant Billing Test",
        adresse_restaurant="1 Rue Test",
        code_postal="75001",
        ville="Paris",
        numero_telephone="0123456789",
        numero_siret="12345678901234",
        pin_restaurant="123456",
    )


def _create_commande_historic(restaurant, employe, statut="VALIDE", montant=Decimal("50.00")):
    """Crée une commande historique pour lier une facture."""
    return CommandeHistoric.objects.create(
        restaurant=restaurant,
        created_by=employe,
        statut=statut,
        montant=montant,
        nb_articles=2,
        created_at=timezone.now(),
    )


# --- Tests modèles ---


class MethodePaiementModelTest(TestCase):
    """Tests du modèle MethodePaiement."""

    def test_create(self):
        """Création d'une méthode de paiement."""
        mp = MethodePaiement.objects.create(nom="Carte bancaire")
        self.assertEqual(mp.nom, "Carte bancaire")

    def test_str(self):
        """Représentation string."""
        mp = MethodePaiement.objects.create(nom="Espèces")
        self.assertEqual(str(mp), "Espèces")

    def test_unicite_nom(self):
        """Le nom doit être unique."""
        MethodePaiement.objects.create(nom="CB")
        with self.assertRaises(Exception):  # IntegrityError
            MethodePaiement.objects.create(nom="CB")


class LigneFactureModelTest(TestCase):
    """Tests du modèle LigneFacture (calculs TVA et mise à jour facture)."""

    def setUp(self):
        self.taux = _create_taux_tva(Decimal("20.00"))
        self.restaurant = _create_restaurant()
        self.user = User.objects.create_user(
            username="billinguser", email="billing@test.com", password="testpass123"
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type="Serveur", description="Serveur"
        )
        self.employe = Employe.objects.create(
            user=self.user, nom="Test", prenom="User", type_employe=self.type_employe, pin_code="1234"
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=self.employe)
        self.commande_hist = _create_commande_historic(self.restaurant, self.employe)
        self.facture = Facture.objects.create(
            numero="FAC-001",
            date=timezone.now().date(),
            montant_ht=Decimal("0.00"),
            montant_ttc=Decimal("0.00"),
            montant_tva=Decimal("0.00"),
            restaurant=self.restaurant,
            commande=self.commande_hist,
            etat="en_attente",
        )
        cat = CategorieArticle.objects.create(
            nom="Plats",
            ordre_affichage=1,
        )
        self.article = Article.objects.create(
            nom="Article Test",
            restaurant=self.restaurant,
            categorie=cat,
            prix=Decimal("10.00"),
            taux_tva=self.taux,
        )

    def test_calculer_tva(self):
        """Calcul du montant TVA d'une ligne."""
        ligne = LigneFacture(
            facture=self.facture,
            produit=self.article,
            quantite=2,
            prix_unitaire_ht=Decimal("10.00"),
            taux_tva=self.taux,
        )
        # 2 * 10 = 20 HT, TVA 20% = 4.00
        self.assertEqual(ligne.calculer_tva(), Decimal("4.00"))

    def test_calculer_montant_ttc(self):
        """Calcul du montant TTC d'une ligne."""
        ligne = LigneFacture(
            facture=self.facture,
            produit=self.article,
            quantite=1,
            prix_unitaire_ht=Decimal("100.00"),
            taux_tva=self.taux,
        )
        # 100 * 1.20 = 120
        self.assertEqual(ligne.calculer_montant_ttc(), Decimal("120.00"))

    def test_save_calcule_prix_ttc_et_maj_facture(self):
        """Sauvegarde d'une ligne met à jour prix_unitaire_ttc et totaux de la facture."""
        LigneFacture.objects.create(
            facture=self.facture,
            produit=self.article,
            quantite=2,
            prix_unitaire_ht=Decimal("10.00"),
            taux_tva=self.taux,
        )
        self.facture.refresh_from_db()
        self.assertEqual(self.facture.montant_ht, Decimal("20.00"))
        self.assertEqual(self.facture.montant_tva, Decimal("4.00"))
        self.assertEqual(self.facture.montant_ttc, Decimal("24.00"))


class FactureModelTest(TestCase):
    """Tests du modèle Facture."""

    def setUp(self):
        self.taux = _create_taux_tva(Decimal("10.00"))
        self.restaurant = _create_restaurant()
        self.user = User.objects.create_user(
            username="factuser", email="fact@test.com", password="testpass123"
        )
        self.type_employe = TypeEmploye.objects.create(nom_type="Serveur", description="")
        self.employe = Employe.objects.create(
            user=self.user, nom="F", prenom="U", type_employe=self.type_employe, pin_code="0000"
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=self.employe)
        self.commande_hist = _create_commande_historic(self.restaurant, self.employe)
        self.facture = Facture.objects.create(
            numero="FAC-002",
            date=timezone.now().date(),
            montant_ht=Decimal("0.00"),
            montant_ttc=Decimal("0.00"),
            montant_tva=Decimal("0.00"),
            restaurant=self.restaurant,
            commande=self.commande_hist,
            etat="en_attente",
        )
        cat = CategorieArticle.objects.create(
            nom="Boissons",
            ordre_affichage=2,
        )
        self.article = Article.objects.create(
            nom="Café",
            restaurant=self.restaurant,
            categorie=cat,
            prix=Decimal("2.00"),
            taux_tva=self.taux,
        )

    def test_str(self):
        """Représentation string de la facture."""
        s = str(self.facture)
        self.assertIn("FAC-002", s)
        self.assertIn(self.restaurant.nom_restaurant, s)

    def test_get_tva_par_taux(self):
        """TVA groupée par taux."""
        LigneFacture.objects.create(
            facture=self.facture,
            produit=self.article,
            quantite=5,
            prix_unitaire_ht=Decimal("2.00"),
            taux_tva=self.taux,
        )
        tva_par_taux = self.facture.get_tva_par_taux()
        self.assertIn(Decimal("10.00"), tva_par_taux)
        self.assertEqual(tva_par_taux[Decimal("10.00")], Decimal("1.00"))  # 10 * 10% = 1

    def test_calculer_totaux(self):
        """Recalcul des totaux après ajout de lignes."""
        LigneFacture.objects.create(
            facture=self.facture,
            produit=self.article,
            quantite=2,
            prix_unitaire_ht=Decimal("5.00"),
            taux_tva=self.taux,
        )
        self.facture.calculer_totaux()
        self.assertEqual(self.facture.montant_ht, Decimal("10.00"))
        self.assertEqual(self.facture.montant_tva, Decimal("1.00"))
        self.assertEqual(self.facture.montant_ttc, Decimal("11.00"))


class PaiementModelTest(TestCase):
    """Tests du modèle Paiement."""

    def setUp(self):
        self.restaurant = _create_restaurant()
        self.user = User.objects.create_user(
            username="payuser", email="pay@test.com", password="testpass123"
        )
        self.type_employe = TypeEmploye.objects.create(nom_type="Caisse", description="")
        self.employe = Employe.objects.create(
            user=self.user, nom="P", prenom="U", type_employe=self.type_employe, pin_code="1111"
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=self.employe)
        self.commande_hist = _create_commande_historic(self.restaurant, self.employe)
        self.facture = Facture.objects.create(
            numero="FAC-PAY",
            date=timezone.now().date(),
            montant_ht=Decimal("50.00"),
            montant_ttc=Decimal("60.00"),
            montant_tva=Decimal("10.00"),
            restaurant=self.restaurant,
            commande=self.commande_hist,
            etat="en_attente",
        )
        self.methode = MethodePaiement.objects.create(nom="CB")

    def test_create(self):
        """Création d'un paiement."""
        p = Paiement.objects.create(
            facture=self.facture, methode_paiement=self.methode, montant=Decimal("60.00")
        )
        self.assertEqual(p.montant, Decimal("60.00"))

    def test_str(self):
        """Représentation string."""
        p = Paiement.objects.create(
            facture=self.facture, methode_paiement=self.methode, montant=Decimal("60.00")
        )
        self.assertIn("FAC-PAY", str(p))
        self.assertIn("CB", str(p))

    def test_facture_montant_paye_et_reste_a_payer(self):
        """Total payé et reste à payer calculés correctement (plusieurs paiements)."""
        self.assertEqual(self.facture.montant_paye, Decimal("0.00"))
        self.assertEqual(self.facture.reste_a_payer, Decimal("60.00"))
        Paiement.objects.create(
            facture=self.facture, methode_paiement=self.methode, montant=Decimal("30.00")
        )
        self.facture.refresh_from_db()
        self.assertEqual(self.facture.montant_paye, Decimal("30.00"))
        self.assertEqual(self.facture.reste_a_payer, Decimal("30.00"))
        Paiement.objects.create(
            facture=self.facture, methode_paiement=self.methode, montant=Decimal("30.00")
        )
        self.facture.refresh_from_db()
        self.assertEqual(self.facture.montant_paye, Decimal("60.00"))
        self.assertEqual(self.facture.reste_a_payer, Decimal("0.00"))


class FactureAPITest(APITestCase):
    """Tests de l'API factures."""

    def setUp(self):
        self.restaurant = _create_restaurant()
        self.user = User.objects.create_user(
            username="apiuser", email="api@test.com", password="testpass123"
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type=EmployeeRole.MANAGER_SALLE.value, description="Manager"
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom="API",
            prenom="User",
            type_employe=self.type_employe,
            pin_code="9999",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=self.employe)
        self.commande_hist = _create_commande_historic(self.restaurant, self.employe)
        self.facture = Facture.objects.create(
            numero="FAC-API",
            date=timezone.now().date(),
            montant_ht=Decimal("100.00"),
            montant_ttc=Decimal("120.00"),
            montant_tva=Decimal("20.00"),
            restaurant=self.restaurant,
            commande=self.commande_hist,
            etat="en_attente",
        )

    def test_list_requires_auth(self):
        """La liste des factures requiert une authentification."""
        response = self.client.get("/api/factures/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste des factures avec utilisateur authentifié et accès restaurant."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/factures/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data.get("results", response.data), list)

    def test_filter_by_restaurant(self):
        """Filtrage par restaurant."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/factures/?restaurant={self.restaurant.id_restaurant}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_etat(self):
        """Filtrage par état."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/factures/?etat=en_attente")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_facture(self):
        """Détail d'une facture."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/factures/{self.facture.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["number"], "FAC-API")
        self.assertEqual(response.data["state"], "en_attente")
        self.assertIn("amount_paid", response.data)
        self.assertIn("amount_due", response.data)
        self.assertEqual(Decimal(response.data["amount_paid"]), Decimal("0.00"))
        self.assertEqual(Decimal(response.data["amount_due"]), Decimal("120.00"))

    def test_marquer_payee_ok(self):
        """Marquer une facture comme payée."""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/factures/{self.facture.pk}/marquer_payee/", {}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.facture.refresh_from_db()
        self.assertEqual(self.facture.etat, "payee")

    def test_marquer_payee_deja_payee(self):
        """Marquer comme payée une facture déjà payée renvoie 400."""
        self.facture.etat = "payee"
        self.facture.save(update_fields=["etat"])
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/factures/{self.facture.pk}/marquer_payee/", {}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stats_requires_financial_reports(self):
        """L'action stats requiert la permission VIEW_FINANCIAL_REPORTS (employé avec rôle adapté)."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/factures/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_invoices", response.data)
        self.assertIn("total_revenue_before_tax", response.data)
        self.assertIn("date_generated", response.data)


class PaiementAPITest(APITestCase):
    """Tests de l'API paiements."""

    def setUp(self):
        self.restaurant = _create_restaurant()
        self.user = User.objects.create_user(
            username="payapi", email="payapi@test.com", password="testpass123"
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type=EmployeeRole.PERSONNE_CAISSE.value, description="Caisse"
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom="Pay",
            prenom="Api",
            type_employe=self.type_employe,
            pin_code="5555",
        )
        RestaurantEmploye.objects.create(restaurant=self.restaurant, employe=self.employe)
        self.commande_hist = _create_commande_historic(self.restaurant, self.employe)
        self.facture = Facture.objects.create(
            numero="FAC-PAY-API",
            date=timezone.now().date(),
            montant_ht=Decimal("30.00"),
            montant_ttc=Decimal("36.00"),
            montant_tva=Decimal("6.00"),
            restaurant=self.restaurant,
            commande=self.commande_hist,
            etat="en_attente",
        )
        self.methode = MethodePaiement.objects.create(nom="Espèces")

    def test_list_requires_auth(self):
        """La liste des paiements requiert une authentification."""
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste des paiements avec authentification."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_by_facture(self):
        """Filtrage par facture."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/paiements/?facture={self.facture.pk}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_paiement(self):
        """Création d'un paiement via l'API."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "facture_id": self.facture.pk,
            "methode_paiement_id": self.methode.pk,
            "amount": "36.00",
        }
        response = self.client.post("/api/paiements/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data["amount"]), Decimal("36.00"))
        self.facture.refresh_from_db()
        self.assertEqual(self.facture.etat, "payee")

    def test_create_paiement_exceeds_ttc_rejected(self):
        """Un paiement qui ferait dépasser le montant TTC est refusé."""
        self.client.force_authenticate(user=self.user)
        payload = {
            "facture_id": self.facture.pk,
            "methode_paiement_id": self.methode.pk,
            "amount": "40.00",
        }
        response = self.client.post("/api/paiements/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("amount", response.data)

    def test_create_paiement_split_then_auto_marquer_payee(self):
        """Deux paiements qui couvrent le TTC : la facture est marquée payée après le second."""
        self.client.force_authenticate(user=self.user)
        self.client.post(
            "/api/paiements/",
            {"facture_id": self.facture.pk, "methode_paiement_id": self.methode.pk, "amount": "20.00"},
            format="json",
        )
        self.facture.refresh_from_db()
        self.assertEqual(self.facture.etat, "en_attente")
        self.client.post(
            "/api/paiements/",
            {"facture_id": self.facture.pk, "methode_paiement_id": self.methode.pk, "amount": "16.00"},
            format="json",
        )
        self.facture.refresh_from_db()
        self.assertEqual(self.facture.etat, "payee")

    def test_create_paiement_facture_annulee_rejected(self):
        """Impossible d'ajouter un paiement sur une facture annulée."""
        self.facture.etat = "annulee"
        self.facture.save(update_fields=["etat"])
        self.client.force_authenticate(user=self.user)
        payload = {
            "facture_id": self.facture.pk,
            "methode_paiement_id": self.methode.pk,
            "amount": "36.00",
        }
        response = self.client.post("/api/paiements/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("facture_id", response.data)


class MethodePaiementAPITest(APITestCase):
    """Tests de l'API méthodes de paiement (lecture seule)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="methuser", email="meth@test.com", password="testpass123"
        )
        MethodePaiement.objects.create(nom="Carte")
        MethodePaiement.objects.create(nom="Virement")

    def test_list_requires_auth(self):
        """La liste requiert une authentification."""
        response = self.client.get("/api/methodes-paiement/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_authenticated(self):
        """Liste des méthodes de paiement."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/methodes-paiement/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        noms = [item["name"] for item in response.data.get("results", response.data)]
        self.assertIn("Carte", noms)
        self.assertIn("Virement", noms)

    def test_retrieve(self):
        """Détail d'une méthode de paiement."""
        mp = MethodePaiement.objects.first()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/methodes-paiement/{mp.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], mp.nom)
