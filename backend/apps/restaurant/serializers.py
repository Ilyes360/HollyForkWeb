from rest_framework import serializers
from django.core.validators import RegexValidator
from apps.restaurant.models import Restaurant
from django.db.models import Sum

class RestaurantSerializer(serializers.HyperlinkedModelSerializer):
    restaurant_id = serializers.IntegerField(source='id_restaurant', read_only=True)
    name = serializers.CharField(source='nom_restaurant', max_length=100)
    address = serializers.CharField(source='adresse_restaurant', max_length=255)
    postal_code = serializers.CharField(source='code_postal', max_length=10)
    city = serializers.CharField(source='ville', max_length=100)
    phone_number = serializers.CharField(source='numero_telephone', max_length=20)
    siret = serializers.CharField(
        source='numero_siret',
        max_length=14,
        validators=[RegexValidator(r'^\d{14}$', 'Le SIRET doit contenir 14 chiffres.')]
    )
    naf_code = serializers.CharField(source='code_naf', max_length=10, required=False, allow_blank=True, allow_null=True)
    pin = serializers.CharField(source='pin_restaurant', max_length=6, required=True)
    logo_url = serializers.URLField(max_length=500, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Restaurant
        fields = ['restaurant_id', 'name', 'address', 'postal_code', 'city',
                  'phone_number', 'siret', 'naf_code', 'pin', 'logo_url']
        extra_kwargs = {
            'restaurant_id': {'read_only': True},
            'logo_url': {'required': False}
        }

    def create(self, validated_data):
        return Restaurant.objects.create(
            nom_restaurant=validated_data['nom_restaurant'],
            adresse_restaurant=validated_data['adresse_restaurant'],
            code_postal=validated_data['code_postal'],
            ville=validated_data['ville'],
            numero_telephone=validated_data['numero_telephone'],
            numero_siret=validated_data['numero_siret'],
            code_naf=validated_data.get('code_naf') or '',
            pin_restaurant=validated_data['pin_restaurant'],
            logo_url=validated_data.get('logo_url'),
        )

    def update(self, instance, validated_data):
        instance.nom_restaurant = validated_data.get('nom_restaurant', instance.nom_restaurant)
        instance.adresse_restaurant = validated_data.get('adresse_restaurant', instance.adresse_restaurant)
        instance.code_postal = validated_data.get('code_postal', instance.code_postal)
        instance.ville = validated_data.get('ville', instance.ville)
        instance.numero_telephone = validated_data.get('numero_telephone', instance.numero_telephone)
        instance.numero_siret = validated_data.get('numero_siret', instance.numero_siret)
        instance.code_naf = validated_data.get('code_naf', instance.code_naf)
        instance.pin_restaurant = validated_data.get('pin_restaurant', instance.pin_restaurant)
        instance.logo_url = validated_data.get('logo_url', instance.logo_url)
        instance.save()
        return instance

    @staticmethod
    def get_chiffre_affaire(restaurant_id: int, mois: int, annee: int) -> float:
        """
        Calcule le chiffre d'affaires pour un restaurant donné, pour un mois et une année spécifiques.

        Args:
            restaurant_id: L'ID du restaurant.
            mois: Le mois (1-12).
            annee: L'année.

        Returns:
            Le chiffre d'affaires calculé, ou 0.0 si aucune commande validée n'est trouvée.
        """
        from apps.commandes.models import Commande  # Importation locale pour éviter les imports circulaires potentiels

        if not (1 <= mois <= 12):
            raise ValueError("Le mois doit être compris entre 1 et 12.")

        chiffre_affaire_data = Commande.objects.filter(
            restaurant_id=restaurant_id,
            statut='VALIDEE',
            created_at__year=annee,
            created_at__month=mois
        ).aggregate(total_ca=Sum('montant'))

        total_ca = chiffre_affaire_data.get('total_ca')
        return float(total_ca) if total_ca is not None else 0.0
