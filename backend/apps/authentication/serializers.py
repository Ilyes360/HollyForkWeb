"""
Serializers pour l'authentification dans Holly Pi.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.validators import RegexValidator
from django.core.cache import cache
import secrets

from apps.staff.models import Employe, RestaurantEmploye, TypeEmploye
from apps.restaurant.models import Restaurant

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'inscription d'un nouvel utilisateur avec création d'employé et PIN code.
    """
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    # Employee fields (API: English snake_case)
    employee_last_name = serializers.CharField(required=True, max_length=100)
    employee_first_name = serializers.CharField(required=True, max_length=100)
    pin_code = serializers.CharField(
        required=True,
        max_length=4,
        min_length=4,
        validators=[RegexValidator(r'^\d{4}$', 'Le code PIN doit contenir exactement 4 chiffres.')]
    )
    type_employe_id = serializers.PrimaryKeyRelatedField(
        queryset=TypeEmploye.objects.all(),
        required=True,
        write_only=True
    )
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.all(),
        required=True,
        write_only=True
    )

    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'employee_first_name', 'employee_last_name',
            'pin_code', 'type_employe_id', 'restaurant_id'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })
        
        # Validate PIN code uniqueness within restaurant
        pin_code = attrs['pin_code']
        restaurant_id = attrs['restaurant_id']

        existing_restaurant_employes = RestaurantEmploye.objects.filter(
            restaurant=restaurant_id
        ).select_related('employe')

        for re in existing_restaurant_employes:
            if re.employe.pin_code and re.employe.pin_code == pin_code:
                raise serializers.ValidationError({
                    "pin_code": "Ce PIN code est déjà utilisé par un autre employé dans ce restaurant."
                })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None)
        employee_last_name = validated_data.pop('employee_last_name')
        employee_first_name = validated_data.pop('employee_first_name')
        pin_code = validated_data.pop('pin_code')
        type_employe = validated_data.pop('type_employe_id')
        restaurant = validated_data.pop('restaurant_id')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        employe = Employe.objects.create(
            user=user,
            nom=employee_last_name,
            prenom=employee_first_name,
            pin_code=pin_code,
            type_employe=type_employe
        )

        # Associate employee with restaurant
        RestaurantEmploye.objects.create(
            restaurant=restaurant,
            employe=employe
        )
        return user


