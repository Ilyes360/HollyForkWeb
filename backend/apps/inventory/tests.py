from decimal import Decimal
from django.test import TestCase
from apps.restaurant.models import Restaurant
from apps.inventory.models import Ingredient, Stock, Reapprovisionnement

class StockModelTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.restaurant = Restaurant.objects.create(
            nom_restaurant="Test Restaurant Stock",
            adresse_restaurant="123 Test St",
            code_postal="75001",
            ville="Testville",
            numero_telephone="0123456789",
            numero_siret="12345678901234"
        )
        cls.ingredient1 = Ingredient.objects.create(
            nom="Tomate",
            unite="kg",
            prix_unitaire=Decimal("2.50")
        )
        cls.ingredient2 = Ingredient.objects.create(
            nom="Fromage",
            unite="kg",
            prix_unitaire=Decimal("10.00")
        )
        # User and Employe for created_by fields if necessary for other tests
        # but not directly for Stock/Reapprovisionnement basic tests unless specific logic depends on it.

    def test_creer_ingredient(self):
        ingredient = Ingredient.objects.create(nom="Farine", unite="kg", prix_unitaire=Decimal("1.00"))
        self.assertEqual(ingredient.nom, "Farine")
        self.assertEqual(ingredient.unite, "kg")
        self.assertEqual(ingredient.prix_unitaire, Decimal("1.00"))
        self.assertEqual(str(ingredient), "Farine")

    def test_creer_stock_initial(self):
        stock = Stock.objects.create(
            restaurant=self.restaurant,
            ingredient=self.ingredient1,
            quantite_en_stock=Decimal("10.0"),
            seuil_alerte=Decimal("2.0"),
            cout_moyen_pondere=Decimal("2.50") # Initial CMP
        )
        self.assertEqual(stock.restaurant, self.restaurant)
        self.assertEqual(stock.ingredient, self.ingredient1)
        self.assertEqual(stock.quantite_en_stock, Decimal("10.0"))
        self.assertEqual(stock.cout_moyen_pondere, Decimal("2.50"))
        self.assertFalse(stock.est_en_rupture())
        self.assertEqual(str(stock), f"Stock de {self.ingredient1.nom} pour {self.restaurant.nom_restaurant} ({stock.quantite_en_stock} {self.ingredient1.unite})")

    def test_stock_en_rupture(self):
        stock = Stock.objects.create(
            restaurant=self.restaurant,
            ingredient=self.ingredient1,
            quantite_en_stock=Decimal("1.0"),
            seuil_alerte=Decimal("2.0")
        )
        self.assertTrue(stock.est_en_rupture())

    def test_mettre_a_jour_cout_moyen_pondere(self):
        stock = Stock.objects.create(
            restaurant=self.restaurant,
            ingredient=self.ingredient1,
            quantite_en_stock=Decimal("10.0"), # 10 kg en stock
            cout_moyen_pondere=Decimal("2.00") # à 2.00/kg -> valeur stock = 20.00
        )

        # Ajout de 5 kg à 3.00/kg (coût total du lot = 15.00)
        quantite_ajoutee = Decimal("5.0")
        prix_achat_total_lot = Decimal("15.00") # 5kg * 3.00/kg

        stock.mettre_a_jour_cout_moyen_pondere(quantite_ajoutee, prix_achat_total_lot)
        
        # Nouvelle quantité totale = 10 + 5 = 15 kg
        # Nouvelle valeur stock = (10 * 2.00) + (5 * 3.00) = 20.00 + 15.00 = 35.00
        # Nouveau CMP = 35.00 / 15 = 2.3333...
        self.assertAlmostEqual(stock.cout_moyen_pondere, Decimal("35.00") / Decimal("15.00"), places=4)

        # Test avec quantité ajoutée <= 0
        original_cmp = stock.cout_moyen_pondere
        stock.mettre_a_jour_cout_moyen_pondere(Decimal("0"), Decimal("10.00"))
        self.assertEqual(stock.cout_moyen_pondere, original_cmp)


    def test_creer_reapprovisionnement_et_maj_stock(self):
        # Stock initial pour ingredient1
        stock_tomate = Stock.objects.create(
            restaurant=self.restaurant,
            ingredient=self.ingredient1,
            quantite_en_stock=Decimal("5.0"), # 5 kg
            seuil_alerte=Decimal("2.0"),
            cout_moyen_pondere=Decimal("2.50") # CMP initial
        )
        valeur_stock_initiale_tomate = stock_tomate.quantite_en_stock * stock_tomate.cout_moyen_pondere # 5 * 2.50 = 12.50

        # Réapprovisionnement de ingredient1
        quantite_reappro = Decimal("10.0") # 10 kg
        prix_achat_lot = Decimal("30.0")   # pour 10 kg, donc 3.00/kg
        
        reappro = Reapprovisionnement.objects.create(
            restaurant=self.restaurant,
            ingredient=self.ingredient1,
            quantite_ajoutee=quantite_reappro,
            prix_achat=prix_achat_lot
        )
        self.assertEqual(reappro.quantite_ajoutee, quantite_reappro)
        self.assertIsNotNone(reappro.date_ajout)
        self.assertEqual(str(reappro), f"Réapprovisionnement de {quantite_reappro} {self.ingredient1.unite} de {self.ingredient1.nom} pour {self.restaurant.nom_restaurant}")

        # Vérifier la mise à jour du stock
        stock_tomate.refresh_from_db()
        nouvelle_quantite_attendue = Decimal("5.0") + quantite_reappro # 5 + 10 = 15 kg
        self.assertEqual(stock_tomate.quantite_en_stock, nouvelle_quantite_attendue)

        # Vérifier la mise à jour du CMP
        # Valeur ajoutée = 30.00
        # Nouvelle valeur stock = 12.50 + 30.00 = 42.50
        # Nouveau CMP = 42.50 / 15 kg
        cmp_attendu = (valeur_stock_initiale_tomate + prix_achat_lot) / nouvelle_quantite_attendue
        self.assertAlmostEqual(stock_tomate.cout_moyen_pondere, cmp_attendu, places=4)

    def test_reapprovisionnement_creation_stock_si_inexistant(self):
        # Ingredient2 n'a pas encore de stock
        self.assertFalse(Stock.objects.filter(restaurant=self.restaurant, ingredient=self.ingredient2).exists())

        quantite_reappro = Decimal("20.0")
        prix_achat_lot = Decimal("200.0") # 20kg * 10.00/kg (prix unitaire de l'ingrédient2)

        Reapprovisionnement.objects.create(
            restaurant=self.restaurant,
            ingredient=self.ingredient2,
            quantite_ajoutee=quantite_reappro,
            prix_achat=prix_achat_lot
        )

        stock_fromage = Stock.objects.get(restaurant=self.restaurant, ingredient=self.ingredient2)
        self.assertIsNotNone(stock_fromage)
        self.assertEqual(stock_fromage.quantite_en_stock, quantite_reappro)
        # CMP initial devrait être prix_achat_lot / quantite_reappro
        self.assertAlmostEqual(stock_fromage.cout_moyen_pondere, prix_achat_lot / quantite_reappro, places=4)

    def test_reapprovisionnement_cmp_correct_si_stock_initial_nul_et_cmp_nul(self):
        stock_farine = Stock.objects.create(
            restaurant=self.restaurant,
            ingredient=Ingredient.objects.create(nom="Farine Test", unite="kg", prix_unitaire=Decimal("1.00")),
            quantite_en_stock=Decimal("0.0"),
            cout_moyen_pondere=Decimal("0.0") 
        )
        
        quantite_reappro = Decimal("10.0")
        prix_achat_lot = Decimal("12.00") # 1.20/kg

        Reapprovisionnement.objects.create(
            restaurant=self.restaurant,
            ingredient=stock_farine.ingredient,
            quantite_ajoutee=quantite_reappro,
            prix_achat=prix_achat_lot
        )
        stock_farine.refresh_from_db()
        self.assertEqual(stock_farine.quantite_en_stock, quantite_reappro)
        self.assertAlmostEqual(stock_farine.cout_moyen_pondere, prix_achat_lot / quantite_reappro, places=4) 
