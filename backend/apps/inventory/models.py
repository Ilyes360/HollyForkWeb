from decimal import Decimal
from django.db import models
from django.core.cache import cache, caches
from apps.restaurant.models import Restaurant

class Ingredient(models.Model):
    """
    Table représentant un ingrédient utilisé dans les plats.
    """
    nom = models.CharField(max_length=100)
    unite = models.CharField(max_length=50)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        verbose_name = "T_HOLLY_PI_INGREDIENTS"
        verbose_name_plural = "T_HOLLY_PI_INGREDIENTS"
        db_table = "T_HOLLY_PI_INGREDIENTS"
        ordering = ['nom']

    def __str__(self):
        return self.nom

class Stock(models.Model):
    """
    Table représentant le stock d'ingrédients pour un restaurant.
    """
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, db_index=True)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, db_index=True)
    quantite_en_stock = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal(0))
    seuil_alerte = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal(0))
    cout_moyen_pondere = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal(0), help_text="Coût moyen pondéré de l'ingrédient en stock")

    class Meta:
        verbose_name = "T_HOLLY_PI_STOCKS"
        verbose_name_plural = "T_HOLLY_PI_STOCKS"
        db_table = "T_HOLLY_PI_STOCKS"
        ordering = ['ingredient__nom']
        unique_together = ('restaurant', 'ingredient')
        indexes = [
            # Index pour les requêtes de stock par restaurant
            models.Index(fields=['restaurant', 'ingredient']),
            # Index pour les vérifications de rupture
            models.Index(fields=['restaurant', 'quantite_en_stock', 'seuil_alerte']),
            # Index pour les calculs CMV
            models.Index(fields=['ingredient', 'cout_moyen_pondere']),
            # Index composite pour les requêtes optimisées
            models.Index(fields=['restaurant', 'ingredient', 'quantite_en_stock']),
        ]

    def __str__(self):
        return f"Stock de {self.ingredient.nom} pour {self.restaurant.nom_restaurant} ({self.quantite_en_stock} {self.ingredient.unite})"

    @classmethod
    def get_stocks_cache(cls, restaurant_id, ingredient_ids=None):
        """
        Récupère les stocks avec mise en cache pour optimiser les performances.
        
        Args:
            restaurant_id: ID du restaurant
            ingredient_ids: Liste des IDs d'ingrédients (optionnel)
        
        Returns:
            Dict {ingredient_id: stock_object}
        """
        # Utiliser le cache spécialisé pour les stocks si disponible,
        # sinon basculer sur le cache par défaut pour éviter les erreurs
        try:
            stocks_cache = caches['stocks']
        except Exception:
            stocks_cache = cache
        
        cache_key = f"restaurant_{restaurant_id}"
        
        if ingredient_ids:
            # Trier les IDs pour assurer la cohérence du cache
            sorted_ids = sorted(ingredient_ids)
            cache_key += f"_ingredients_{'_'.join(map(str, sorted_ids))}"
        
        # Vérifier le cache
        cached_stocks = stocks_cache.get(cache_key)
        if cached_stocks is not None:
            return cached_stocks
        
        # Requête optimisée avec select_related
        queryset = cls.objects.filter(restaurant_id=restaurant_id).select_related('ingredient', 'restaurant')
        
        if ingredient_ids:
            queryset = queryset.filter(ingredient_id__in=ingredient_ids)
        
        # Créer le dictionnaire avec des données sérialisables
        stocks_dict = {}
        for stock in queryset:
            stocks_dict[stock.ingredient_id] = {
                'id': stock.id,
                'ingredient_id': stock.ingredient_id,
                'restaurant_id': stock.restaurant_id,
                'quantite_en_stock': float(stock.quantite_en_stock),
                'seuil_alerte': float(stock.seuil_alerte),
                'cout_moyen_pondere': float(stock.cout_moyen_pondere),
                'ingredient_nom': stock.ingredient.nom,
                'ingredient_unite': stock.ingredient.unite,
                'ingredient_prix_unitaire': float(stock.ingredient.prix_unitaire) if stock.ingredient.prix_unitaire else 0.0,
            }
        
        # Mise en cache avec TTL du cache stocks (5 minutes par défaut)
        stocks_cache.set(cache_key, stocks_dict)
        
        return stocks_dict

    def est_en_rupture(self):
        return self.quantite_en_stock <= self.seuil_alerte

    def mettre_a_jour_cout_moyen_pondere(self, quantite_ajoutee: Decimal, prix_achat_total_lot: Decimal):
        """Met à jour le coût moyen pondéré après un réapprovisionnement."""
        if not isinstance(quantite_ajoutee, Decimal):
            quantite_ajoutee = Decimal(str(quantite_ajoutee))
        if not isinstance(prix_achat_total_lot, Decimal):
            prix_achat_total_lot = Decimal(str(prix_achat_total_lot))

        if quantite_ajoutee <= 0: # Pas d'ajout, pas de changement de coût par cette méthode
            return

        prix_achat_unitaire = prix_achat_total_lot / quantite_ajoutee
        
        ancienne_valeur_stock = self.quantite_en_stock * self.cout_moyen_pondere
        valeur_ajout = quantite_ajoutee * prix_achat_unitaire # Valeur du lot ajouté
        nouvelle_quantite_totale = self.quantite_en_stock + quantite_ajoutee

        if nouvelle_quantite_totale > 0:
            self.cout_moyen_pondere = (ancienne_valeur_stock + valeur_ajout) / nouvelle_quantite_totale
        else: # Devrait être couvert par quantite_ajoutee > 0 mais par sécurité
             self.cout_moyen_pondere = prix_achat_unitaire
        # La sauvegarde de self (Stock) sera faite après cette méthode dans le save de Reapprovisionnement

    def save(self, *args, **kwargs):
        """Invalide le cache lors de la sauvegarde."""
        super().save(*args, **kwargs)
        try:
            stocks_cache = caches['stocks']
        except Exception:
            return
        # Invalider par pattern uniquement si backend Redis (évite erreur avec LocMem)
        try:
            if "Redis" in type(stocks_cache).__name__:
                from django_redis import get_redis_connection
                redis_conn = get_redis_connection("stocks")
                pattern = f"holly_pi_stocks:1:restaurant_{self.restaurant_id}*"
                keys = redis_conn.keys(pattern)
                if keys:
                    redis_conn.delete(*keys)
            else:
                stocks_cache.delete(f"restaurant_{self.restaurant_id}")
        except Exception:
            try:
                stocks_cache.delete(f"restaurant_{self.restaurant_id}")
            except Exception:
                pass
        try:
            cache.delete(f"stocks_restaurant_{self.restaurant_id}")
        except Exception:
            pass

