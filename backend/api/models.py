import secrets
from django.conf import settings
from django.db import models


def generate_temp_token():
    return secrets.token_urlsafe(32)


class UserProfile(models.Model):
    """Profile étendu pour MFA (TOTP)."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    totp_secret = models.CharField(max_length=32, blank=True)
    mfa_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile {self.user.email}"


class TempLoginToken(models.Model):
    """Token temporaire après email+password quand MFA est activé."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True, default=generate_temp_token)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"TempLogin {self.user.email}"


class RoomMap(models.Model):
    """Saved floor plan / room map (tables, walls, greenery)."""
    name = models.CharField(max_length=200)
    elements = models.JSONField(default=list)  # list of { id, type, ... } from editor
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='room_maps')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


class Reservation(models.Model):
    """Restaurant reservation."""
    client = models.CharField(max_length=200)
    heure = models.CharField(max_length=10)  # e.g. "12:30"
    couverts = models.PositiveSmallIntegerField(default=2)
    canal = models.CharField(max_length=50)  # Site, Téléphone, TheFork, etc.
    statut = models.CharField(max_length=50)  # Confirmée, Arrivée, En Attente
    statut_type = models.CharField(max_length=20, default='pending')  # confirmed, arrived, pending

    class Meta:
        ordering = ['heure']

    def __str__(self):
        return f"{self.client} @ {self.heure}"


class SupplierOrder(models.Model):
    """Supplier product/order line for dashboard."""
    produit = models.CharField(max_length=200)
    fournisseur = models.CharField(max_length=200)
    prix = models.CharField(max_length=50)  # e.g. "28.90 €/kg"
    variation = models.CharField(max_length=20, default='0%')
    variation_type = models.CharField(max_length=20, default='neutral')  # up, down, neutral
    stock = models.CharField(max_length=50)  # Faible, Moyen, Bon
    stock_type = models.CharField(max_length=20, default='medium')  # low, medium, good
    derniere_cmd = models.CharField(max_length=20, blank=True)  # e.g. "3j"

    class Meta:
        ordering = ['produit']

    def __str__(self):
        return f"{self.produit} — {self.fournisseur}"


class TeamShift(models.Model):
    """Team planning shift (role + time + assignee)."""
    time = models.CharField(max_length=10)  # e.g. "11:00"
    role = models.CharField(max_length=100)  # Chef de rang, Serveur, etc.
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='unassigned')  # assigned, unassigned

    class Meta:
        ordering = ['time', 'role']

    def __str__(self):
        return f"{self.time} {self.role} — {self.name}"
