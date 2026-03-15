from django.db import models
from apps.restaurant.models import Restaurant


class Report(models.Model):
    """
    Modèle pour les rapports générés.
    """
    TYPE_CHOICES = [
        ('SALES', 'Ventes'),
        ('STOCK', 'Stocks'),
        ('STAFF', 'Personnel'),
        ('FINANCIAL', 'Financier'),
        ('CUSTOM', 'Personnalisé'),
    ]
    
    id = models.AutoField(primary_key=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, db_index=True)
    type_report = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    periode_debut = models.DateField(db_index=True)
    periode_fin = models.DateField(db_index=True)
    fichier = models.FileField(upload_to='reports/', blank=True, null=True)
    generated_at = models.DateTimeField(auto_now_add=True, db_index=True)
    created_by = models.ForeignKey('authentication.HollyUser', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = "Rapport"
        verbose_name_plural = "Rapports"
        db_table = "T_HOLLY_PI_REPORTS"
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['restaurant', 'type_report', 'generated_at']),
        ]

    def __str__(self):
        return f"{self.get_type_report_display()} - {self.restaurant.nom_restaurant} ({self.generated_at.date()})"

