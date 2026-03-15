from rest_framework import serializers
from apps.salles.models import Salle, Table
from apps.restaurant.models import Restaurant
from apps.restaurant.serializers import RestaurantSerializer
from apps.staff.models import Employe, RestaurantEmploye
from apps.staff.serializers import EmployeSerializer

class SalleSerializer(serializers.HyperlinkedModelSerializer):
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.all(),
        source='restaurant',
        write_only=True
    )

    name = serializers.CharField(source='nom_salle', max_length=100)
    capacity = serializers.IntegerField(source='capacite')
    floor = serializers.IntegerField(source='etage', required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Salle
        fields = ['id', 'name', 'restaurant', 'restaurant_id', 'capacity', 'floor', 'description']
        extra_kwargs = {
            'id': {'read_only': True}
        }

    def validate(self, data):
        restaurant = data.get('restaurant')
        name = data.get('name')
        if restaurant and name:
            if Salle.objects.filter(restaurant=restaurant, nom_salle=name).exists() and not self.instance:
                raise serializers.ValidationError({
                    "non_field_errors": [f"Une salle nommée '{name}' existe déjà dans ce restaurant."]
                })
        return data

    def create(self, validated_data):
        return Salle.objects.create(
            nom_salle=validated_data.get('name') or validated_data.get('nom_salle'),
            restaurant=validated_data.get('restaurant'),
            capacite=validated_data.get('capacity') or validated_data.get('capacite'),
            etage=validated_data.get('floor') or validated_data.get('etage'),
            description=validated_data.get('description'),
        )

    def update(self, instance, validated_data):
        if 'name' in validated_data or 'nom_salle' in validated_data:
            instance.nom_salle = (validated_data.get('name') or validated_data.get('nom_salle') or instance.nom_salle)
        cap = validated_data.get('capacity', validated_data.get('capacite'))
        if cap is not None:
            instance.capacite = cap
        if 'floor' in validated_data or 'etage' in validated_data:
            instance.etage = validated_data.get('floor', validated_data.get('etage'))
        if 'description' in validated_data:
            instance.description = validated_data['description']
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        instance.save()
        return instance

class TableSerializer(serializers.HyperlinkedModelSerializer):
    salle = SalleSerializer(read_only=True)
    employee_in_charge = EmployeSerializer(read_only=True)
    salle_id = serializers.PrimaryKeyRelatedField(queryset=Salle.objects.all(), source='salle')
    employee_in_charge_id = serializers.PrimaryKeyRelatedField(queryset=Employe.objects.all(), source='employee_in_charge')

    class Meta:
        model = Table
        fields = ['id', 'numero', 'capacity', 'reserved_seats', 'is_occupied', 'salle', 'employee_in_charge', 'salle_id', 'employee_in_charge_id', 'position_x', 'position_y']
        extra_kwargs = {
            'id': {'read_only': True}
        }

    def validate(self, data):
        """
        Vérifie que la salle et l'employé existent, et que l'employé est associé au restaurant de la salle.
        """
        salle = data.get('salle')
        employee_in_charge = data.get('employee_in_charge')
        capacity = data.get('capacity')
        reserved_seats = data.get('reserved_seats', 0)
        numero = data.get('numero', 1)
        
        if salle and employee_in_charge:
            restaurant = salle.restaurant
            if not RestaurantEmploye.objects.filter(restaurant=restaurant, employe=employee_in_charge).exists():
                raise serializers.ValidationError(
                    f"L'employé {employee_in_charge.nom} {employee_in_charge.prenom} n'est pas associé au restaurant de cette salle."
                )
        
        if capacity <= 0:
            raise serializers.ValidationError("La capacité de la table doit être supérieure à zéro.")
        
        if reserved_seats > capacity:
            raise serializers.ValidationError("Le nombre de sièges réservés ne peut pas dépasser la capacité.")
        
        # Vérifier que le numéro de table est unique pour cette salle
        if salle:
            if Table.objects.filter(salle=salle, numero=numero).exists() and not self.instance:
                raise serializers.ValidationError(f"Une table avec le numéro {numero} existe déjà dans cette salle.")
            elif self.instance and self.instance.salle == salle and self.instance.numero != numero:
                if Table.objects.filter(salle=salle, numero=numero).exists():
                    raise serializers.ValidationError(f"Une table avec le numéro {numero} existe déjà dans cette salle.")
        
        return data


