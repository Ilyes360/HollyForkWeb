from django.db import models
from apps.staff.models import Employe
from apps.restaurant.models import Restaurant


class Shift(models.Model):
    """
    Modèle pour les créneaux horaires (shifts) des employés.
    """
    id = models.AutoField(primary_key=True)
    employe = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name='shifts', db_index=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, db_index=True)
    date_debut = models.DateTimeField(db_index=True)
    date_fin = models.DateTimeField(db_index=True)
    type_shift = models.CharField(
        max_length=20,
        choices=[
            ('MORNING', 'Matin'),
            ('AFTERNOON', 'Après-midi'),
            ('EVENING', 'Soir'),
            ('NIGHT', 'Nuit'),
        ],
        default='MORNING'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Créneau horaire"
        verbose_name_plural = "Créneaux horaires"
        db_table = "T_HOLLY_PI_SHIFTS"
        ordering = ['date_debut']
        indexes = [
            models.Index(fields=['restaurant', 'date_debut']),
            models.Index(fields=['employe', 'date_debut']),
            models.Index(fields=['date_debut', 'date_fin']),
        ]

    def __str__(self):
        return f"{self.employe.prenom} {self.employe.nom} - {self.date_debut.strftime('%Y-%m-%d %H:%M')}"

