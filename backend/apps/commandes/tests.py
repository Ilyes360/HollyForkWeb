"""
Tests pour l'application commandes.
"""

from decimal import Decimal
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from apps.commandes.models import Commande, LigneCommande
from apps.restaurant.models import Restaurant
from apps.staff.models import TypeEmploye, Employe
from apps.menu.models import CategorieArticle, Article
from apps.shared.models import TauxTVA
from apps.salles.models import Salle, Table

User = get_user_model()


class TestCommandeModel(TestCase):
    """Tests pour le modèle Commande."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type='Serveur',
            description='Employé en salle'
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom='Dupont',
            prenom='Jean',
            type_employe=self.type_employe,
            pin_code='1234'
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
        self.commande = Commande.objects.create(
            restaurant=self.restaurant,
            created_by=self.employe,
            statut='EN_COURS',
            montant=Decimal('0.00'),
            nb_articles=0
        )
    
    def test_create_commande(self):
        """Test de création d'une commande."""
        self.assertEqual(self.commande.statut, 'EN_COURS')
        self.assertEqual(self.commande.montant, Decimal('0.00'))
    
    def test_commande_str(self):
        """Test de la représentation string."""
        result = str(self.commande)
        self.assertIn('Commande', result)


class TestCommandeAPI(APITestCase):
    """Tests pour l'API Commandes."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type='Serveur',
            description='Employé en salle'
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom='Dupont',
            prenom='Jean',
            type_employe=self.type_employe,
            pin_code='1234'
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
        self.commande = Commande.objects.create(
            restaurant=self.restaurant,
            created_by=self.employe,
            statut='EN_COURS',
            montant=Decimal('0.00'),
            nb_articles=0
        )
    
    def test_list_commandes_requires_auth(self):
        """Test que la liste nécessite l'authentification."""
        response = self.client.get('/api/commandes/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_commandes(self):
        """Test de liste des commandes."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/commandes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_commandes_by_restaurant(self):
        """Test de filtrage par restaurant."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f'/api/commandes/?restaurant_id={self.restaurant.id_restaurant}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_commandes_by_statut(self):
        """Test de filtrage par statut."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/commandes/?statut=EN_COURS')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


@override_settings(
    CACHES={
        'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'},
        'stocks': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'stocks-test',
        },
    }
)
class TestLigneCommandeMiseEnAttenteEtReclamation(APITestCase):
    """Tests pour la mise en attente d'un article et sa réclamation."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type='Serveur',
            description='Employé en salle'
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom='Dupont',
            prenom='Jean',
            type_employe=self.type_employe,
            pin_code='1234'
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
        self.commande = Commande.objects.create(
            restaurant=self.restaurant,
            created_by=self.employe,
            statut='EN_COURS',
            montant=Decimal('0.00'),
            nb_articles=0
        )
        self.taux_tva = TauxTVA.objects.create(
            taux=Decimal('20.00'),
            description='TVA normale',
            actif=True
        )
        self.categorie = CategorieArticle.objects.create(
            nom='Desserts',
            ordre_affichage=1
        )
        self.article = Article.objects.create(
            nom='Tiramisu',
            restaurant=self.restaurant,
            categorie=self.categorie,
            prix=Decimal('6.50'),
            taux_tva=self.taux_tva
        )
        self.client.force_authenticate(user=self.user)

    def test_creer_ligne_avec_article_en_attente(self):
        """Création d'une ligne avec en_attente_service=True (mise en attente)."""
        payload = {
            'commande_id': self.commande.id,
            'article_id': self.article.id,
            'quantity': 1,
            'awaiting_service': True,
        }
        response = self.client.post('/api/lignes-commandes/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get('awaiting_service'))
        self.assertEqual(response.data['quantity'], 1)
        ligne = LigneCommande.objects.get(id=response.data['id'])
        self.assertTrue(ligne.en_attente_service)

    def test_creer_ligne_sans_attente_par_defaut(self):
        """Sans en_attente_service, la ligne n'est pas en attente."""
        payload = {
            'commande_id': self.commande.id,
            'article_id': self.article.id,
            'quantity': 1,
        }
        response = self.client.post('/api/lignes-commandes/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data.get('awaiting_service'))
        ligne = LigneCommande.objects.get(id=response.data['id'])
        self.assertFalse(ligne.en_attente_service)

    def test_reclamer_ligne_en_attente_ok(self):
        """Réclamer une ligne en attente passe en_attente_service à False."""
        ligne = LigneCommande.objects.create(
            commande=self.commande,
            article=self.article,
            quantite=1,
            prix_unitaire=self.article.prix,
            en_attente_service=True
        )
        self.commande.calculer_montant_et_cmv()
        self.commande.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])
        response = self.client.post(
            f'/api/lignes-commandes/{ligne.id}/reclamer/',
            {},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get('awaiting_service'))
        ligne.refresh_from_db()
        self.assertFalse(ligne.en_attente_service)

    def test_reclamer_ligne_non_en_attente_400(self):
        """Réclamer une ligne déjà non en attente renvoie 400."""
        ligne = LigneCommande.objects.create(
            commande=self.commande,
            article=self.article,
            quantite=1,
            prix_unitaire=self.article.prix,
            en_attente_service=False
        )
        self.commande.calculer_montant_et_cmv()
        self.commande.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])
        response = self.client.post(
            f'/api/lignes-commandes/{ligne.id}/reclamer/',
            {},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertIn('pas en attente', response.data['detail'])
        ligne.refresh_from_db()
        self.assertFalse(ligne.en_attente_service)

    def test_patch_enlever_attente(self):
        """PATCH avec en_attente_service=False enlève l'attente (alternative à réclamer)."""
        ligne = LigneCommande.objects.create(
            commande=self.commande,
            article=self.article,
            quantite=1,
            prix_unitaire=self.article.prix,
            en_attente_service=True
        )
        self.commande.calculer_montant_et_cmv()
        self.commande.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])
        response = self.client.patch(
            f'/api/lignes-commandes/{ligne.id}/',
            {'awaiting_service': False},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get('awaiting_service'))
        ligne.refresh_from_db()
        self.assertFalse(ligne.en_attente_service)


