from django.db import models

from apps.salles.models import Salle, Table


class Reservation(models.Model):
    """
    Table représentant une réservation dans un restaurant.
    Une réservation peut être affectée à une table précise (table) dans la salle.
    """
    id = models.AutoField(primary_key=True)
    nom_client = models.CharField(max_length=100)
    nombre_personnes = models.PositiveIntegerField()
    date_heure = models.DateTimeField()
    telephone = models.CharField(max_length=20)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, db_index=True)
    table = models.ForeignKey(
        Table,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_index=True,
        related_name='reservations',
    )

    class Meta:
        verbose_name = "T_HOLLY_PI_RESERVATIONS"
        verbose_name_plural = "T_HOLLY_PI_RESERVATIONS"
        db_table = "T_HOLLY_PI_RESERVATIONS"
        ordering = ['date_heure']

    def __str__(self):
        if self.table:
            return f"{self.nom_client} - {self.date_heure} - Table {self.table.numero} ({self.salle.restaurant.nom_restaurant})"
        return f"{self.nom_client} - {self.date_heure} - {self.salle.restaurant.nom_restaurant}"
    