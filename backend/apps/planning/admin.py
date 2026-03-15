from django.contrib import admin
from .models import Shift


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['id', 'employe', 'restaurant', 'date_debut', 'date_fin', 'type_shift']
    list_filter = ['restaurant', 'type_shift', 'date_debut']
    search_fields = ['employe__nom', 'employe__prenom']

