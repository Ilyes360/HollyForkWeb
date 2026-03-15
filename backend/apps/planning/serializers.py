from rest_framework import serializers
from .models import Shift
from apps.staff.serializers import EmployeSerializer
from apps.restaurant.serializers import RestaurantSerializer
from apps.staff.models import Employe
from apps.restaurant.models import Restaurant


class ShiftSerializer(serializers.ModelSerializer):
    employe = EmployeSerializer(read_only=True)
    employe_id = serializers.PrimaryKeyRelatedField(queryset=Employe.objects.all(), source='employe', write_only=True)
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), source='restaurant', write_only=True)

    start_date = serializers.DateTimeField(source='date_debut')
    end_date = serializers.DateTimeField(source='date_fin')
    shift_type = serializers.CharField(source='type_shift', required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Shift
        fields = ['id', 'employe', 'employe_id', 'restaurant', 'restaurant_id',
                  'start_date', 'end_date', 'shift_type', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        from apps.planning.models import Shift
        return Shift.objects.create(
            employe=validated_data['employe'],
            restaurant=validated_data['restaurant'],
            date_debut=validated_data['start_date'],
            date_fin=validated_data['end_date'],
            type_shift=validated_data.get('shift_type', ''),
            notes=validated_data.get('notes', ''),
        )

    def update(self, instance, validated_data):
        instance.date_debut = validated_data.get('start_date', instance.date_debut)
        instance.date_fin = validated_data.get('end_date', instance.date_fin)
        instance.type_shift = validated_data.get('shift_type', instance.type_shift)
        instance.notes = validated_data.get('notes', instance.notes)
        if 'employe' in validated_data:
            instance.employe = validated_data['employe']
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        instance.save()
        return instance

