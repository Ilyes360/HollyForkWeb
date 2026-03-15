from django.utils import timezone
from rest_framework import serializers
from .models import Fournisseur, JourLivraison, CommandeFournisseur
from apps.restaurant.serializers import RestaurantSerializer


class JourLivraisonSerializer(serializers.ModelSerializer):
    delivery_time = serializers.TimeField(source='heure_livraison')

    class Meta:
        model = JourLivraison
        fields = ['id', 'jour', 'delivery_time']
        read_only_fields = ['id']


class FournisseurSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='nom', max_length=200)
    contact_name = serializers.CharField(source='contact_nom', max_length=200, required=False, allow_blank=True)
    address = serializers.CharField(source='adresse', required=False, allow_blank=True)
    city = serializers.CharField(source='ville', required=False, allow_blank=True)
    postal_code = serializers.CharField(source='code_postal', required=False, allow_blank=True)
    is_active = serializers.BooleanField(source='actif', required=False)
    jours_livraison = JourLivraisonSerializer(many=True, read_only=True)

    class Meta:
        model = Fournisseur
        fields = ['id', 'name', 'contact_name', 'email', 'telephone', 'address',
                  'city', 'postal_code', 'latitude', 'longitude', 'notes',
                  'is_active', 'jours_livraison', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommandeFournisseurSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='numero_commande', required=False, allow_blank=True)
    order_date = serializers.DateField(source='date_commande', required=False)
    expected_delivery_date = serializers.DateField(source='date_livraison_prevue', required=False)
    status = serializers.CharField(source='statut', required=False)
    total_amount = serializers.DecimalField(source='montant_total', max_digits=10, decimal_places=2, required=False)
    fournisseur = FournisseurSerializer(read_only=True)
    fournisseur_id = serializers.PrimaryKeyRelatedField(queryset=[], source='fournisseur', write_only=True, required=False)
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(queryset=[], source='restaurant', write_only=True, required=False)

    class Meta:
        model = CommandeFournisseur
        fields = ['id', 'fournisseur', 'fournisseur_id', 'restaurant', 'restaurant_id',
                  'order_number', 'order_date', 'expected_delivery_date', 'status',
                  'total_amount', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.restaurant.models import Restaurant
        self.fields['restaurant_id'].queryset = Restaurant.objects.all()
        self.fields['fournisseur_id'].queryset = Fournisseur.objects.all()

    def create(self, validated_data):
        order_date = validated_data.get('order_date')
        if order_date is None:
            validated_data = {**validated_data, 'order_date': timezone.now().date()}
        order_number = validated_data.get('order_number') or validated_data.get('numero_commande') or ''
        return CommandeFournisseur.objects.create(
            fournisseur=validated_data['fournisseur'],
            restaurant=validated_data['restaurant'],
            numero_commande=order_number,
            date_commande=validated_data.get('order_date') or validated_data.get('date_commande') or timezone.now().date(),
            date_livraison_prevue=validated_data.get('expected_delivery_date') or validated_data.get('date_livraison_prevue'),
            statut=validated_data.get('status') or validated_data.get('statut', 'DRAFT'),
            montant_total=validated_data.get('total_amount') or validated_data.get('montant_total') or 0,
            notes=validated_data.get('notes', ''),
        )

    def validate(self, attrs):
        order_number = attrs.get('order_number') or attrs.get('numero_commande') or ''
        if order_number and CommandeFournisseur.objects.filter(numero_commande=order_number).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError({"order_number": "Une commande avec ce numéro existe déjà."})
        return attrs

    def update(self, instance, validated_data):
        if 'order_number' in validated_data or 'numero_commande' in validated_data:
            instance.numero_commande = validated_data.get('order_number') or validated_data.get('numero_commande') or instance.numero_commande
        if 'order_date' in validated_data or 'date_commande' in validated_data:
            instance.date_commande = validated_data.get('order_date') or validated_data.get('date_commande')
        if 'expected_delivery_date' in validated_data or 'date_livraison_prevue' in validated_data:
            instance.date_livraison_prevue = validated_data.get('expected_delivery_date') or validated_data.get('date_livraison_prevue')
        if 'status' in validated_data or 'statut' in validated_data:
            instance.statut = validated_data.get('status') or validated_data.get('statut')
        if 'total_amount' in validated_data or 'montant_total' in validated_data:
            instance.montant_total = validated_data.get('total_amount') or validated_data.get('montant_total')
        if 'notes' in validated_data:
            instance.notes = validated_data['notes']
        if 'fournisseur' in validated_data:
            instance.fournisseur = validated_data['fournisseur']
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        instance.save()
        return instance

