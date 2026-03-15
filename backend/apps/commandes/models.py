from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal

from apps.salles.models import Table
from apps.inventory.models import Stock
from apps.menu.models import Article, ArticleIngredient
from apps.restaurant.models import Restaurant
from apps.staff.models import Employe

# Create your models here.
class CommandeManager(models.Manager):
    """Manager personnalisé pour optimiser les requêtes de commandes."""
    
    def get_optimized_queryset(self):
        """Retourne un queryset optimisé pour éviter les requêtes N+1."""
        return self.select_related(
            'restaurant',
            'created_by',
            'created_by__user',
            'table',
            'table__salle',
            'table__salle__restaurant'
        ).prefetch_related(
            models.Prefetch(
                'lignes',
                queryset=LigneCommande.objects.select_related(
                    'article',
                    'article__categorie',
                    'article__taux_tva'
                ).prefetch_related(
                    models.Prefetch(
                        'article__ingredients',
                        queryset=ArticleIngredient.objects.select_related('ingredient')
                    )
                )
            )
        )
    
    def with_stock_data(self, restaurant_id=None):
        """Queryset optimisé incluant les données de stock."""
        queryset = self.get_optimized_queryset()
        
        if restaurant_id:
            queryset = queryset.prefetch_related(
                models.Prefetch(
                    'lignes__article__ingredients__ingredient__stock_set',
                    queryset=Stock.objects.filter(restaurant_id=restaurant_id),
                    to_attr='restaurant_stocks'
                )
            )
        
        return queryset
    
    def by_restaurant(self, restaurant_id, statut=None, limit_days=None):
        """
        Récupère les commandes d'un restaurant avec optimisations.
        
        Args:
            restaurant_id: ID du restaurant
            statut: Statut des commandes (optionnel)
            limit_days: Limiter aux X derniers jours (optionnel)
        """
        queryset = self.with_stock_data(restaurant_id).filter(restaurant_id=restaurant_id)
        
        if statut:
            queryset = queryset.filter(statut=statut)
            
        if limit_days:
            from django.utils import timezone
            from datetime import timedelta
            date_limite = timezone.now() - timedelta(days=limit_days)
            queryset = queryset.filter(created_at__gte=date_limite)
        
        return queryset.order_by('-created_at')
    
    def en_cours_par_restaurant(self, restaurant_id):
        """Récupère les commandes en cours pour un restaurant."""
        return self.by_restaurant(restaurant_id, statut='EN_COURS')
    
    def bulk_calculate_totals(self, commande_ids):
        """
        Calcule les totaux pour plusieurs commandes en lot.
        Optimisé pour éviter les requêtes N+1.
        """
        commandes = self.filter(id__in=commande_ids).prefetch_related(
            'lignes',
            'lignes__article'
        )
        
        updates = []
        for commande in commandes:
            commande.calculer_montant_et_cmv(use_cache=True)
            updates.append(commande)
        
        # Mise à jour en lot
        self.bulk_update(
            updates,
            ['montant', 'nb_articles', 'cout_total_marchandises_vendues'],
            batch_size=100
        )

