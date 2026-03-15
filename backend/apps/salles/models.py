from django.db import models
from apps.restaurant.models import Restaurant
from apps.staff.models import Employe

class Salle(models.Model):
    """
    Gestion des salles dans un restaurant.
    Auteur : Benjamin DUSUNCELI CETIN
    Créé : 24/06/2025 15:00
    Version : 1.0
    """
    id = models.AutoField(primary_key=True)
    nom_salle = models.CharField(max_length=100)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='salles', db_index=True)
    capacite = models.PositiveIntegerField(default=0)
    etage = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "T_HOLLY_PI_SALLES"
        verbose_name_plural = "T_HOLLY_PI_SALLES"
        db_table = "T_HOLLY_PI_SALLES"
        ordering = ['id']
        unique_together = ('restaurant', 'nom_salle')

    def __str__(self):
        return f"{self.nom_salle} ({self.restaurant.nom_restaurant})"

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom_salle,
            "restaurant": self.restaurant.to_dict(),
            "capacite": self.capacite,
            "etage": self.etage,
            "description": self.description,
        }
    
class Table(models.Model):
    """
    Table représentant une table dans une salle de restaurant.
    """
    id = models.AutoField(primary_key=True)
    numero = models.PositiveIntegerField(default=1)
    capacity = models.PositiveIntegerField(default=0)
    reserved_seats = models.PositiveIntegerField(default=0)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='tables', db_index=True)
    employee_in_charge = models.ForeignKey(Employe, on_delete=models.CASCADE, db_index=True)
    is_occupied = models.BooleanField(default=False)
    position_x = models.IntegerField(default=0, help_text="Position X de la table dans la salle")
    position_y = models.IntegerField(default=0, help_text="Position Y de la table dans la salle")

    class Meta:
        verbose_name = "T_HOLLY_PI_TABLES"
        verbose_name_plural = "T_HOLLY_PI_TABLES"
        db_table = "T_HOLLY_PI_TABLES"
        ordering = ['numero']
        unique_together = ('salle', 'numero')

    def __str__(self):
        return f"Table {self.numero} ({self.salle.nom_salle}, {self.salle.restaurant.nom_restaurant})"
    
  
