from decimal import Decimal
from django.test import TestCase
from apps.restaurant.models import Restaurant
from apps.inventory.models import Ingredient, Stock
from apps.menu.models import Article, ArticleIngredient, CategorieArticle

class MenuModelTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.restaurant = Restaurant.objects.create(
            nom_restaurant="Test Restaurant Menu",
            adresse_restaurant="456 Test Ave",
            code_postal="75002",
            ville="Menutown",
            numero_telephone="0987654321",
            numero_siret="09876543210987"
        )
        cls.ingredient_tomate = Ingredient.objects.create(nom="Tomate Sauce", unite="L", prix_unitaire=Decimal("3.00"))
        cls.ingredient_pate = Ingredient.objects.create(nom="Pâte à Pizza", unite="unité", prix_unitaire=Decimal("1.50"))
        cls.ingredient_fromage_menu = Ingredient.objects.create(nom="Fromage Mozza", unite="kg", prix_unitaire=Decimal("12.00"))

        # Stock pour les ingrédients
        cls.stock_tomate = Stock.objects.create(
            restaurant=cls.restaurant,
            ingredient=cls.ingredient_tomate,
            quantite_en_stock=Decimal("10.0"), # 10 L
            seuil_alerte=Decimal("1.0"),
            cout_moyen_pondere=Decimal("3.00")
        )
        cls.stock_pate = Stock.objects.create(
            restaurant=cls.restaurant,
            ingredient=cls.ingredient_pate,
            quantite_en_stock=Decimal("20.0"), # 20 unités
            seuil_alerte=Decimal("5.0"),
            cout_moyen_pondere=Decimal("1.50")
        )
        cls.stock_fromage_menu = Stock.objects.create(
            restaurant=cls.restaurant,
            ingredient=cls.ingredient_fromage_menu,
            quantite_en_stock=Decimal("5.0"), # 5 kg
            seuil_alerte=Decimal("0.5"),
            cout_moyen_pondere=Decimal("12.00")
        )
        
        # Un autre restaurant pour tester la portée de la disponibilité
        cls.other_restaurant = Restaurant.objects.create(
            nom_restaurant="Other Restaurant",
            adresse_restaurant="789 Other St",
            code_postal="75003",
            ville="Otherville",
            numero_telephone="1122334455",
            numero_siret="11223344551122"
        )
        # Stock dans l'autre restaurant (pour s'assurer que verifier_disponibilite ne mélange pas)
        cls.stock_tomate_other_resto = Stock.objects.create(
            restaurant=cls.other_restaurant,
            ingredient=cls.ingredient_tomate,
            quantite_en_stock=Decimal("100.0"),
            cout_moyen_pondere=Decimal("3.00")
        )

        # Catégories pour les articles
        cls.categorie_plats = CategorieArticle.objects.create(
            nom="Plats",
            ordre_affichage=1
        )
        cls.categorie_boissons = CategorieArticle.objects.create(
            nom="Boissons",
            ordre_affichage=2
        )

    def test_creer_article_simple(self):
        article = Article.objects.create(
            nom="Boisson Soda",
            restaurant=self.restaurant,
            prix=Decimal("2.00"),
            description="Canette de soda",
            categorie=self.categorie_boissons
        )
        self.assertEqual(article.nom, "Boisson Soda")
        self.assertTrue(article.disponible) # Par défaut disponible, car pas d'ingrédients
        self.assertEqual(str(article), "Boisson Soda")

    def test_creer_article_ingredient(self):
        pizza_margherita = Article.objects.create(
            nom="Pizza Margherita",
            restaurant=self.restaurant,
            prix=Decimal("12.00"),
            categorie=self.categorie_plats
        )
        ai_pate = ArticleIngredient.objects.create(
            article=pizza_margherita,
            ingredient=self.ingredient_pate,
            quantite_necessaire=Decimal("1.0") # 1 unité de pâte
        )
        ai_tomate = ArticleIngredient.objects.create(
            article=pizza_margherita,
            ingredient=self.ingredient_tomate,
            quantite_necessaire=Decimal("0.2") # 0.2 L de sauce tomate
        )
        self.assertEqual(ai_pate.article, pizza_margherita)
        self.assertEqual(ai_pate.ingredient, self.ingredient_pate)
        self.assertEqual(pizza_margherita.ingredients.count(), 2)
        self.assertEqual(str(ai_pate), f"1.00 {self.ingredient_pate.unite} de {self.ingredient_pate.nom} pour {pizza_margherita.nom}")


    def test_verifier_disponibilite_article_suffisant(self):
        # Création d'un article et de ses ingrédients
        pizza_reine = Article.objects.create(
            nom="Pizza Reine",
            restaurant=self.restaurant,
            prix=Decimal("14.00"),
            categorie=self.categorie_plats
        )
        ArticleIngredient.objects.create(article=pizza_reine, ingredient=self.ingredient_pate, quantite_necessaire=Decimal("1.0"))
        ArticleIngredient.objects.create(article=pizza_reine, ingredient=self.ingredient_tomate, quantite_necessaire=Decimal("0.2"))
        ArticleIngredient.objects.create(article=pizza_reine, ingredient=self.ingredient_fromage_menu, quantite_necessaire=Decimal("0.15")) # 150g de fromage

        # Le stock est suffisant dans self.restaurant (où la pizza sera vendue)
        # Note: verifier_disponibilite regarde le stock dans TOUS les restaurants par défaut,
        # ce qui est un comportement à noter. Idéalement, la disponibilité devrait être par restaurant.
        # La logique actuelle: `restaurant__in=Restaurant.objects.all()` puis `.first()`
        # Cela signifie qu'il suffit qu'UN restaurant ait le stock pour que l'article soit marqué dispo.
        # Ce test est basé sur la logique actuelle du code.
        
        # Pour ce test, assurons-nous que self.restaurant a le stock
        self.stock_pate.quantite_en_stock = Decimal("10")
        self.stock_pate.save()
        self.stock_tomate.quantite_en_stock = Decimal("5")
        self.stock_tomate.save()
        self.stock_fromage_menu.quantite_en_stock = Decimal("2")
        self.stock_fromage_menu.save()

        self.assertTrue(pizza_reine.verifier_disponibilite())
        pizza_reine.save() # La sauvegarde met à jour le champ 'disponible'
        self.assertTrue(pizza_reine.disponible)

    def test_verifier_disponibilite_article_insuffisant_un_ingredient(self):
        pizza_napolitaine = Article.objects.create(
            nom="Pizza Napolitaine",
            restaurant=self.restaurant,
            prix=Decimal("13.00"),
            categorie=self.categorie_plats
        )
        ArticleIngredient.objects.create(article=pizza_napolitaine, ingredient=self.ingredient_pate, quantite_necessaire=Decimal("1.0"))
        ArticleIngredient.objects.create(article=pizza_napolitaine, ingredient=self.ingredient_tomate, quantite_necessaire=Decimal("0.2"))

        # Ingrédient tomate en quantité insuffisante dans self.restaurant
        self.stock_tomate.quantite_en_stock = Decimal("0.1") # Nécessite 0.2L
        self.stock_tomate.seuil_alerte = Decimal("0.2") # Mettre le seuil au-dessus de la quantité
        self.stock_tomate.save()

        # Assurons-nous que l'autre restaurant n'a pas non plus cet ingrédient en quantité suffisante pour la logique actuelle
        # S'il l'avait, la pizza serait dispo globalement
        if Stock.objects.filter(restaurant=self.other_restaurant, ingredient=self.ingredient_tomate).exists():
            other_stock_tomate = Stock.objects.get(restaurant=self.other_restaurant, ingredient=self.ingredient_tomate)
            other_stock_tomate.quantite_en_stock = Decimal("0.05")
            other_stock_tomate.seuil_alerte = Decimal("0.2")
            other_stock_tomate.save()

        self.assertFalse(pizza_napolitaine.verifier_disponibilite())
        pizza_napolitaine.save()
        self.assertFalse(pizza_napolitaine.disponible)

        # Restaurer le stock pour d'autres tests
        self.stock_tomate.quantite_en_stock = Decimal("10.0")
        self.stock_tomate.seuil_alerte = Decimal("1.0")
        self.stock_tomate.save()
        if Stock.objects.filter(restaurant=self.other_restaurant, ingredient=self.ingredient_tomate).exists():
            other_stock_tomate = Stock.objects.get(restaurant=self.other_restaurant, ingredient=self.ingredient_tomate)
            other_stock_tomate.quantite_en_stock = Decimal("100.0")
            other_stock_tomate.save()


    def test_verifier_disponibilite_article_stock_inexistant_pour_un_ingredient(self):
        # Nouvel ingrédient sans stock nulle part
        ingredient_anchois = Ingredient.objects.create(nom="Anchois", unite="g", prix_unitaire=Decimal("0.10"))

        pizza_anchois = Article.objects.create(
            nom="Pizza Anchois",
            restaurant=self.restaurant,
            prix=Decimal("15.00"),
            categorie=self.categorie_plats
        )
        ArticleIngredient.objects.create(article=pizza_anchois, ingredient=self.ingredient_pate, quantite_necessaire=Decimal("1.0"))
        ArticleIngredient.objects.create(article=pizza_anchois, ingredient=ingredient_anchois, quantite_necessaire=Decimal("50.0")) # 50g

        # Aucun stock pour les anchois dans aucun restaurant
        self.assertFalse(pizza_anchois.verifier_disponibilite())
        pizza_anchois.save()
        self.assertFalse(pizza_anchois.disponible)

    def test_article_non_disponible_si_stock_uniquement_dans_un_autre_restaurant(self):
        """
        Avec la logique actuelle, la disponibilité est évaluée par restaurant :
        si seul un autre restaurant a le stock, l'article doit être indisponible
        pour le restaurant de l'article.
        """
        ingredient_special = Ingredient.objects.create(nom="Ingredient Special", unite="piece")
        Stock.objects.create(restaurant=self.other_restaurant, ingredient=ingredient_special, quantite_en_stock=Decimal("10"), seuil_alerte=1)
        # Pas de stock dans self.restaurant pour cet ingrédient

        plat_special = Article.objects.create(
            nom="Plat Special",
            restaurant=self.restaurant,
            prix=Decimal("25.00"),
            categorie=self.categorie_plats
        )
        ArticleIngredient.objects.create(article=plat_special, ingredient=ingredient_special, quantite_necessaire=Decimal("1"))

        # Logique attendue : indisponible pour self.restaurant
        self.assertFalse(plat_special.verifier_disponibilite())
        plat_special.save()
        self.assertFalse(plat_special.disponible)

    def test_article_non_disponible_si_aucun_restaurant_na_le_stock(self):
        ingredient_rare = Ingredient.objects.create(nom="Ingredient Rare", unite="piece")
        # Aucun stock nulle part pour cet ingrédient

        plat_rare = Article.objects.create(
            nom="Plat Rare",
            restaurant=self.restaurant,
            prix=Decimal("50.00"),
            categorie=self.categorie_plats
        )
        ArticleIngredient.objects.create(article=plat_rare, ingredient=ingredient_rare, quantite_necessaire=Decimal("1"))
        
        self.assertFalse(plat_rare.verifier_disponibilite())
        plat_rare.save()
        self.assertFalse(plat_rare.disponible)
        
    def test_disponibilite_article_sans_ingredient_est_toujours_vrai(self):
        boisson = Article.objects.create(
            nom="Eau Minérale",
            restaurant=self.restaurant,
            prix=Decimal("1.50"),
            categorie=self.categorie_boissons
        )
        # Aucun ingrédient associé
        self.assertTrue(boisson.verifier_disponibilite())
        boisson.save()
        self.assertTrue(boisson.disponible) 