@override_settings(
    CACHES={
        'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'},
        'stocks': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'stocks-test-deplacement',
        },
    }
)
class TestDeplacementCommandeEtLigne(APITestCase):
    """Tests pour le déplacement d'une commande vers une table et d'une ligne vers une autre commande."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        self.type_employe = TypeEmploye.objects.create(
            nom_type='Serveur',
            description='Employé en salle'
        )
        self.employe = Employe.objects.create(
            user=self.user,
            nom='Martin',
            prenom='Paul',
            type_employe=self.type_employe,
            pin_code='5678'
        )
        self.restaurant = Restaurant.objects.create(
            nom_restaurant='Restaurant Test 2',
            adresse_restaurant='456 Rue Test',
            code_postal='75002',
            ville='Paris',
            numero_telephone='0987654321',
            numero_siret='98765432109876',
            pin_restaurant='654321'
        )
        self.salle = Salle.objects.create(
            nom_salle='Salle principale',
            restaurant=self.restaurant,
            capacite=30
        )
        self.table1 = Table.objects.create(
            numero=1,
            capacity=4,
            salle=self.salle,
            employee_in_charge=self.employe
        )
        self.table2 = Table.objects.create(
            numero=2,
            capacity=4,
            salle=self.salle,
            employee_in_charge=self.employe
        )
        self.table3 = Table.objects.create(
            numero=3,
            capacity=4,
            salle=self.salle,
            employee_in_charge=self.employe
        )
        self.commande1 = Commande.objects.create(
            restaurant=self.restaurant,
            created_by=self.employe,
            statut='EN_COURS',
            montant=Decimal('0.00'),
            nb_articles=0,
            table=self.table1
        )
        self.commande2 = Commande.objects.create(
            restaurant=self.restaurant,
            created_by=self.employe,
            statut='EN_COURS',
            montant=Decimal('0.00'),
            nb_articles=0,
            table=self.table2
        )
        self.taux_tva = TauxTVA.objects.create(
            taux=Decimal('20.00'),
            description='TVA normale',
            actif=True
        )
        self.categorie = CategorieArticle.objects.create(
            nom='Plats',
            ordre_affichage=1
        )
        self.article = Article.objects.create(
            nom='Salade',
            restaurant=self.restaurant,
            categorie=self.categorie,
            prix=Decimal('10.00'),
            taux_tva=self.taux_tva
        )
        self.client.force_authenticate(user=self.user)

    def test_deplacer_commande_vers_table_libre_ok(self):
        """Déplacer une commande vers une table libre renvoie 200 et met à jour la table."""
        response = self.client.post(
            f'/api/commandes/{self.commande1.id}/deplacer/',
            {'table_id': self.table3.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.commande1.refresh_from_db()
        self.assertEqual(self.commande1.table_id, self.table3.id)

    def test_deplacer_commande_vers_table_occupee_400(self):
        """Déplacer une commande vers une table déjà occupée renvoie 400 avec message table occupée."""
        response = self.client.post(
            f'/api/commandes/{self.commande1.id}/deplacer/',
            {'table_id': self.table2.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
        self.assertEqual(response.data['detail'], 'La table est occupée.')
        self.commande1.refresh_from_db()
        self.assertEqual(self.commande1.table_id, self.table1.id)

    def test_deplacer_commande_sans_table_id_400(self):
        """Déplacer une commande sans table_id renvoie 400."""
        response = self.client.post(
            f'/api/commandes/{self.commande1.id}/deplacer/',
            {},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deplacer_ligne_par_commande_id_ok(self):
        """Déplacer une ligne vers une autre commande par commande_id met à jour la ligne."""
        ligne = LigneCommande.objects.create(
            commande=self.commande1,
            article=self.article,
            quantite=1,
            prix_unitaire=self.article.prix,
        )
        self.commande1.calculer_montant_et_cmv()
        self.commande1.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])
        response = self.client.post(
            f'/api/lignes-commandes/{ligne.id}/deplacer/',
            {'commande_id': self.commande2.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ligne.refresh_from_db()
        self.assertEqual(ligne.commande_id, self.commande2.id)

    def test_deplacer_ligne_par_table_id_ok(self):
        """Déplacer une ligne vers la commande d'une table par table_id met à jour la ligne."""
        ligne = LigneCommande.objects.create(
            commande=self.commande1,
            article=self.article,
            quantite=1,
            prix_unitaire=self.article.prix,
        )
        self.commande1.calculer_montant_et_cmv()
        self.commande1.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])
        response = self.client.post(
            f'/api/lignes-commandes/{ligne.id}/deplacer/',
            {'table_id': self.table2.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ligne.refresh_from_db()
        self.assertEqual(ligne.commande_id, self.commande2.id)

    def test_deplacer_ligne_table_sans_commande_cree_commande(self):
        """Déplacer une ligne vers une table sans commande crée automatiquement une commande EN_COURS sur cette table."""
        ligne = LigneCommande.objects.create(
            commande=self.commande1,
            article=self.article,
            quantite=1,
            prix_unitaire=self.article.prix,
        )
        self.commande1.calculer_montant_et_cmv()
        self.commande1.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])
        response = self.client.post(
            f'/api/lignes-commandes/{ligne.id}/deplacer/',
            {'table_id': self.table3.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Une nouvelle commande EN_COURS doit avoir été créée sur table3
        nouvelle_commande = Commande.objects.get(table=self.table3, statut='EN_COURS')
        ligne.refresh_from_db()
        self.assertEqual(ligne.commande_id, nouvelle_commande.id)
        # La commande nouvellement créée doit appartenir au même restaurant et avoir le bon serveur
        self.assertEqual(nouvelle_commande.restaurant_id, self.restaurant.id_restaurant)
        self.assertEqual(nouvelle_commande.created_by_id, self.commande1.created_by_id)

    def test_deplacer_ligne_sans_commande_id_ni_table_id_400(self):
        """Déplacer une ligne sans commande_id ni table_id renvoie 400."""
        ligne = LigneCommande.objects.create(
            commande=self.commande1,
            article=self.article,
            quantite=1,
            prix_unitaire=self.article.prix,
        )
        self.commande1.calculer_montant_et_cmv()
        self.commande1.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])
        response = self.client.post(
            f'/api/lignes-commandes/{ligne.id}/deplacer/',
            {},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deplacer_selection_par_commande_id_ok(self):
        """Déplacer plusieurs lignes vers une autre commande par commande_id met à jour toutes les lignes."""
        ligne1 = LigneCommande.objects.create(
            commande=self.commande1,
            article=self.article,
            quantite=1,
            prix_unitaire=self.article.prix,
        )
        ligne2 = LigneCommande.objects.create(
            commande=self.commande1,
            article=self.article,
            quantite=2,
            prix_unitaire=self.article.prix,
        )
        response = self.client.post(
            '/api/lignes-commandes/deplacer-selection/',
            {'ligne_ids': [ligne1.id, ligne2.id], 'commande_id': self.commande2.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ligne1.refresh_from_db()
        ligne2.refresh_from_db()
        self.assertEqual(ligne1.commande_id, self.commande2.id)
        self.assertEqual(ligne2.commande_id, self.commande2.id)

    def test_deplacer_selection_par_table_id_cree_commande_si_absente(self):
        """Déplacer plusieurs lignes vers une table sans commande crée une commande et y rattache toutes les lignes."""
        ligne1 = LigneCommande.objects.create(
            commande=self.commande1,
            article=self.article,
            quantite=1,
            prix_unitaire=self.article.prix,
        )
        ligne2 = LigneCommande.objects.create(
            commande=self.commande1,
            article=self.article,
            quantite=2,
            prix_unitaire=self.article.prix,
        )
        response = self.client.post(
            '/api/lignes-commandes/deplacer-selection/',
            {'ligne_ids': [ligne1.id, ligne2.id], 'table_id': self.table3.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nouvelle_commande = Commande.objects.get(table=self.table3, statut='EN_COURS')
        ligne1.refresh_from_db()
        ligne2.refresh_from_db()
        self.assertEqual(ligne1.commande_id, nouvelle_commande.id)
        self.assertEqual(ligne2.commande_id, nouvelle_commande.id)
