from django.db import models
from django.db.models import Sum
from decimal import Decimal
from collections import defaultdict

from apps.shared.models import TauxTVA
from apps.restaurant.models import Restaurant

ETAT_CHOICES = [
    ('en_attente', 'En attente'),
    ('payee', 'Payée'),
    ('annulee', 'Annulée'),
]

class Facture(models.Model):
    numero = models.CharField(
        max_length=255,
        db_index=True,  # Index car utilisé dans les recherches et le tri
        help_text="Numéro unique de la facture"
    )
    date = models.DateField(
        db_index=True,  # Index car utilisé dans le tri et le filtrage par date
        help_text="Date d'émission de la facture"
    )
    montant_ht = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        db_index=True,  # Index car utilisé dans les calculs et le tri
        help_text="Montant hors taxes"
    )
    montant_ttc = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        db_index=True,  # Index car utilisé dans les calculs et le tri
        help_text="Montant toutes taxes comprises"
    )
    montant_tva = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        db_index=True,  # Index car utilisé dans les calculs
        help_text="Montant total de la TVA calculé"
    )
    restaurant = models.ForeignKey(
        Restaurant, 
        on_delete=models.CASCADE,
        db_index=True  # Index car utilisé dans les jointures
    )
    commande = models.ForeignKey(
        'commandes.CommandeHistoric',  # Référence string pour éviter l'importation circulaire
        on_delete=models.CASCADE,
        db_index=True  # Index car utilisé dans les jointures
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True  # Index car utilisé dans le tri chronologique
    )
    updated_at = models.DateTimeField(auto_now=True)
    etat = models.CharField(
        max_length=255, 
        choices=ETAT_CHOICES,
        db_index=True  # Index car utilisé dans le filtrage par état
    )

    class Meta:
        verbose_name = "T_HOLLY_PI_FACTURES"
        verbose_name_plural = "T_HOLLY_PI_FACTURES"
        db_table = "T_HOLLY_PI_FACTURES"
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['restaurant', 'date']),  # Index composite pour les requêtes par restaurant et date
            models.Index(fields=['restaurant', 'etat']),  # Index composite pour les requêtes par restaurant et état
            models.Index(fields=['date', 'etat']),  # Index composite pour les requêtes par date et état
            models.Index(fields=['numero', 'restaurant']),  # Index composite pour la recherche de factures
        ]

    def get_tva_par_taux(self):
        """
        Retourne un dictionnaire des montants de TVA groupés par taux.
        Exemple: {20.0: 100.00, 10.0: 50.00, 5.5: 25.00}
        """
        tva_par_taux = defaultdict(Decimal)
        for ligne in self.lignes.all():
            taux = ligne.taux_tva.taux
            montant_tva = ligne.calculer_tva()
            tva_par_taux[taux] += montant_tva
        return dict(tva_par_taux)

    def calculer_totaux(self):
        """Calcule les totaux HT, TVA et TTC de la facture."""
        lignes = self.lignes.all()
        
        # Calcul du montant HT
        self.montant_ht = sum(
            ligne.prix_unitaire_ht * ligne.quantite 
            for ligne in lignes
        )
        
        # Calcul du montant TVA total
        self.montant_tva = sum(
            ligne.calculer_tva() 
            for ligne in lignes
        )
        
        # Calcul du montant TTC
        self.montant_ttc = self.montant_ht + self.montant_tva

    def save(self, *args, **kwargs):
        # Ne pas calculer les totaux lors de la première sauvegarde
        # Les totaux seront calculés après l'ajout des lignes
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Facture {self.numero} - {self.restaurant.nom_restaurant} ({self.date})"

    @property
    def montant_paye(self):
        """Total des paiements enregistrés pour cette facture (calculé, non stocké)."""
        result = self.paiements.aggregate(total=Sum('montant'))['total']
        return result if result is not None else Decimal('0.00')

    @property
    def reste_a_payer(self):
        """Montant restant à payer (montant_ttc - montant_paye)."""
        return max(Decimal('0.00'), self.montant_ttc - self.montant_paye)

