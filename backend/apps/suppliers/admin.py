from django.contrib import admin
from .models import Fournisseur, JourLivraison, CommandeFournisseur


@admin.register(Fournisseur)
class FournisseurAdmin(admin.ModelAdmin):
    list_display = ['nom', 'contact_nom', 'email', 'telephone', 'actif']
    list_filter = ['actif']
    search_fields = ['nom', 'contact_nom', 'email']


@admin.register(JourLivraison)
class JourLivraisonAdmin(admin.ModelAdmin):
    list_display = ['fournisseur', 'jour', 'heure_livraison']
    list_filter = ['jour', 'fournisseur']


@admin.register(CommandeFournisseur)
class CommandeFournisseurAdmin(admin.ModelAdmin):
    list_display = ['numero_commande', 'fournisseur', 'restaurant', 'date_commande', 'statut']
    list_filter = ['statut', 'date_commande']
    search_fields = ['numero_commande', 'fournisseur__nom']

