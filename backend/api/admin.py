from django.contrib import admin
from .models import (
    Salle,
    Role,
    UserProfile,
    TempLoginToken,
    Table,
    Zone_Verdure,
    Mur,
    Groupe_Menu,
    Menu,
    Appartenance_Groupe_Menu,
    Plat,
    Appartenance_Menu_Plat,
    Formule,
    Appartenance_Formule_Menu,
    Categorie_Produit,
    Produit,
    Client,
    Reservation,
    Detail_Reservation_Table,
    Commande,
    Ligne_Commande,
    Facture,
    Paiement,
    Type_Apport,
    Apport,
    Employee,
    PlanningShift,
    Type_Notification,
    Notification,
    Type_Log_Activite,
    Log_Activite,
    RoomMap,
    SupplierOrder,
    TeamShift,
)


@admin.register(Salle)
class SalleAdmin(admin.ModelAdmin):
    list_display = ['nom_salle', 'email_salle', 'actif', 'created_at']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['nom_role', 'salle']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'salle', 'mfa_enabled']


@admin.register(TempLoginToken)
class TempLoginTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at']


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['numero_table', 'salle', 'type_table', 'capacite_table', 'actif']


@admin.register(Zone_Verdure)
class Zone_VerdureAdmin(admin.ModelAdmin):
    list_display = ['id', 'type_verdure', 'salle']


@admin.register(Mur)
class MurAdmin(admin.ModelAdmin):
    list_display = ['id', 'salle']


class Appartenance_Groupe_MenuInline(admin.TabularInline):
    model = Appartenance_Groupe_Menu
    extra = 0


@admin.register(Groupe_Menu)
class Groupe_MenuAdmin(admin.ModelAdmin):
    list_display = ['nom_groupe_menu', 'salle', 'actif']


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ['nom_menu', 'salle', 'actif']


class Appartenance_Menu_PlatInline(admin.TabularInline):
    model = Appartenance_Menu_Plat
    extra = 0


@admin.register(Plat)
class PlatAdmin(admin.ModelAdmin):
    list_display = ['nom_plat', 'salle', 'prix_plat', 'actif']


class Appartenance_Formule_MenuInline(admin.TabularInline):
    model = Appartenance_Formule_Menu
    extra = 0


@admin.register(Formule)
class FormuleAdmin(admin.ModelAdmin):
    list_display = ['nom_formule', 'salle', 'prix_formule', 'actif']


@admin.register(Categorie_Produit)
class Categorie_ProduitAdmin(admin.ModelAdmin):
    list_display = ['nom_categorie_produit', 'salle']


@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ['nom_produit', 'categorie', 'salle', 'prix_unitaire_produit', 'stock_produit', 'actif']


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['nom_client', 'prenom_client', 'email_client', 'telephone_client', 'salle']


class Detail_Reservation_TableInline(admin.TabularInline):
    model = Detail_Reservation_Table
    extra = 0


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['client', 'date_reservation', 'heure_reservation', 'nombre_personnes', 'statut_reservation', 'canal', 'salle']
    list_filter = ['statut_reservation', 'canal', 'salle']
    inlines = [Detail_Reservation_TableInline]


class Ligne_CommandeInline(admin.TabularInline):
    model = Ligne_Commande
    extra = 0


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ['id', 'date_commande', 'statut_commande', 'total_commande', 'user', 'salle', 'table']
    list_filter = ['statut_commande', 'salle']
    inlines = [Ligne_CommandeInline]


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ['id', 'commande', 'date_facture', 'montant_total', 'statut_facture', 'salle']


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ['id', 'facture', 'montant_paiement', 'mode_paiement', 'date_paiement', 'statut_paiement']


@admin.register(Type_Apport)
class Type_ApportAdmin(admin.ModelAdmin):
    list_display = ['nom_type_apport']


@admin.register(Apport)
class ApportAdmin(admin.ModelAdmin):
    list_display = ['type_apport', 'valeur_apport', 'date_apport', 'salle']


@admin.register(Type_Notification)
class Type_NotificationAdmin(admin.ModelAdmin):
    list_display = ['nom_type_notification']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'salle', 'type_notification', 'date_notification', 'lue']


@admin.register(Type_Log_Activite)
class Type_Log_ActiviteAdmin(admin.ModelAdmin):
    list_display = ['nom_type_log_activite']


@admin.register(Log_Activite)
class Log_ActiviteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'salle', 'type_log', 'date_log']


@admin.register(RoomMap)
class RoomMapAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'salle', 'updated_at']
    list_filter = ['user']


@admin.register(SupplierOrder)
class SupplierOrderAdmin(admin.ModelAdmin):
    list_display = ['produit', 'fournisseur', 'prix', 'stock']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['nom', 'role', 'initiales', 'heures_semaine', 'salle']


@admin.register(PlanningShift)
class PlanningShiftAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'type_shift', 'heure_debut', 'heure_fin']
    list_filter = ['date', 'type_shift']


@admin.register(TeamShift)
class TeamShiftAdmin(admin.ModelAdmin):
    list_display = ['time', 'role', 'name', 'status']