class MethodePaiement(models.Model):
    nom = models.CharField(
        max_length=255,
        db_index=True,  # Index car utilisé dans les recherches
        unique=True  # Contrainte d'unicité pour éviter les doublons
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "T_HOLLY_PI_METHODES_PAIEMENT"
        verbose_name_plural = "T_HOLLY_PI_METHODES_PAIEMENT"
        db_table = "T_HOLLY_PI_METHODES_PAIEMENT"
        ordering = ['nom']

    def __str__(self):
        return self.nom
    
class Paiement(models.Model):
    facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        related_name='paiements',
        db_index=True  # Index car utilisé dans les jointures
    )
    methode_paiement = models.ForeignKey(
        MethodePaiement, 
        on_delete=models.CASCADE,
        db_index=True  # Index car utilisé dans les jointures
    )
    montant = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        db_index=True  # Index car utilisé dans les calculs
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True  # Index car utilisé dans le tri chronologique
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "T_HOLLY_PI_PAIEMENTS"
        verbose_name_plural = "T_HOLLY_PI_PAIEMENTS"
        db_table = "T_HOLLY_PI_PAIEMENTS"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['facture', 'created_at']),  # Index composite pour l'historique des paiements
            models.Index(fields=['methode_paiement', 'created_at']),  # Index composite pour les statistiques de paiement
        ]

    def __str__(self):
        return f"{self.facture.numero} - {self.methode_paiement.nom}"
    
class LigneFacture(models.Model):
    facture = models.ForeignKey(
        Facture, 
        on_delete=models.CASCADE, 
        related_name='lignes',
        db_index=True  # Index car utilisé dans les jointures
    )
    produit = models.ForeignKey(
        'menu.Article',  # Référence string pour éviter l'importation circulaire
        on_delete=models.CASCADE,
        db_index=True  # Index car utilisé dans les jointures
    )
    quantite = models.IntegerField(
        db_index=True  # Index car utilisé dans les calculs
    )
    prix_unitaire_ht = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        db_index=True  # Index car utilisé dans les calculs
    )
    prix_unitaire_ttc = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        db_index=True  # Index car utilisé dans les calculs
    )
    taux_tva = models.ForeignKey(
        TauxTVA, 
        on_delete=models.PROTECT,
        db_index=True  # Index car utilisé dans les jointures et calculs
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "T_HOLLY_PI_LIGNES_FACTURE"
        verbose_name_plural = "T_HOLLY_PI_LIGNES_FACTURE"
        db_table = "T_HOLLY_PI_LIGNES_FACTURE"
        ordering = ['id']
        indexes = [
            models.Index(fields=['facture', 'produit']),  # Index composite pour les détails de facture
            models.Index(fields=['produit', 'taux_tva']),  # Index composite pour les calculs de TVA

        ]

    def calculer_tva(self):
        """Calcule le montant de la TVA pour cette ligne."""
        montant_ht = self.prix_unitaire_ht * self.quantite
        return montant_ht * (self.taux_tva.taux / Decimal('100'))

    def calculer_montant_ttc(self):
        """Calcule le montant TTC pour cette ligne."""
        montant_ht = self.prix_unitaire_ht * self.quantite
        return montant_ht * self.taux_tva.coefficient_tva

    def save(self, *args, **kwargs):
        if not self.pk:  # Nouvelle ligne
            if not self.taux_tva_id:
                # Utiliser le taux de TVA de l'article par défaut
                self.taux_tva = self.produit.taux_tva
            self.prix_unitaire_ttc = self.prix_unitaire_ht * self.taux_tva.coefficient_tva
        
        super().save(*args, **kwargs)
        
        # Mettre à jour les totaux de la facture
        if self.facture:
            self.facture.calculer_totaux()
            self.facture.save(update_fields=['montant_ht', 'montant_tva', 'montant_ttc'])

    def __str__(self):
        return f"{self.facture.numero} - {self.produit.nom}"