from django.db import models
from apps.restaurant.models import Restaurant


class NotificationSettings(models.Model):
    """
    Paramètres de notifications pour un restaurant.
    """
    id = models.AutoField(primary_key=True)
    restaurant = models.OneToOneField(Restaurant, on_delete=models.CASCADE, related_name='notification_settings')
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    stock_alerts = models.BooleanField(default=True)
    reservation_alerts = models.BooleanField(default=True)
    command_alerts = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paramètres de notifications"
        verbose_name_plural = "Paramètres de notifications"
        db_table = "T_HOLLY_PI_NOTIFICATION_SETTINGS"
        ordering = ['-created_at']

    def __str__(self):
        return f"Notifications - {self.restaurant.nom_restaurant}"


class BillingSettings(models.Model):
    """
    Paramètres de facturation pour un restaurant.
    """
    id = models.AutoField(primary_key=True)
    restaurant = models.OneToOneField(Restaurant, on_delete=models.CASCADE, related_name='billing_settings')
    tva_par_defaut = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    devise = models.CharField(max_length=3, default='EUR')
    facture_auto = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paramètres de facturation"
        verbose_name_plural = "Paramètres de facturation"
        db_table = "T_HOLLY_PI_BILLING_SETTINGS"
        ordering = ['-created_at']

    def __str__(self):
        return f"Facturation - {self.restaurant.nom_restaurant}"

