from rest_framework import serializers
from decimal import Decimal
from django.db.models import Sum

from apps.billing.models import Facture, LigneFacture, Paiement, MethodePaiement
from apps.restaurant.serializers import RestaurantSerializer
from apps.menu.serializers import ArticleSerializer

class MethodePaiementSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='nom', max_length=255)

    class Meta:
        model = MethodePaiement
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class PaiementSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(source='montant', max_digits=10, decimal_places=2)
    methode_paiement = MethodePaiementSerializer(read_only=True)
    methode_paiement_id = serializers.PrimaryKeyRelatedField(
        queryset=MethodePaiement.objects.all(),
        source='methode_paiement',
        write_only=True
    )
    facture_id = serializers.PrimaryKeyRelatedField(
        queryset=Facture.objects.all(),
        source='facture',
        write_only=True
    )

    class Meta:
        model = Paiement
        fields = ['id', 'facture_id', 'methode_paiement', 'methode_paiement_id', 'amount', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        facture = attrs.get('facture')
        amount = attrs.get('amount', attrs.get('montant'))
        if facture is None or amount is None:
            return attrs
        amount = Decimal(str(amount))
        total_actuel = facture.paiements.aggregate(total=Sum('montant'))['total'] or Decimal('0.00')
        if total_actuel + amount > facture.montant_ttc:
            raise serializers.ValidationError(
                {'amount': f'Le total des paiements ne peut pas dépasser le montant TTC de la facture '
                          f'({facture.montant_ttc} €). Déjà payé : {total_actuel} €, reste à payer : '
                          f'{facture.montant_ttc - total_actuel} €.'}
            )
        if facture.etat == 'annulee':
            raise serializers.ValidationError(
                {'facture_id': 'Impossible d\'enregistrer un paiement sur une facture annulée.'}
            )
        return attrs

    def create(self, validated_data):
        montant = validated_data.get('amount', validated_data.get('montant'))
        return Paiement.objects.create(
            facture=validated_data['facture'],
            methode_paiement=validated_data['methode_paiement'],
            montant=montant,
        )


class LigneFactureSerializer(serializers.ModelSerializer):
    product = ArticleSerializer(read_only=True, source='produit')
    quantity = serializers.IntegerField(source='quantite')
    unit_price_before_tax = serializers.DecimalField(
        source='prix_unitaire_ht', max_digits=10, decimal_places=2
    )
    unit_price_including_tax = serializers.DecimalField(
        source='prix_unitaire_ttc', max_digits=10, decimal_places=2, read_only=True
    )
    vat_rate = serializers.SerializerMethodField()
    vat_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, source='calculer_tva')
    amount_including_tax = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True, source='calculer_montant_ttc'
    )

    class Meta:
        model = LigneFacture
        fields = ['id', 'product', 'quantity', 'unit_price_before_tax', 'unit_price_including_tax',
                  'vat_rate', 'vat_amount', 'amount_including_tax']
        read_only_fields = ['id', 'unit_price_including_tax']

    def get_vat_rate(self, obj) -> float | None:
        return float(obj.taux_tva.taux) if obj.taux_tva_id else None


class FactureSerializer(serializers.ModelSerializer):
    number = serializers.CharField(source='numero')
    amount_before_tax = serializers.DecimalField(
        source='montant_ht', max_digits=10, decimal_places=2, read_only=True
    )
    amount_including_tax = serializers.DecimalField(
        source='montant_ttc', max_digits=10, decimal_places=2, read_only=True
    )
    vat_amount = serializers.DecimalField(
        source='montant_tva', max_digits=10, decimal_places=2, read_only=True
    )
    amount_paid = serializers.DecimalField(
        source='montant_paye', max_digits=10, decimal_places=2, read_only=True
    )
    amount_due = serializers.DecimalField(
        source='reste_a_payer', max_digits=10, decimal_places=2, read_only=True
    )
    state = serializers.CharField(source='etat')
    vat_by_rate = serializers.SerializerMethodField()
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Facture.objects.none(),
        source='restaurant',
        write_only=True,
        required=False
    )
    lignes = LigneFactureSerializer(many=True, read_only=True)

    class Meta:
        model = Facture
        fields = [
            'id', 'number', 'date', 'amount_before_tax', 'amount_including_tax', 'vat_amount',
            'amount_paid', 'amount_due',
            'restaurant', 'restaurant_id', 'commande', 'state', 'created_at',
            'lignes', 'vat_by_rate',
        ]
        read_only_fields = ['id', 'amount_before_tax', 'amount_including_tax', 'vat_amount', 'created_at']

    def get_vat_by_rate(self, obj) -> dict:
        tva_dict = obj.get_tva_par_taux()
        return {str(taux): float(montant) for taux, montant in tva_dict.items()}

    def create(self, validated_data):
        return Facture.objects.create(
            numero=validated_data['number'],
            date=validated_data['date'],
            restaurant=validated_data['restaurant'],
            commande=validated_data['commande'],
            etat=validated_data.get('state', 'en_attente'),
        )

    def update(self, instance, validated_data):
        if 'number' in validated_data:
            instance.numero = validated_data['number']
        if 'date' in validated_data:
            instance.date = validated_data['date']
        if 'state' in validated_data:
            instance.etat = validated_data['state']
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        if 'commande' in validated_data:
            instance.commande = validated_data['commande']
        instance.save()
        return instance