class Commande(models.Model):
    """
    Table représentant une commande prise en restaurant.
    Auteur : Benjamin DUSUNCELI CETIN
    Créé : 19/03/2025 15:00
    Version : 1.0
    """
    STATUT_CHOICES = (
        ('EN_COURS', 'En cours'),
        ('VALIDEE', 'Validée'),
        ('ANNULEE', 'Annulée'),
    )
    STATUT_CUISINE_CHOICES = (
        ('PENDING', 'En attente'),
        ('IN_PROGRESS', 'En préparation'),
        ('READY', 'Prête'),
    )
    PRIORITE_CHOICES = (
        ('LOW', 'Basse'),
        ('NORMAL', 'Normale'),
        ('HIGH', 'Haute'),
        ('URGENT', 'Urgente'),
    )
    id = models.AutoField(primary_key=True)
    nb_articles = models.IntegerField(default=0, db_index=True)
    montant = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], db_index=True)
    created_at = models.DateTimeField(auto_now_add=False, null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(Employe, on_delete=models.CASCADE, db_index=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, db_index=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_COURS', db_index=True)
    statut_cuisine = models.CharField(max_length=20, choices=STATUT_CUISINE_CHOICES, default='PENDING', db_index=True, help_text="Statut de la commande en cuisine")
    priorite = models.CharField(max_length=10, choices=PRIORITE_CHOICES, default='NORMAL', db_index=True, help_text="Priorité de la commande")
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    cout_total_marchandises_vendues = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="CMV total pour cette commande")

    # Manager personnalisé
    objects = CommandeManager()

    class Meta:
        verbose_name = "T_HOLLY_PI_COMMANDES"
        verbose_name_plural = "T_HOLLY_PI_COMMANDES"
        db_table = "T_HOLLY_PI_COMMANDES"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['restaurant', 'created_at']),
            models.Index(fields=['restaurant', 'statut']),
            models.Index(fields=['created_by', 'created_at']),
            # Nouvel index pour optimiser les requêtes fréquentes
            models.Index(fields=['restaurant', 'statut', 'created_at']),
            models.Index(fields=['statut', 'created_at']),
            # Index pour la cuisine
            models.Index(fields=['restaurant', 'statut_cuisine', 'priorite']),
            models.Index(fields=['statut_cuisine', 'priorite', 'created_at']),
        ]

    def __str__(self):
        return f"Commande {self.id} - {self.restaurant.nom_restaurant} ({self.created_at})"

    def calculer_montant_et_cmv(self, use_cache=True):
        """
        Calcule le montant total, le nombre d'articles et le CMV total de la commande sans sauvegarder.
        
        Args:
            use_cache: Utiliser le cache pour les stocks (défaut: True)
        """
        if self.pk:  # Vérifiez si l'objet a une clé primaire
            lignes = self.lignes.all()
            
            # Calculs optimisés en une seule itération
            montant_total = Decimal(0)
            nb_articles_total = 0
            cmv_total = Decimal(0)
            
            # Récupérer tous les stocks nécessaires en une fois si use_cache
            if use_cache and lignes:
                all_ingredient_ids = set()
                for ligne in lignes:
                    for ai in ligne.article.ingredients.all():
                        all_ingredient_ids.add(ai.ingredient_id)
                
                stocks_cache = Stock.get_stocks_cache(
                    restaurant_id=self.restaurant_id,
                    ingredient_ids=list(all_ingredient_ids)
                )
            else:
                stocks_cache = None
            
            # Calcul en une seule boucle
            for ligne in lignes:
                montant_ligne = ligne.prix_unitaire * ligne.quantite
                montant_total += montant_ligne
                nb_articles_total += ligne.quantite
                
                # Recalculer le CMV avec le cache si nécessaire
                if stocks_cache is not None:
                    ligne.cout_marchandise_vendue = ligne.calculer_cmv_ligne(stocks_cache)
                
                cmv_total += ligne.cout_marchandise_vendue or Decimal(0)
            
            self.montant = montant_total
            self.nb_articles = nb_articles_total
            self.cout_total_marchandises_vendues = cmv_total
        else:
            # L'objet n'a pas encore de clé primaire, définissez des valeurs par défaut
            self.montant = Decimal('0')
            self.nb_articles = 0
            self.cout_total_marchandises_vendues = Decimal('0')

    def annuler(self):
        """Restaure les stocks des ingrédients pour toutes les lignes de la commande et annule le CMV."""
        if self.statut == 'ANNULEE':
            return
        ligne:LigneCommande
        for ligne in self.lignes.all():
            article_ingredient:ArticleIngredient
            for article_ingredient in ligne.article.ingredients.all():
                try:
                    stock = Stock.objects.get(restaurant=self.restaurant, ingredient=article_ingredient.ingredient)
                    quantite_restauree = article_ingredient.quantite_necessaire * ligne.quantite
                    stock.quantite_en_stock += quantite_restauree
                    stock.save()
                except Stock.DoesNotExist:
                    # Le stock n'existe pas pour cet ingrédient, ignorer
                    pass
            # Optionnel: Annuler le CMV sur la ligne si besoin de le tracer finement
            # ligne.cout_marchandise_vendue = Decimal(0)
            # ligne.save() # Attention aux signaux ou appels récursifs de save de commande

        self.statut = 'ANNULEE'
        self.cout_total_marchandises_vendues = Decimal(0) # Annuler le CMV sur la commande
        # self.save() # L'appelant de annuler() devrait sauvegarder
        self.save(update_fields=['statut', 'cout_total_marchandises_vendues', 'montant', 'nb_articles']) # Mettre à jour les champs modifiés

    def save(self, *args, **kwargs):
        # Si une table est spécifiée, associer automatiquement le restaurant de la salle
        if self.table and not self.restaurant_id:
            self.restaurant = self.table.salle.restaurant
        
        # Définir created_at à la date actuelle uniquement si non défini
        if not self.created_at:
            self.created_at = timezone.now()
            
        # Gérer l'état d'occupation de la table
        if self.pk:  # Si la commande existe déjà
            old_instance = Commande.objects.get(pk=self.pk)
            # Si la table a changé
            if old_instance.table != self.table:
                # Libérer l'ancienne table si elle existe
                if old_instance.table:
                    old_instance.table.is_occupied = False
                    old_instance.table.save(update_fields=['is_occupied'])
                # Occuper la nouvelle table si elle existe
                if self.table:
                    self.table.is_occupied = True
                    self.table.save(update_fields=['is_occupied'])
            # Si le statut a changé pour ANNULEE, libérer la table
            elif old_instance.statut != self.statut and self.statut == 'ANNULEE' and self.table:
                self.table.is_occupied = False
                self.table.save(update_fields=['is_occupied'])
        else:  # Nouvelle commande
            if self.table:
                self.table.is_occupied = True
                self.table.save(update_fields=['is_occupied'])
            
        # Update montant and nb_articles before saving (but not for ANNULEE status)
        if self.statut != 'ANNULEE' and (kwargs.get('update_fields') is None or \
                ('montant' in kwargs.get('update_fields') or 'nb_articles' in kwargs.get('update_fields') or 'cout_total_marchandises_vendues' in kwargs.get('update_fields'))):
            self.calculer_montant_et_cmv()

        # Vérifier si le statut a changé pour VALIDEE ou ANNULEE
        if self.pk:  # Si la commande existe déjà
            old_instance = Commande.objects.get(pk=self.pk)
            if old_instance.statut != self.statut and self.statut in ['VALIDEE', 'ANNULEE']:
                # Créer une copie dans l'historique
                historic_commande = CommandeHistoric.objects.create(
                    id=self.id,  # Conserver le même ID
                    nb_articles=self.nb_articles,
                    montant=self.montant,
                    created_at=self.created_at,
                    created_by=self.created_by,
                    restaurant=self.restaurant,
                    statut=self.statut,
                    table=self.table,
                    cout_total_marchandises_vendues=self.cout_total_marchandises_vendues
                )

                # Copier toutes les lignes de commande
                ligne:LigneCommande
                for ligne in self.lignes.all():
                    LigneCommandeHistoric.objects.create(
                        commande=historic_commande,
                        article=ligne.article,
                        quantite=ligne.quantite,
                        prix_unitaire=ligne.prix_unitaire,
                        cout_marchandise_vendue=ligne.cout_marchandise_vendue
                    )

                # Supprimer la commande originale et ses lignes
                super().delete()
                return historic_commande

        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Libère la table lors de la suppression de la commande."""
        if self.table:
            self.table.is_occupied = False
            self.table.save(update_fields=['is_occupied'])
        super().delete(*args, **kwargs)

class LigneCommande(models.Model):
    """
    Table représentant une ligne d'une commande (article + quantité).
    """
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes', db_index=True)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, db_index=True)
    quantite = models.PositiveIntegerField(default=1, db_index=True)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    cout_marchandise_vendue = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="CMV pour cette ligne de commande")
    en_attente_service = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Indique si la ligne est mise en attente (ex: dessert commandé à l'entrée)."
    )

    class Meta:
        verbose_name = "T_HOLLY_PI_LIGNE_COMMANDE"
        verbose_name_plural = "T_HOLLY_PI_LIGNE_COMMANDE"
        db_table = "T_HOLLY_PI_LIGNE_COMMANDE"
        indexes = [
            models.Index(fields=['commande', 'article']),
            models.Index(fields=['article', 'prix_unitaire']),
            # Nouveaux index pour optimiser les requêtes fréquentes
            models.Index(fields=['commande', 'quantite']),  # Pour les calculs de totaux
            models.Index(fields=['article', 'quantite', 'prix_unitaire']),  # Pour les analyses
            models.Index(fields=['commande', 'cout_marchandise_vendue']),  # Pour les calculs CMV
            models.Index(fields=['commande', 'en_attente_service']),  # Pour filtrer les lignes en attente
        ]

    def __str__(self):
        return f"{self.quantite} x {self.article.nom} (Commande {self.commande.id})"
    
    def calculer_cmv_ligne(self, stocks_cache=None):
        """
        Calcule le CMV pour cette ligne de commande en utilisant le cout_moyen_pondere du stock.
        
        Args:
            stocks_cache: Dictionnaire optionnel {ingredient_id: stock} pour éviter les requêtes DB
        """
        if not self.article_id or not self.commande_id:
            return Decimal(0)

        cmv_total_pour_ligne = Decimal(0)
        
        if not hasattr(self, '_commande_cache') and not self.commande_id:
            return Decimal(0)
        
        restaurant_de_la_commande = self.commande.restaurant

        # Utiliser le cache de stocks si fourni, sinon requête optimisée
        if stocks_cache is None:
            # Requête optimisée : récupérer tous les stocks nécessaires en une fois
            ingredient_ids = [ai.ingredient_id for ai in self.article.ingredients.all()]
            stocks = Stock.objects.filter(
                restaurant=restaurant_de_la_commande,
                ingredient_id__in=ingredient_ids
            ).select_related('ingredient')
            stocks_cache = {stock.ingredient_id: stock for stock in stocks}

        for article_ingredient in self.article.ingredients.all():
            stock_data = stocks_cache.get(article_ingredient.ingredient_id)
            
            if stock_data:
                # Si c'est un dictionnaire (données du cache optimisé)
                if isinstance(stock_data, dict):
                    cout_ingredient_unitaire = Decimal(str(stock_data['cout_moyen_pondere']))
                else:
                    # Si c'est un objet Stock (ancien cache)
                    cout_ingredient_unitaire = stock_data.cout_moyen_pondere
            else:
                # Fallback: utiliser le prix_unitaire de l'ingrédient
                cout_ingredient_unitaire = article_ingredient.ingredient.prix_unitaire 
                if cout_ingredient_unitaire is None:
                    cout_ingredient_unitaire = Decimal(0)
                # TODO: Logguer un avertissement ici
            
            cmv_pour_cet_ingredient_dans_article = article_ingredient.quantite_necessaire * cout_ingredient_unitaire
            cmv_total_pour_ligne += cmv_pour_cet_ingredient_dans_article
        
        return cmv_total_pour_ligne * self.quantite

    def save(self, *args, **kwargs):
        # Enregistrer le prix unitaire au moment de la création de la ligne
        if not self.pk or not self.prix_unitaire:  # Si nouvelle ligne ou prix non setté
            # Forcer le chargement de l'article si nécessaire
            if hasattr(self.article, '_meta') and not self.article.pk:
                self.article.refresh_from_db()
            prix_article = self.article.prix
            if prix_article is None:
                raise ValueError(f"L'article {self.article.nom} n'a pas de prix défini")
            self.prix_unitaire = prix_article

        # Calculer et stocker le CMV pour cette ligne
        self.cout_marchandise_vendue = self.calculer_cmv_ligne()

        super().save(*args, **kwargs)  # Sauvegarder la ligne d'abord pour avoir un PK si nouvelle

        # Mettre à jour la commande parente (montant, nb_articles, et CMV total)
        # Assurez-vous que la commande est sauvegardée après la mise à jour de ses lignes.
        if hasattr(self.commande, 'calculer_montant_et_cmv'):
            self.commande.calculer_montant_et_cmv()  # Calcule les totaux
            self.commande.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])  # Sauvegarde les champs spécifiques

    def delete(self, *args, **kwargs):
        """
        Gère la suppression d'une ligne de commande en :
        1. Restaurant les stocks
        2. Recalculant le montant de la commande
        """
        if self.commande and self.commande.statut != 'ANNULEE':
            # Sauvegarder une référence à la commande avant la suppression
            commande = self.commande
            
            # Restaurer les stocks pour cette ligne
            restaurant_de_la_commande = commande.restaurant
            for article_ingredient in self.article.ingredients.all():
                try:
                    stock = Stock.objects.get(restaurant=restaurant_de_la_commande, ingredient=article_ingredient.ingredient)
                    quantite_restauree = article_ingredient.quantite_necessaire * self.quantite
                    stock.quantite_en_stock += quantite_restauree
                    stock.save()
                except Stock.DoesNotExist:
                    pass  # Gérer le cas où le stock n'existe pas
            
            # Supprimer la ligne
            super().delete(*args, **kwargs)
            
            # Recalculer le montant de la commande après la suppression
            commande.calculer_montant_et_cmv()
            commande.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])
        else:
            # Si pas de commande ou commande annulée, supprimer simplement la ligne
            super().delete(*args, **kwargs)

class CommandeHistoric(models.Model):
    """
    Table historique stockant les commandes validées ou annulées.
    Copie exacte de la table Commande pour l'archivage.
    """
    id = models.AutoField(primary_key=True)
    nb_articles = models.IntegerField(default=0, db_index=True)
    montant = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], db_index=True)
    created_at = models.DateTimeField(auto_now_add=False, null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(Employe, on_delete=models.PROTECT, db_index=True)  # PROTECT pour conserver l'historique
    restaurant = models.ForeignKey(Restaurant, on_delete=models.PROTECT, db_index=True)  # PROTECT pour conserver l'historique
    statut = models.CharField(max_length=20, choices=Commande.STATUT_CHOICES, db_index=True)
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    cout_total_marchandises_vendues = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    archived_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Date d'archivage

    class Meta:
        verbose_name = "T_HOLLY_PI_COMMANDES_HISTORIC"
        verbose_name_plural = "T_HOLLY_PI_COMMANDES_HISTORIC"
        db_table = "T_HOLLY_PI_COMMANDES_HISTORIC"
        indexes = [
            models.Index(fields=['restaurant', 'created_at']),
            models.Index(fields=['restaurant', 'statut']),
            models.Index(fields=['created_by', 'created_at']),
            models.Index(fields=['archived_at']),
        ]

    def __str__(self):
        return f"Commande Historique {self.id} - {self.restaurant.nom_restaurant} ({self.created_at})"

class LigneCommandeHistoric(models.Model):
    """
    Table historique stockant les lignes de commandes archivées.
    """
    commande = models.ForeignKey(CommandeHistoric, on_delete=models.CASCADE, related_name='lignes', db_index=True)
    article = models.ForeignKey(Article, on_delete=models.PROTECT, db_index=True)  # PROTECT pour conserver l'historique
    quantite = models.PositiveIntegerField(default=1, db_index=True)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    cout_marchandise_vendue = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def save(self, *args, **kwargs):
        # Enregistrer le prix unitaire au moment de la création de la ligne historique
        if not self.pk and not self.prix_unitaire:  # Si nouvelle ligne et prix non setté
            prix_article = self.article.prix
            if prix_article is None:
                raise ValueError(f"L'article {self.article.nom} n'a pas de prix défini")
            self.prix_unitaire = prix_article

        # Calculer et stocker le CMV pour cette ligne (même logique que LigneCommande)
        if not self.cout_marchandise_vendue:
            # Utiliser la même logique de calcul que LigneCommande
            if hasattr(self, 'calculer_cmv_ligne'):
                self.cout_marchandise_vendue = self.calculer_cmv_ligne()
            else:
                # Logique simplifiée pour l'historique
                self.cout_marchandise_vendue = Decimal(0)

        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "T_HOLLY_PI_LIGNE_COMMANDE_HISTORIC"
        verbose_name_plural = "T_HOLLY_PI_LIGNE_COMMANDE_HISTORIC"
        db_table = "T_HOLLY_PI_LIGNE_COMMANDE_HISTORIC"
        indexes = [
            models.Index(fields=['commande', 'article']),
            models.Index(fields=['article', 'prix_unitaire']),
        ]

    def __str__(self):
        return f"{self.quantite} x {self.article.nom} (Commande Historique {self.commande.id})"
