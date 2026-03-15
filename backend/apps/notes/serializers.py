from rest_framework import serializers

from apps.restaurant.serializers import RestaurantSerializer
from apps.staff.models import Employe, RestaurantEmploye
from apps.notes.models import Note
from apps.restaurant.models import Restaurant
from apps.staff.serializers import EmployeSerializer

class NoteSerializer(serializers.HyperlinkedModelSerializer):
    """
    Serializer pour le modèle Note.
    Auteur : Benjamin DUSUNCELi
    Créé : 27/04/2025
    Version : 1.0
    """
    created_by = EmployeSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=Employe.objects.all(),
        source='created_by',
        write_only=True
    )
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.all(),
        source='restaurant',
        write_only=True
    )

    class Meta:
        model = Note
        fields = ['id', 'created_by', 'created_by_id', 'created_at', 'restaurant', 'restaurant_id', 'message']
        extra_kwargs = {
            'id': {'read_only': True},
            'created_at': {'read_only': True},
            'message': {'required': True},
            'restaurant_id': {'required': True}
        }

    def validate(self, data):
        """
        Vérifie que le message n'est pas vide ou uniquement composé d'espaces,
        que l'employé et le restaurant existent, et que l'employé est associé au restaurant.
        """
        message = data.get('message')
        created_by = data.get('created_by')
        restaurant = data.get('restaurant')

        # Vérifier que le message n'est pas vide
        if not message or message.strip() == "":
            raise serializers.ValidationError({"message": "Le message ne peut pas être vide."})

        # Vérifier l'existence de l'employé
        if created_by and not Employe.objects.filter(id=created_by.id).exists():
            raise serializers.ValidationError({"created_by": "L'employé spécifié n'existe pas."})

        # Vérifier l'existence du restaurant
        if restaurant and not Restaurant.objects.filter(id_restaurant=restaurant.id_restaurant).exists():
            raise serializers.ValidationError({"restaurant": "Le restaurant spécifié n'existe pas."})

        # Vérifier que l'employé est associé au restaurant
        if created_by and restaurant:
            if not RestaurantEmploye.objects.filter(restaurant=restaurant, employe=created_by).exists():
                raise serializers.ValidationError(
                    f"L'employé {created_by.nom} {created_by.prenom} n'est pas associé au restaurant {restaurant.nom_restaurant}."
                )

        return data