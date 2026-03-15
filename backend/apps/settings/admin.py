from django.contrib import admin
from .models import NotificationSettings, BillingSettings


@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    list_display = ['restaurant', 'email_notifications', 'sms_notifications', 'stock_alerts']


@admin.register(BillingSettings)
class BillingSettingsAdmin(admin.ModelAdmin):
    list_display = ['restaurant', 'tva_par_defaut', 'devise', 'facture_auto']

