from django.db import models
from decimal import Decimal

class TauxTVA(models.Model):
    """
    Table représentant les différents taux de TVA applicables.
    Modèle partagé pour éviter les importations circulaires.
    """
    taux = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        help_text="Taux de TVA en pourcentage",
        db_index=True  # Index car utilisé dans les calculs et filtres
    )
    description = models.CharField(
        max_length=255, 
        help_text="Description du taux (ex: Taux normal, Taux réduit)",
        db_index=True  # Index car utilisé dans les recherches
    )
    actif = models.BooleanField(
        default=True,
        db_index=True  # Index car utilisé pour filtrer les taux actifs
    )

    class Meta:
        verbose_name = "T_HOLLY_PI_TAUX_TVA"
        verbose_name_plural = "T_HOLLY_PI_TAUX_TVA"
        db_table = "T_HOLLY_PI_TAUX_TVA"
        indexes = [
            models.Index(fields=['taux', 'actif']),  # Index composite pour les requêtes filtrant par taux actif
        ]

    def __str__(self):
        return f"{self.taux}% - {self.description}"

    @property
    def coefficient_tva(self):
        """Retourne le coefficient multiplicateur pour le calcul de la TVA."""
        return Decimal('1') + (self.taux / Decimal('100'))

    @classmethod
    def get_tva_par_defaut(cls):
        """
        Retourne l'ID du taux de TVA à 20% (taux normal).
        Crée le taux s'il n'existe pas.
        """
        taux, _ = cls.objects.get_or_create(
            taux=Decimal('20.00'),
            defaults={
                'description': 'Taux normal',
                'actif': True
            }
        )
        return taux.id
