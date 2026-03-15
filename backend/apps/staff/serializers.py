from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.authentication.serializers import UserBasicSerializer
from apps.restaurant.serializers import RestaurantSerializer
from apps.staff.models import RestaurantEmploye, TypeEmploye, Employe
from apps.restaurant.models import Restaurant

User = get_user_model()

class TypeEmployeSerializer(serializers.HyperlinkedModelSerializer):
    type_name = serializers.CharField(source='nom_type', max_length=50)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = TypeEmploye
        fields = ['id', 'type_name', 'description']
        extra_kwargs = {
            'id': {'read_only': True}
        }

    def create(self, validated_data):
        return TypeEmploye.objects.create(
            nom_type=validated_data.get('type_name') or validated_data.get('nom_type', ''),
            description=validated_data.get('description'),
        )

    def update(self, instance, validated_data):
        instance.nom_type = validated_data.get('type_name', instance.nom_type)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance


class EmployeSerializer(serializers.HyperlinkedModelSerializer):
    last_name = serializers.CharField(source='nom', max_length=100)
    first_name = serializers.CharField(source='prenom', max_length=100)
    salary = serializers.DecimalField(source='salaire', max_digits=10, decimal_places=2, required=False, default=0)
    hire_date = serializers.DateField(source='date_embauche', required=False)
    phone_number = serializers.CharField(source='numero_telephone', max_length=20, required=False, allow_blank=True)
    type_employe = TypeEmployeSerializer(read_only=True)
    type_employe_id = serializers.PrimaryKeyRelatedField(
        queryset=TypeEmploye.objects.all(),
        source='type_employe',
        write_only=True
    )
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True,
        required=False
    )

    class Meta:
        model = Employe
        fields = [
            'id',
            'user',
            'user_id',
            'last_name',
            'first_name',
            'type_employe',
            'type_employe_id',
            'salary',
            'hire_date',
            'phone_number',
        ]
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def validate(self, data):
        user = data.get('user')
        if user and Employe.objects.filter(user=user).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError({"user": "Cet utilisateur est déjà associé à un autre employé."})
        return data

    def create(self, validated_data):
        from decimal import Decimal
        kwargs = {
            'nom': validated_data.get('last_name') or validated_data.get('nom', ''),
            'prenom': validated_data.get('first_name') or validated_data.get('prenom', ''),
            'type_employe': validated_data.get('type_employe'),
            'salaire': validated_data.get('salary', validated_data.get('salaire', Decimal('0.00'))),
            'numero_telephone': validated_data.get('phone_number') or validated_data.get('numero_telephone') or '',
        }
        if 'user' in validated_data:
            kwargs['user'] = validated_data['user']
        if 'hire_date' in validated_data or 'date_embauche' in validated_data:
            kwargs['date_embauche'] = validated_data.get('hire_date') or validated_data.get('date_embauche')
        return Employe.objects.create(**kwargs)

    def update(self, instance, validated_data):
        ln = validated_data.get('last_name', validated_data.get('nom'))
        if ln is not None:
            instance.nom = ln
        fn = validated_data.get('first_name', validated_data.get('prenom'))
        if fn is not None:
            instance.prenom = fn
        if 'salary' in validated_data or 'salaire' in validated_data:
            instance.salaire = validated_data.get('salary', validated_data.get('salaire', instance.salaire))
        if 'hire_date' in validated_data or 'date_embauche' in validated_data:
            instance.date_embauche = validated_data.get('hire_date') or validated_data.get('date_embauche')
        if 'phone_number' in validated_data or 'numero_telephone' in validated_data:
            instance.numero_telephone = validated_data.get('phone_number') or validated_data.get('numero_telephone') or instance.numero_telephone
        if 'type_employe' in validated_data:
            instance.type_employe = validated_data['type_employe']
        if 'user' in validated_data:
            instance.user = validated_data['user']
        instance.save()
        return instance
    
class RestaurantEmployeSerializer(serializers.HyperlinkedModelSerializer):
    restaurant = RestaurantSerializer(read_only=True)
    employe = EmployeSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.all(), source='restaurant', write_only=True
    )
    employe_id = serializers.PrimaryKeyRelatedField(
        queryset=Employe.objects.all(), source='employe', write_only=True
    )

    class Meta:
        model = RestaurantEmploye
        fields = ['id', 'restaurant', 'employe', 'restaurant_id', 'employe_id']
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def validate(self, data):
        """Vérifie que l'employé et le restaurant existent et sont cohérents."""
        restaurant = data.get('restaurant')
        employe = data.get('employe')
        if restaurant and employe:
            if RestaurantEmploye.objects.filter(restaurant=restaurant, employe=employe).exists():
                raise serializers.ValidationError("Cette association restaurant-employé existe déjà.")
        return data
