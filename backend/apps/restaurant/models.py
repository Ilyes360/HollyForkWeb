from django.db import models
from django.core.validators import RegexValidator


class Restaurant(models.Model):
    """
    Gestion des restaurants.
    Auteur : Benjamin DUSUNCELI CETIN
    Créé : 31/01/2025 15:00
    Version : 1.0
    """
    id_restaurant = models.AutoField(primary_key=True)
    nom_restaurant = models.CharField(max_length=100)
    adresse_restaurant = models.CharField(max_length=255)
    code_postal = models.CharField(max_length=10)
    ville = models.CharField(max_length=100)
    numero_telephone = models.CharField(max_length=20)
    numero_siret = models.CharField(
        max_length=14,
        unique=True,
        validators=[RegexValidator(r'^\d{14}$', 'Le SIRET doit contenir 14 chiffres.')]
    )
    code_naf = models.CharField(max_length=10, blank=True, null=True, help_text="Code NAF/APE de l'établissement")
    pin_restaurant = models.CharField(
        max_length=6,
        validators=[RegexValidator(r'^\d{6}$', 'Le PIN restaurant doit contenir exactement 6 chiffres.')],
        help_text="PIN à 6 chiffres pour connecter un équipement au restaurant",
        unique=True,
        null=True,
        blank=True
    )
    logo_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL du logo du restaurant"
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        help_text="Latitude géographique du restaurant"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True,
        help_text="Longitude géographique du restaurant"
    )

    class Meta:
        verbose_name = "T_HOLLY_PI_RESTAURANTS"
        verbose_name_plural = "T_HOLLY_PI_RESTAURANTS"
        db_table = "T_HOLLY_PI_RESTAURANTS"
        ordering = ['id_restaurant']

    def __str__(self):
        return f"{self.nom_restaurant} ({self.ville})"

    def to_dict(self):
        return {
            "id": self.id_restaurant,
            "nom": self.nom_restaurant,
            "adresse": self.adresse_restaurant,
            "code_postal": self.code_postal,
            "ville": self.ville,
            "telephone": self.numero_telephone,
            "siret": self.numero_siret,
            "naf": self.code_naf,
            "logo_url": self.logo_url,
            "latitude": float(self.latitude) if self.latitude else None,
            "longitude": float(self.longitude) if self.longitude else None,
        }
