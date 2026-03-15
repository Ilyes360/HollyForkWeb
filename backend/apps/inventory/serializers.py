from rest_framework import serializers

from apps.inventory.models import Ingredient, Stock, Reapprovisionnement
from apps.restaurant.models import Restaurant
from apps.restaurant.serializers import RestaurantSerializer


class IngredientSerializer(serializers.HyperlinkedModelSerializer):
    name = serializers.CharField(source='nom', max_length=200)
    unit = serializers.CharField(source='unite', max_length=20)
    unit_price = serializers.DecimalField(source='prix_unitaire', max_digits=10, decimal_places=2)

    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'unit', 'unit_price']
        extra_kwargs = {
            'id': {'read_only': True}
        }

    def create(self, validated_data):
        return Ingredient.objects.create(
            nom=validated_data['name'],
            unite=validated_data['unit'],
            prix_unitaire=validated_data['unit_price'],
        )

    def update(self, instance, validated_data):
        instance.nom = validated_data.get('name', instance.nom)
        instance.unite = validated_data.get('unit', instance.unite)
        instance.prix_unitaire = validated_data.get('unit_price', instance.prix_unitaire)
        instance.save()
        return instance


class StockSerializer(serializers.HyperlinkedModelSerializer):
    quantity_in_stock = serializers.DecimalField(source='quantite_en_stock', max_digits=12, decimal_places=4)
    alert_threshold = serializers.DecimalField(source='seuil_alerte', max_digits=12, decimal_places=4, required=False)
    weighted_average_cost = serializers.DecimalField(
        source='cout_moyen_pondere', max_digits=10, decimal_places=2, read_only=True
    )
    restaurant = RestaurantSerializer(read_only=True)
    ingredient = IngredientSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), source='restaurant', write_only=True)
    ingredient_id = serializers.PrimaryKeyRelatedField(queryset=Ingredient.objects.all(), source='ingredient', write_only=True)

    class Meta:
        model = Stock
        fields = ['id', 'restaurant', 'ingredient', 'restaurant_id', 'ingredient_id', 'quantity_in_stock', 'alert_threshold', 'weighted_average_cost']
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def validate(self, data):
        restaurant = data.get('restaurant')
        ingredient = data.get('ingredient')
        if restaurant and ingredient:
            if Stock.objects.filter(restaurant=restaurant, ingredient=ingredient).exists() and not self.instance:
                raise serializers.ValidationError(
                    f"Un stock pour l'ingrédient {ingredient.nom} existe déjà pour ce restaurant."
                )
        return data

    def create(self, validated_data):
        return Stock.objects.create(
            restaurant=validated_data['restaurant'],
            ingredient=validated_data['ingredient'],
            quantite_en_stock=validated_data['quantity_in_stock'],
            seuil_alerte=validated_data.get('alert_threshold'),
        )

    def update(self, instance, validated_data):
        instance.quantite_en_stock = validated_data.get('quantity_in_stock', instance.quantite_en_stock)
        if 'alert_threshold' in validated_data:
            instance.seuil_alerte = validated_data['alert_threshold']
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        if 'ingredient' in validated_data:
            instance.ingredient = validated_data['ingredient']
        instance.save()
        return instance


class ReapprovisionnementSerializer(serializers.HyperlinkedModelSerializer):
    quantity_added = serializers.DecimalField(source='quantite_ajoutee', max_digits=12, decimal_places=4)
    added_at = serializers.DateTimeField(source='date_ajout', read_only=True)
    purchase_price = serializers.DecimalField(source='prix_achat', max_digits=10, decimal_places=2, required=False)
    restaurant = RestaurantSerializer(read_only=True)
    ingredient = IngredientSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), source='restaurant')
    ingredient_id = serializers.PrimaryKeyRelatedField(queryset=Ingredient.objects.all(), source='ingredient')

    class Meta:
        model = Reapprovisionnement
        fields = ['id', 'restaurant', 'ingredient', 'quantity_added', 'added_at', 'purchase_price', 'restaurant_id', 'ingredient_id']
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def validate(self, data):
        restaurant = data.get('restaurant')
        ingredient = data.get('ingredient')
        quantity_added = data.get('quantity_added')
        if restaurant and ingredient:
            if not Stock.objects.filter(restaurant=restaurant, ingredient=ingredient).exists():
                raise serializers.ValidationError(
                    f"Aucun stock trouvé pour l'ingrédient {ingredient.nom} dans ce restaurant."
                )
        if quantity_added <= 0:
            raise serializers.ValidationError("La quantité ajoutée doit être supérieure à zéro.")
        return data

    def create(self, validated_data):
        return Reapprovisionnement.objects.create(
            restaurant=validated_data['restaurant'],
            ingredient=validated_data['ingredient'],
            quantite_ajoutee=validated_data['quantity_added'],
            prix_achat=validated_data.get('purchase_price'),
        )

