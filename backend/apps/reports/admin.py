from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'restaurant', 'type_report', 'periode_debut', 'periode_fin', 'generated_at']
    list_filter = ['type_report', 'generated_at']
    search_fields = ['restaurant__nom_restaurant']

