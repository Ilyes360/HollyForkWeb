"""
Modèles pour la gestion du personnel dans Holly Pi.
"""

from decimal import Decimal
from django.conf import settings
from django.db import models
from django.core.validators import RegexValidator, MinValueValidator
from django.utils import timezone

from apps.restaurant.models import Restaurant


class TypeEmploye(models.Model):
    """
    Modèle pour les types d'employés (ex. Manager, Serveur, Cuisinier).
    
    Auteur : Benjamin DUSUNCELI CETIN
    Créé : 24/04/2025
    Version : 1.0
    """
    id = models.AutoField(primary_key=True)
    nom_type = models.CharField(
        max_length=50,
        unique=True,
        validators=[RegexValidator(r'^[a-zA-ZÀ-ÿ\s]+$', 'Le nom du type doit contenir uniquement des lettres et des espaces.')]
    )
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Type d'employé"
        verbose_name_plural = "Types d'employés"
        db_table = "T_HOLLY_PI_TYPE_EMPLOYES"
        ordering = ['nom_type']

    def __str__(self):
        return self.nom_type


class Employe(models.Model):
    """
    Modèle pour les employés d'un restaurant.
    
    Auteur : Benjamin DUSUNCELI CETIN
    Modifié : 24/04/2025
    Version : 1.2
    """
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employe',
        null=True,
        blank=True,
        db_index=True
    )
    nom = models.CharField(
        max_length=100,
        validators=[RegexValidator(r'^[a-zA-ZÀ-ÿ\s-]+$', 'Le nom doit contenir uniquement des lettres, espaces ou tirets.')]
    )
    prenom = models.CharField(
        max_length=100,
        validators=[RegexValidator(r'^[a-zA-ZÀ-ÿ\s-]+$', 'Le prénom doit contenir uniquement des lettres, espaces ou tirets.')]
    )
    type_employe = models.ForeignKey(
        TypeEmploye,
        on_delete=models.PROTECT,
        db_index=True,
        related_name='employes'
    )
    salaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00')
    )
    date_embauche = models.DateField(default=timezone.localdate)
    numero_telephone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Le numéro de téléphone doit être valide.')]
    )

    pin_code = models.CharField(
        max_length=4,
        validators=[RegexValidator(r'^\d{4}$', 'Le PIN code doit contenir exactement 4 chiffres.')],
        help_text="Le PIN code est unique par restaurant (4 chiffres)",
        blank=True,
        null=True
    )

    class Meta:
        verbose_name = "Employé"
        verbose_name_plural = "Employés"
        db_table = "T_HOLLY_PI_EMPLOYES"
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.type_employe.nom_type})"

    def calculer_anciennete(self):
        """Calcule l'ancienneté en années."""
        today = timezone.now().date()
        return today.year - self.date_embauche.year - (
            (today.month, today.day) < (self.date_embauche.month, self.date_embauche.day)
        )

    @property
    def nom_complet(self):
        """Retourne le nom complet de l'employé."""
        return f"{self.prenom} {self.nom}"
    
    def to_dict(self):
        """Retourne une représentation dictionnaire de l'employé."""
        return {
            'id': self.id,
            'nom': self.nom,
            'prenom': self.prenom,
            'nom_complet': self.nom_complet,
            'type_employe': self.type_employe.nom_type if self.type_employe else None,
            'salaire': str(self.salaire) if self.salaire else None,
            'date_embauche': self.date_embauche.isoformat() if self.date_embauche else None,
            'numero_telephone': self.numero_telephone
        }


class RestaurantEmploye(models.Model):
    """
    Table de liaison entre Restaurant et Employe.
    
    Auteur : Benjamin DUSUNCELI CETIN
    Créé : 31/01/2025 15:00
    Version : 1.0
    """
    id = models.AutoField(primary_key=True)
    restaurant = models.ForeignKey(
        Restaurant, 
        on_delete=models.CASCADE, 
        db_index=True,
        related_name='employes_association'
    )
    employe = models.ForeignKey(
        Employe, 
        on_delete=models.CASCADE, 
        db_index=True,
        related_name='restaurants_association'
    )

    class Meta:
        verbose_name = "Association Restaurant-Employé"
        verbose_name_plural = "Associations Restaurant-Employé"
        db_table = "T_HOLLY_PI_RESTAURANT_EMPLOYE"
        unique_together = ('restaurant', 'employe')
        ordering = ['id']

    def clean(self):
        """
        Valide que le PIN code est unique pour ce restaurant.
        """
        from django.core.exceptions import ValidationError

        if not self.employe.pin_code:
            return

        other_restaurant_employes = RestaurantEmploye.objects.filter(
            restaurant=self.restaurant
        ).exclude(employe=self.employe).select_related('employe')

        for re in other_restaurant_employes:
            if re.employe.pin_code and re.employe.pin_code == self.employe.pin_code:
                raise ValidationError({
                    'pin_code': 'Ce PIN code est déjà utilisé par un autre employé dans ce restaurant.'
                })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.restaurant.nom_restaurant} - {self.employe.nom_complet}"
