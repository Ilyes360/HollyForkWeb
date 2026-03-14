from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Reservation, SupplierOrder, TeamShift, RoomMap


class RoomMapSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomMap
        fields = ['id', 'name', 'elements', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        email = validated_data['email']
        # Django User requires a unique username; use normalized email
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
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})


class ReservationSerializer(serializers.ModelSerializer):
    heure = serializers.CharField(source='heure')
    statutType = serializers.CharField(source='statut_type')

    class Meta:
        model = Reservation
        fields = ['id', 'client', 'heure', 'couverts', 'canal', 'statut', 'statutType']


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