class Reapprovisionnement(models.Model):
    """
    Table pour enregistrer les réapprovisionnements de stock.
    """
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, db_index=True)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, db_index=True)
    quantite_ajoutee = models.DecimalField(max_digits=10, decimal_places=2)
    date_ajout = models.DateTimeField(auto_now_add=True)
    prix_achat = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        verbose_name = "T_HOLLY_PI_REAPPROVISIONNEMENTS"
        verbose_name_plural = "T_HOLLY_PI_REAPPROVISIONNEMENTS"
        db_table = "T_HOLLY_PI_REAPPROVISIONNEMENTS"
        ordering = ['-date_ajout']

    def __str__(self):
        return f"Réapprovisionnement de {self.quantite_ajoutee} {self.ingredient.unite} de {self.ingredient.nom} pour {self.restaurant.nom_restaurant}"

    def save(self, *args, **kwargs):
        # Sauvegarde initiale pour s'assurer que l'objet existe si c'est une création
        # et pour permettre l'accès aux champs comme self.pk si nécessaire plus tard.
        # Cependant, la logique de mise à jour du stock doit se faire après.
        # super().save(*args, **kwargs) # Déplacé après la mise à jour du stock pour atomicité

        stock, created = Stock.objects.get_or_create(
            restaurant=self.restaurant,
            ingredient=self.ingredient,
            defaults={
                'quantite_en_stock': Decimal(0),
                'seuil_alerte': Decimal(0),
                'cout_moyen_pondere': Decimal(0)
            }
        )

        # Mettre à jour le CMP AVANT de modifier la quantité en stock pour le calcul correct
        if self.prix_achat is not None and self.quantite_ajoutee > 0:
            stock.mettre_a_jour_cout_moyen_pondere(self.quantite_ajoutee, self.prix_achat)
            # Le prix_achat ici est supposé être le coût total du lot.
        
        stock.quantite_en_stock += self.quantite_ajoutee
        stock.save() # Sauvegarde l'objet Stock avec la nouvelle quantité et le nouveau CMP

        super().save(*args, **kwargs) # Sauvegarde l'objet Reapprovisionnement lui-même