class UserBasicSerializer(serializers.ModelSerializer):
    """
    Serializer simple pour la lecture des données utilisateur (utilisé dans les relations).
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id', 'username', 'email', 'first_name', 'last_name')


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer pour le profil utilisateur.
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'is_active', 'mfa_enabled')
        read_only_fields = ('id', 'username', 'date_joined', 'is_active', 'mfa_enabled')


class DeviceLoginSerializer(serializers.Serializer):
    """
    Serializer pour la connexion d'un équipement (iPad) au restaurant.
    Étape 1 : ID Restaurant + PIN Restaurant
    """
    restaurant_id = serializers.IntegerField(required=True)
    pin_restaurant = serializers.CharField(
        required=True,
        max_length=6,
        min_length=6,
        validators=[RegexValidator(r'^\d{6}$', 'Le PIN restaurant doit contenir exactement 6 chiffres.')]
    )

    def validate(self, attrs):
        restaurant_id = attrs['restaurant_id']
        pin_restaurant = attrs['pin_restaurant']

        try:
            restaurant = Restaurant.objects.get(id_restaurant=restaurant_id)
        except Restaurant.DoesNotExist:
            raise serializers.ValidationError(_('Restaurant introuvable.'))

        if not restaurant.pin_restaurant:
            raise serializers.ValidationError(_(
                'PIN restaurant non configuré. Veuillez contacter l\'administrateur.'
            ))

        if restaurant.pin_restaurant != pin_restaurant:
            raise serializers.ValidationError(_('PIN restaurant incorrect.'))

        # Generate device token
        device_token = secrets.token_urlsafe(32)

        # Store in cache for 30 days
        cache_key = f'device_{device_token}'
        cache.set(cache_key, {
            'restaurant_id': restaurant.id_restaurant,
            'restaurant_name': restaurant.nom_restaurant,
        }, timeout=2592000)

        return {
            'restaurant': restaurant,
            'device_token': device_token,
        }


class QuickLoginSerializer(serializers.Serializer):
    """
    Serializer pour la connexion rapide d'un employé.
    Utilise le device_token + PIN employé (4 chiffres)
    """
    device_token = serializers.CharField(required=True)
    pin_code = serializers.CharField(
        required=True,
        max_length=4,
        min_length=4,
        validators=[RegexValidator(r'^\d{4}$', 'Le code PIN employé doit contenir exactement 4 chiffres.')]
    )

    def validate(self, attrs):
        device_token = attrs['device_token']
        pin_code = attrs['pin_code']

        cache_key = f'device_{device_token}'
        device_data = cache.get(cache_key)

        if not device_data:
            raise serializers.ValidationError(_(
                'Équipement non configuré ou session expirée. Veuillez reconnecter l\'équipement.'
            ))

        restaurant_id = device_data['restaurant_id']

        # Find employee with this PIN in this restaurant
        restaurant_employes = RestaurantEmploye.objects.filter(
            restaurant__id_restaurant=restaurant_id
        ).select_related('employe', 'employe__type_employe', 'employe__user')

        employe = None
        for re in restaurant_employes:
            # Comparaison stricte en string pour éviter les problèmes de type
            if re.employe.pin_code and str(re.employe.pin_code).strip() == str(pin_code).strip():
                employe = re.employe
                break

        if not employe:
            # Vérifier si des employés existent dans ce restaurant pour le debug
            total_employes = restaurant_employes.count()
            employes_avec_pin = sum(1 for re in restaurant_employes if re.employe.pin_code)
            raise serializers.ValidationError({
                'non_field_errors': [
                    'Code PIN incorrect ou employé introuvable dans ce restaurant.',
                    f'Restaurant ID: {restaurant_id}, Total employés: {total_employes}, Employés avec PIN: {employes_avec_pin}'
                ]
            })

        if not employe.user:
            raise serializers.ValidationError(_(
                'Aucun utilisateur associé à cet employé.'
            ))

        if not employe.user.is_active:
            raise serializers.ValidationError(_('Compte utilisateur désactivé.'))

        # Generate JWT tokens
        refresh = RefreshToken.for_user(employe.user)

        return {
            'user': employe.user,
            'employe': employe,
            'restaurant_id': restaurant_id,
            'restaurant_name': device_data['restaurant_name'],
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class EmailPasswordLoginSerializer(serializers.Serializer):
    """
    Authentification par email + mot de passe uniquement.
    Retourne les tokens JWT et, si existant, le profil employé de l'utilisateur.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        email = (attrs.get('email') or '').strip()
        password = attrs.get('password')

        if not email:
            raise serializers.ValidationError({"email": _("Le champ 'email' est requis.")})
        if not password:
            raise serializers.ValidationError({"password": _("Le champ 'password' est requis.")})

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            user = None
        if user is None:
            raise serializers.ValidationError({"non_field_errors": [_("Identifiants invalides ou compte inactif.")]})

        user = authenticate(request=self.context.get('request'), username=user.username, password=password)
        if user is None:
            raise serializers.ValidationError({"non_field_errors": [_("Identifiants invalides ou compte inactif.")]})
        if not user.is_active:
            raise serializers.ValidationError({"non_field_errors": [_("Compte utilisateur désactivé.")]})

        refresh = RefreshToken.for_user(user)

        employee_payload = None
        try:
            employe = user.employe
            # Chercher un restaurant associé si présent
            restaurant_link = RestaurantEmploye.objects.filter(employe=employe).select_related('restaurant').first()
            employee_payload = {
                "employee_id": employe.id,
                "employee_name": f"{employe.prenom} {employe.nom}",
                "employee_first_name": employe.prenom,
                "employee_last_name": employe.nom,
                "employee_type": employe.type_employe.nom_type if employe.type_employe else None,
                "employee_type_id": employe.type_employe.id if employe.type_employe else None,
                "restaurant_id": restaurant_link.restaurant.id_restaurant if restaurant_link else None,
                "restaurant_name": restaurant_link.restaurant.nom_restaurant if restaurant_link else None,
            }
        except Employe.DoesNotExist:
            employee_payload = None

        return {
            "user": user,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "employee": employee_payload,
        }
