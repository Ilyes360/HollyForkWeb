from django.db import models

from apps.restaurant.models import Restaurant
from apps.staff.models import Employe

class Note(models.Model):
    created_by = models.ForeignKey(Employe, on_delete=models.CASCADE, db_index=True)
    restaurant = models.ForeignKey(Restaurant, blank=False, default=None, on_delete=models.CASCADE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    message = models.CharField(blank=False, default="Vide", max_length=500)

    def to_dict(self):
        return {
            "id": self.id,
            "created_by": self.created_by.to_dict(),
            "created_at": self.created_at.isoformat(),
            "restaurant": self.restaurant.to_dict(),
            "message": self.message,
        }
    
    def __str__(self):
        return f"Note par {self.created_by} pour {self.restaurant.nom_restaurant} : {self.message}"

    class Meta:
        verbose_name = "T_HOLLY_PI_NOTE"
        verbose_name_plural = "T_HOLLY_PI_NOTE"
        db_table = "T_HOLLY_PI_NOTE"
        ordering = ['-created_at']