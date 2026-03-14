from django.contrib import admin
from .models import Reservation, SupplierOrder, TeamShift, RoomMap, UserProfile, TempLoginToken


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['client', 'heure', 'couverts', 'canal', 'statut']


@admin.register(SupplierOrder)
class SupplierOrderAdmin(admin.ModelAdmin):
    list_display = ['produit', 'fournisseur', 'prix', 'stock']


@admin.register(TeamShift)
class TeamShiftAdmin(admin.ModelAdmin):
    list_display = ['time', 'role', 'name', 'status']


@admin.register(RoomMap)
class RoomMapAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'updated_at']
    list_filter = ['user']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'mfa_enabled']


@admin.register(TempLoginToken)
class TempLoginTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at']
