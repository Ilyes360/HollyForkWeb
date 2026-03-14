from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from .models import (
    Salle,
    Role,
    Table,
    Client,
    Reservation,
    Menu,
    Groupe_Menu,
    Plat,
    Appartenance_Menu_Plat,
    Formule,
    Ingredient,
    IngredientMovement,
    Fournisseur,
    CommandeFournisseur,
    LigneCommandeFournisseur,
    Categorie_Produit,
    Produit,
    Commande,
    Ligne_Commande,
    Facture,
    Paiement,
    Type_Apport,
    Apport,
    Employee,
    PlanningShift,
    PlanningCapacity,
    StockMovement,
    SupplierOrder,
    TeamShift,
    RoomMap,
    UserProfile,
)


# ─── CRUD serializers (strong candidates) ───────────────────────────────────

class SalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salle
        fields = ['id', 'nom_salle', 'adresse_salle', 'telephone_salle', 'email_salle', 'description_salle', 'actif', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'nom_role', 'description_role', 'salle']
        read_only_fields = ['id']


class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'numero_table', 'capacite_table', 'type_table', 'x_position', 'y_position', 'rotation', 'width', 'height', 'radius', 'actif', 'salle']
        read_only_fields = ['id']


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'nom_client', 'prenom_client', 'email_client', 'telephone_client', 'adresse_client', 'code_postal_client', 'ville_client', 'pays_client', 'date_naissance_client', 'actif', 'salle', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MenuSerializer(serializers.ModelSerializer):
    plats = serializers.SerializerMethodField()

    class Meta:
        model = Menu
        fields = ['id', 'nom_menu', 'description_menu', 'actif', 'salle', 'plats']
        read_only_fields = ['id']

    def get_plats(self, obj):
        """Liste des plats du menu (id, nom_plat, prix_plat)."""
        links = obj.lien_plats.select_related('plat').all()
        return [
            {'id': link.plat_id, 'nom_plat': link.plat.nom_plat, 'prix_plat': str(link.plat.prix_plat)}
            for link in links
        ]


class GroupeMenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = Groupe_Menu
        fields = ['id', 'nom_groupe_menu', 'description_groupe_menu', 'actif', 'salle']
        read_only_fields = ['id']


class PlatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plat
        fields = ['id', 'nom_plat', 'description_plat', 'prix_plat', 'actif', 'salle']
        read_only_fields = ['id']


class FormuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Formule
        fields = ['id', 'nom_formule', 'description_formule', 'prix_formule', 'actif', 'salle']
        read_only_fields = ['id']


class CategorieProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie_Produit
        fields = ['id', 'nom_categorie_produit', 'description_categorie_produit', 'salle']
        read_only_fields = ['id']


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'nom_ingredient', 'unite', 'stock_actuel', 'seuil_alerte', 'salle']
        read_only_fields = ['id']
        validators = [
            UniqueTogetherValidator(
                queryset=Ingredient.objects.all(),
                fields=['salle', 'nom_ingredient'],
                message='Un ingrédient avec ce nom existe déjà pour cette salle.',
            ),
        ]


class IngredientMovementSerializer(serializers.ModelSerializer):
    ingredient_nom = serializers.CharField(source='ingredient.nom_ingredient', read_only=True)

    class Meta:
        model = IngredientMovement
        fields = ['id', 'ingredient', 'ingredient_nom', 'quantity_delta', 'created_at', 'user', 'notes']
        read_only_fields = ['id', 'created_at']


class FournisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fournisseur
        fields = ['id', 'nom', 'email', 'telephone', 'adresse', 'actif', 'salle']
        read_only_fields = ['id']


