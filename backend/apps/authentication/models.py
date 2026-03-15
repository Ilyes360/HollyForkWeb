"""
Modèles d'authentification pour Holly Pi.

Ce module contient le modèle utilisateur personnalisé qui étend
le modèle AbstractUser de Django pour permettre des extensions futures.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class HollyUser(AbstractUser):
    """
    Modèle utilisateur personnalisé pour Holly Pi.
    
    Étend AbstractUser pour permettre des personnalisations futures
    sans avoir à faire de migration complexe.
    
    Auteur : Benjamin DUSUNCELI CETIN
    Version : 1.0
    """
    
    # Champs supplémentaires optionnels pour le futur
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="Numéro de téléphone"
    )
    
    is_verified = models.BooleanField(
        default=False,
        verbose_name="Email vérifié"
    )

    # MFA (TOTP) — double facteur d'authentification
    totp_secret = models.CharField(
        max_length=32,
        blank=True,
        default="",
        verbose_name="Secret TOTP",
    )
    mfa_enabled = models.BooleanField(
        default=False,
        verbose_name="MFA activé",
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Date de modification"
    )

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        db_table = "T_HOLLY_PI_USERS"
        
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    def get_full_name(self):
        """Retourne le nom complet de l'utilisateur."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
    
    @property
    def has_employee_profile(self):
        """Vérifie si l'utilisateur a un profil employé associé."""
        return hasattr(self, 'employe') and self.employe is not None
