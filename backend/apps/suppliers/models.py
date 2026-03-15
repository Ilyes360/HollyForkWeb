from django.db import models
from apps.restaurant.models import Restaurant


class Fournisseur(models.Model):
    """
    Modèle pour les fournisseurs.
    """
    id = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=200, db_index=True)
    contact_nom = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    ville = models.CharField(max_length=100, blank=True, null=True)
    code_postal = models.CharField(max_length=10, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    actif = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Fournisseur"
        verbose_name_plural = "Fournisseurs"
        db_table = "T_HOLLY_PI_FOURNISSEURS"
        ordering = ['nom']

    def __str__(self):
        return self.nom


class JourLivraison(models.Model):
    """
    Jours de livraison pour un fournisseur.
    """
    JOURS_SEMAINE = [
        ('MONDAY', 'Lundi'),
        ('TUESDAY', 'Mardi'),
        ('WEDNESDAY', 'Mercredi'),
        ('THURSDAY', 'Jeudi'),
        ('FRIDAY', 'Vendredi'),
        ('SATURDAY', 'Samedi'),
        ('SUNDAY', 'Dimanche'),
    ]
    
    id = models.AutoField(primary_key=True)
    fournisseur = models.ForeignKey(Fournisseur, on_delete=models.CASCADE, related_name='jours_livraison', db_index=True)
    jour = models.CharField(max_length=10, choices=JOURS_SEMAINE, db_index=True)
    heure_livraison = models.TimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Jour de livraison"
        verbose_name_plural = "Jours de livraison"
        db_table = "T_HOLLY_PI_JOURS_LIVRAISON"
        unique_together = ('fournisseur', 'jour')
        ordering = ['jour']

    def __str__(self):
        return f"{self.fournisseur.nom} - {self.get_jour_display()}"


class CommandeFournisseur(models.Model):
    """
    Commandes passées aux fournisseurs.
    """
    STATUT_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('SENT', 'Envoyée'),
        ('CONFIRMED', 'Confirmée'),
        ('DELIVERED', 'Livrée'),
        ('CANCELLED', 'Annulée'),
    ]
    
    id = models.AutoField(primary_key=True)
    fournisseur = models.ForeignKey(Fournisseur, on_delete=models.CASCADE, related_name='commandes', db_index=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, db_index=True)
    numero_commande = models.CharField(max_length=50, unique=True, db_index=True)
    date_commande = models.DateField(db_index=True)
    date_livraison_prevue = models.DateField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='DRAFT', db_index=True)
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Commande fournisseur"
        verbose_name_plural = "Commandes fournisseurs"
        db_table = "T_HOLLY_PI_COMMANDES_FOURNISSEURS"
        ordering = ['-date_commande']
        indexes = [
            models.Index(fields=['restaurant', 'date_commande']),
            models.Index(fields=['fournisseur', 'statut']),
        ]

    def __str__(self):
        return f"{self.numero_commande} - {self.fournisseur.nom}"