class LigneCommandeFournisseurSerializer(serializers.ModelSerializer):
    ingredient_nom = serializers.CharField(source='ingredient.nom_ingredient', read_only=True)

    class Meta:
        model = LigneCommandeFournisseur
        fields = ['id', 'commande', 'ingredient', 'ingredient_nom', 'quantite', 'prix_unitaire']
        read_only_fields = ['id']
        validators = [
            UniqueTogetherValidator(
                queryset=LigneCommandeFournisseur.objects.all(),
                fields=['commande', 'ingredient'],
                message='Cet ingrédient est déjà présent dans cette commande (une ligne par ingrédient).',
            ),
        ]


class CommandeFournisseurSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeFournisseurSerializer(many=True, read_only=True)
    fournisseur_nom = serializers.CharField(source='fournisseur.nom', read_only=True)

    class Meta:
        model = CommandeFournisseur
        fields = [
            'id', 'fournisseur', 'fournisseur_nom', 'salle', 'date_commande', 'date_livraison_prevue',
            'statut', 'notes', 'livraison_effectuee', 'created_at', 'updated_at', 'lignes',
        ]
        read_only_fields = ['id', 'date_commande', 'created_at', 'updated_at', 'livraison_effectuee']
        extra_kwargs = {'salle': {'required': False}}


class ProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = ['id', 'nom_produit', 'description_produit', 'prix_unitaire_produit', 'actif', 'stock_produit', 'categorie', 'salle']
        read_only_fields = ['id']


class StockMovementSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom_produit', read_only=True)

    class Meta:
        model = StockMovement
        fields = ['id', 'produit', 'produit_nom', 'quantity_delta', 'created_at', 'user', 'notes']
        read_only_fields = ['id', 'created_at']


class LigneCommandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ligne_Commande
        fields = ['id', 'commande', 'plat', 'produit', 'formule', 'quantite', 'prix_unitaire', 'total_ligne', 'notes_ligne', 'type_element']
        read_only_fields = ['id']


class FactureSummarySerializer(serializers.ModelSerializer):
    """Résumé facture pour embedding dans l'historique des commandes."""
    montant_paye = serializers.SerializerMethodField()
    reste_a_payer = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            'id', 'date_facture', 'montant_total', 'montant_paye', 'reste_a_payer',
            'statut_facture', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_montant_paye(self, obj):
        return obj.montant_paye()

    def get_reste_a_payer(self, obj):
        return obj.montant_total - obj.montant_paye()


class CommandeSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True, read_only=True)

    class Meta:
        model = Commande
        fields = ['id', 'date_commande', 'statut_commande', 'total_commande', 'notes_commande', 'user', 'salle', 'table', 'client', 'created_at', 'updated_at', 'lignes']
        read_only_fields = ['id', 'date_commande', 'created_at', 'updated_at']


class CommandeHistoriqueSerializer(serializers.ModelSerializer):
    """Commande avec lignes et résumé facture pour l'historique."""
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    facture = FactureSummarySerializer(read_only=True, allow_null=True)

    class Meta:
        model = Commande
        fields = [
            'id', 'date_commande', 'statut_commande', 'total_commande', 'notes_commande',
            'user', 'salle', 'table', 'client', 'created_at', 'updated_at',
            'lignes', 'facture',
        ]
        read_only_fields = ['id', 'date_commande', 'created_at', 'updated_at']


class FactureSerializer(serializers.ModelSerializer):
    montant_paye = serializers.SerializerMethodField()
    reste_a_payer = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            'id', 'commande', 'client', 'salle', 'date_facture', 'montant_total',
            'montant_paye', 'reste_a_payer', 'statut_facture', 'tva', 'remise',
            'notes_facture', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'date_facture', 'created_at', 'updated_at']

    def get_montant_paye(self, obj):
        return obj.montant_paye()

    def get_reste_a_payer(self, obj):
        return obj.montant_total - obj.montant_paye()


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = ['id', 'facture', 'montant_paiement', 'date_paiement', 'mode_paiement', 'reference_paiement', 'statut_paiement']
        read_only_fields = ['id', 'date_paiement']


class TypeApportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type_Apport
        fields = ['id', 'nom_type_apport', 'description_type_apport']
        read_only_fields = ['id']


class ApportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Apport
        fields = ['id', 'type_apport', 'valeur_apport', 'date_apport', 'salle']
        read_only_fields = ['id']


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'nom', 'role', 'initiales', 'heures_semaine', 'color', 'salle']
        read_only_fields = ['id']


class PlanningShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanningShift
        fields = ['id', 'employee', 'date', 'type_shift', 'heure_debut', 'heure_fin']
        read_only_fields = ['id']


class PlanningCapacitySerializer(serializers.ModelSerializer):
    """Capacité planning : effectif requis par salle, jour (0-6), type (Midi/Soir)."""
    class Meta:
        model = PlanningCapacity
        fields = ['id', 'salle', 'day_of_week', 'type_shift', 'required_count']
        read_only_fields = ['id']
        validators = [
            UniqueTogetherValidator(
                queryset=PlanningCapacity.objects.all(),
                fields=['salle', 'day_of_week', 'type_shift'],
                message='Une capacité existe déjà pour cette salle, ce jour et ce type de service.',
            ),
        ]


# ─── Profile ─────────────────────────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    """Profile for current user: role, salle. PATCH allows updating role and salle only."""
    class Meta:
        model = UserProfile
        fields = ['id', 'role', 'salle', 'mfa_enabled']
        read_only_fields = ['id', 'mfa_enabled']


# ─── Existing / auth ─────────────────────────────────────────────────────────

class RoomMapSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomMap
        fields = ['id', 'name', 'elements', 'salle', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=150)

    def validate_email(self, value):
        if value and User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return (value or '').lower()

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        email = validated_data['email']
        # Django User: unique username required; derive from email
        username = email.replace('@', '_at_').replace('.', '_')[:150]
        base = username
        i = 0
        while User.objects.filter(username=username).exists():
            i += 1
            username = f"{base}{i}"[:150]
        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data['password'],
            first_name=validated_data.get('first_name') or '',
            last_name=validated_data.get('last_name') or '',
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})


class ReservationSerializer(serializers.ModelSerializer):
    """ERD Reservation: client, date, heure, nombre_personnes, statut, canal, tables (lecture)."""
    client_display = serializers.SerializerMethodField()
    heure = serializers.SerializerMethodField()
    statutType = serializers.CharField(source='statut_reservation')
    statut = serializers.CharField(source='get_statut_reservation_display', read_only=True)
    tables = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id', 'client', 'client_display', 'date_reservation', 'heure_reservation',
            'heure', 'nombre_personnes', 'statut_reservation', 'statut', 'statutType',
            'canal', 'notes_reservation', 'salle', 'tables',
        ]

    def get_client_display(self, obj):
        if obj.client:
            return f"{obj.client.prenom_client} {obj.client.nom_client}"
        return ""

    def get_heure(self, obj):
        if obj.heure_reservation:
            return obj.heure_reservation.strftime('%H:%M')
        return ""

    def get_tables(self, obj):
        return [
            {'id': t.id, 'numero_table': t.numero_table, 'capacite_table': t.capacite_table}
            for t in obj.tables.all()
        ]

    def validate(self, attrs):
        salle = attrs.get('salle')
        client = attrs.get('client')
        if client and salle and getattr(client, 'salle_id', None) and client.salle_id != salle.id:
            raise serializers.ValidationError(
                {'client': 'Le client doit appartenir à la même salle que la réservation.'}
            )
        return attrs


class SupplierOrderSerializer(serializers.ModelSerializer):
    variationType = serializers.CharField(source='variation_type')
    stockType = serializers.CharField(source='stock_type')
    derniereCmd = serializers.CharField(source='derniere_cmd')

    class Meta:
        model = SupplierOrder
        fields = ['id', 'produit', 'fournisseur', 'prix', 'variation', 'variationType',
                  'stock', 'stockType', 'derniereCmd']


class TeamShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamShift
        fields = ['id', 'time', 'role', 'name', 'status']
