# Create your models here.
from decimal import Decimal
from django.db import models

from apps.shared.models import TauxTVA
from apps.inventory.models import Ingredient, Stock
from apps.restaurant.models import Restaurant

class CategorieArticle(models.Model):
    """
    Table représentant une catégorie d'article (entrée, plat, dessert, boisson, etc.).
    """
    nom = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Nom de la catégorie (ex: Entrée, Plat, Dessert, Boisson)"
    )
    ordre_affichage = models.PositiveIntegerField(
        default=0,
        db_index=True,
        help_text="Ordre d'affichage de la catégorie dans le menu"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Description optionnelle de la catégorie"
    )

    class Meta:
        verbose_name = "T_HOLLY_PI_CATEGORIES_ARTICLE"
        verbose_name_plural = "T_HOLLY_PI_CATEGORIES_ARTICLE"
        db_table = "T_HOLLY_PI_CATEGORIES_ARTICLE"
        ordering = ['ordre_affichage', 'nom']

    def __str__(self):
        return self.nom

class Article(models.Model):
    """
    Table représentant un article (plat, boisson, etc.) dans le menu.
    """
    nom = models.CharField(
        max_length=100, 
        db_index=True,  # Index car utilisé dans les recherches et le tri
        help_text="Nom de l'article"
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        db_index=True,
        help_text="Restaurant associé à l'article",
        null=True,
        blank=True,
    )
    categorie = models.ForeignKey(
        CategorieArticle,
        on_delete=models.PROTECT,  # PROTECT pour éviter la suppression accidentelle d'une catégorie
        db_index=True,
        help_text="Catégorie de l'article"
    )
    prix = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        db_index=True,  # Index car utilisé dans les calculs et le tri
        help_text="Prix HT de l'article"
    )
    description = models.TextField(blank=True, null=True)
    disponible = models.BooleanField(
        default=True, 
        db_index=True,  # Index car utilisé pour filtrer les articles disponibles
        help_text="Indique si l'article est disponible à la vente"
    )
    taux_tva = models.ForeignKey(
        TauxTVA,
        on_delete=models.PROTECT,
        default=TauxTVA.get_tva_par_defaut,
        db_index=True,  # Index car utilisé dans les jointures et calculs
        help_text="Taux de TVA applicable par défaut pour cet article"
    )

    class Meta:
        verbose_name = "T_HOLLY_PI_ARTICLES"
        verbose_name_plural = "T_HOLLY_PI_ARTICLES"
        db_table = "T_HOLLY_PI_ARTICLES"
        indexes = [
            models.Index(fields=['restaurant', 'categorie', 'disponible']),  # Filtrer par restaurant et catégorie
            models.Index(fields=['restaurant', 'disponible', 'prix']),  # Requêtes de menu par restaurant
            models.Index(fields=['restaurant', 'taux_tva', 'disponible']),  # Calculs de TVA par restaurant
            models.Index(fields=['restaurant', 'nom', 'disponible']),  # Recherche d'articles disponibles par restaurant
        ]
        ordering = ['restaurant__nom_restaurant', 'categorie__ordre_affichage', 'categorie__nom', 'nom']

    def __str__(self):
        return self.nom
    
    @property
    def prix_ttc(self):
        """Retourne le prix TTC de l'article."""
        return self.prix * self.taux_tva.coefficient_tva

    def verifier_disponibilite(self, restaurant_id=None):
        """
        Vérifie si l'article est disponible en fonction des stocks d'ingrédients.
        
        Args:
            restaurant_id: ID du restaurant spécifique (optionnel, sinon vérifie tous)
        """
        if not self.pk:
            return True

        # Par défaut, utiliser le restaurant de l'article s'il est défini
        if restaurant_id is None and getattr(self, "restaurant_id", None):
            restaurant_id = self.restaurant_id

        # Optimisation : requête unique pour tous les ingrédients
        ingredient_ids = [ai.ingredient_id for ai in self.ingredients.all()]

        if restaurant_id:
            # Vérification pour un restaurant spécifique (plus efficace)
            stocks = Stock.objects.filter(
                restaurant_id=restaurant_id,
                ingredient_id__in=ingredient_ids
            ).select_related('ingredient')
            
            stocks_dict = {stock.ingredient_id: stock for stock in stocks}
            
            for article_ingredient in self.ingredients.all():
                stock = stocks_dict.get(article_ingredient.ingredient_id)
                if not stock or stock.est_en_rupture():
                    return False
        else:
            # Vérification globale (moins efficace mais nécessaire parfois)
            stocks_disponibles = Stock.objects.filter(
                ingredient_id__in=ingredient_ids
            ).exclude(
                quantite_en_stock__lte=models.F('seuil_alerte')
            ).values_list('ingredient_id', flat=True).distinct()
            
            # Vérifier que tous les ingrédients ont au moins un stock disponible
            for ingredient_id in ingredient_ids:
                if ingredient_id not in stocks_disponibles:
                    return False
                    
        return True

    def save(self, *args, **kwargs):
        if not self.pk and not self.taux_tva_id:  # Nouvel article sans taux TVA spécifié
            # Par défaut, utiliser le taux normal (20%)
            self.taux_tva = TauxTVA.objects.filter(taux=Decimal('20.00')).first()
        self.disponible = self.verifier_disponibilite()
        super().save(*args, **kwargs)

class ArticleIngredient(models.Model):
    """
    Table reliant un article à ses ingrédients avec la quantité nécessaire.
    """
    article = models.ForeignKey(
        Article, 
        on_delete=models.CASCADE, 
        related_name='ingredients',
        db_index=True  # Index car utilisé dans les jointures
    )
    ingredient = models.ForeignKey(
        Ingredient, 
        on_delete=models.CASCADE,
        db_index=True  # Index car utilisé dans les jointures
    )
    quantite_necessaire = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        db_index=True  # Index car utilisé dans les calculs de stock
    )

    class Meta:
        verbose_name = "T_HOLLY_PI_ARTICLE_INGREDIENT"
        verbose_name_plural = "T_HOLLY_PI_ARTICLE_INGREDIENT"
        db_table = "T_HOLLY_PI_ARTICLE_INGREDIENT"
        indexes = [
            models.Index(fields=['article', 'ingredient']),  # Index composite pour les jointures
            models.Index(fields=['ingredient', 'quantite_necessaire']),  # Index composite pour les calculs de stock
        ]
        unique_together = ('article', 'ingredient')  # Contrainte d'unicité pour éviter les doublons

    def __str__(self):
        return f"{float(self.quantite_necessaire):.2f} {self.ingredient.unite} de {self.ingredient.nom} pour {self.article.nom}"
