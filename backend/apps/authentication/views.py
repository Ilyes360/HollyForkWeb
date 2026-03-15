from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, get_user_model, logout
from django.middleware.csrf import get_token
from django.core.cache import cache
import secrets
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer, OpenApiParameter
from rest_framework import serializers as drf_serializers
from apps.staff.models import Employe, RestaurantEmploye
from django.utils.translation import gettext_lazy as _
from rest_framework_simplejwt.tokens import RefreshToken
import pyotp

from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    DeviceLoginSerializer,
    QuickLoginSerializer,
    EmailPasswordLoginSerializer,
)


@extend_schema(
    request=None,
    responses={
        200: inline_serializer(
            name='HealthCheckResponse',
            fields={'status': drf_serializers.CharField()},
        ),
    },
)
class HealthCheckView(APIView):
    """
    Endpoint de health check simple pour le monitoring.
    Ne nécessite pas d'authentification et renvoie toujours 200 par défaut.
    """
    permission_classes = [AllowAny]
    throttle_classes = []

    def get(self, request):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)

# Helper function to get employee info
def get_employee_info(user):
    """
    Helper function to get employee ID, name, and type for a user.
    Returns None if user has no associated employee.
    """
    try:
        employe = user.employe
        return {
            "employee_id": employe.id,
            "employee_name": f"{employe.prenom} {employe.nom}",
            "employee_first_name": employe.prenom,
            "employee_last_name": employe.nom,
            "employee_type": employe.type_employe.nom_type,
            "employee_type_id": employe.type_employe.id,
        }
    except (AttributeError, Employe.DoesNotExist):
        # User has no associated employee
        return None

@extend_schema(
    request=UserRegistrationSerializer,
    responses={
        201: inline_serializer(
            name='RegistrationSuccess',
            fields={
                'message': drf_serializers.CharField(),
                'id_user': drf_serializers.IntegerField(),
                'username': drf_serializers.CharField(),
                'email': drf_serializers.EmailField(),
                'first_name': drf_serializers.CharField(),
                'last_name': drf_serializers.CharField(),
                'verification_token': drf_serializers.CharField(allow_null=True),
                'next_step': drf_serializers.CharField(allow_null=True),
                'employee_id': drf_serializers.IntegerField(allow_null=True),
                'employee_name': drf_serializers.CharField(allow_null=True),
                'employee_first_name': drf_serializers.CharField(allow_null=True),
                'employee_last_name': drf_serializers.CharField(allow_null=True),
                'employee_type': drf_serializers.CharField(allow_null=True),
                'employee_type_id': drf_serializers.IntegerField(allow_null=True),
            },
        ),
        400: inline_serializer(name='RegistrationErrors', fields={'detail': drf_serializers.DictField()}),
    },
)
class UserRegistrationView(APIView):
    """
    Inscription d'un nouvel utilisateur avec création d'employé.
    Aucune authentification utilisateur requise.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(username=username, password=password)
            if user is not None:
                # Generate verification token for PIN step (same as login flow)
                verification_token = secrets.token_urlsafe(32)

                # Get the employee that was just created
                try:
                    employe = user.employe
                    cache_key = f'pin_verification_{verification_token}'
                    cache.set(cache_key, {
                        'user_id': user.id,
                        'employee_id': employe.id,
                        'username': user.username,
                    }, timeout=300)

                    response_data = {
                        "message": "Utilisateur créé avec succès. Veuillez vérifier votre PIN.",
                        "id_user": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "verification_token": verification_token,
                        "next_step": "verify_pin",
                        "employee_id": employe.id,
                        "employee_name": f"{employe.prenom} {employe.nom}",
                        "employee_first_name": employe.prenom,
                        "employee_last_name": employe.nom,
                        "employee_type": employe.type_employe.nom_type,
                        "employee_type_id": employe.type_employe.id,
                    }
                except Employe.DoesNotExist:
                    # Fallback if employee wasn't created (shouldn't happen)
                    response_data = {
                        "message": "Utilisateur créé avec succès.",
                        "id_user": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    }

                return Response(response_data, status=status.HTTP_201_CREATED)# Générer les tokens JWT
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    request=None,
    responses={
        200: inline_serializer(
            name='LogoutResponse',
            fields={'message': drf_serializers.CharField()},
        ),
    },
)
class LogoutView(APIView):
    """Déconnexion. POST sans body."""
    permission_classes = [AllowAny]

    def post(self, request):
        if request.user.is_authenticated:
            logout(request)
            return Response({
                "message": "Déconnexion réussie"
            }, status=status.HTTP_200_OK)
        return Response({
            "message": "Aucun utilisateur connecté"
        }, status=status.HTTP_200_OK)

@extend_schema(
    responses={
        200: inline_serializer(
            name='CsrfTokenResponse',
            fields={'csrfToken': drf_serializers.CharField()},
        ),
    },
)
class GetCSRFTokenView(APIView):
    """
    Récupération du token CSRF.
    Aucune authentification utilisateur requise.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        csrf_token = get_token(request)
        return Response({'csrfToken': csrf_token})

@extend_schema_view(
    get=extend_schema(responses={200: UserProfileSerializer}),
    patch=extend_schema(
        request=UserProfileSerializer,
        responses={
            200: inline_serializer(
                name='ProfileUpdateResponse',
                fields={
                    'message': drf_serializers.CharField(),
                    'user': drf_serializers.DictField(),
                },
            ),
            400: inline_serializer(name='ProfileUpdateValidationErrors', fields={'detail': drf_serializers.DictField()}),
        },
    ),
    delete=extend_schema(
        responses={
            200: inline_serializer(
                name='ProfileDeleteResponse',
                fields={'message': drf_serializers.CharField()},
            ),
        },
    ),
)
class UserProfileView(APIView):
    """
    Récupérer le profil de l'utilisateur connecté avec les informations de l'employé.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Récupérer le profil de l'utilisateur connecté.
        """
        serializer = UserProfileSerializer(request.user)
        response_data = serializer.data.copy()

        # Add employee info (name and type) if available
        employee_info = get_employee_info(request.user)
        if employee_info:
            response_data.update(employee_info)

        return Response(response_data, status=status.HTTP_200_OK)

    def patch(self, request):
        """
        Mettre à jour partiellement le profil de l'utilisateur.
        """
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profil mis à jour avec succès",
                "user": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """
        Supprimer le compte de l'utilisateur connecté.
        """
        user = request.user
        username = user.username
        user.delete()
        return Response({
            "message": f"Compte utilisateur '{username}' supprimé avec succès"
        }, status=status.HTTP_200_OK)


@extend_schema(
    request=None,
    responses={
        200: inline_serializer(
            name='DeleteAccountResponse',
            fields={'message': drf_serializers.CharField()},
        ),
        401: inline_serializer(
            name='DeleteAccountUnauthorized',
            fields={'detail': drf_serializers.CharField()},
        ),
    },
    description='Supprime le compte de l\'utilisateur connecté. Requiert authentification (header Authorization: Token <jwt> ou Bearer <jwt>).',
)
class DeleteAccountView(APIView):
    """
    Suppression du compte de l'utilisateur connecté (POST).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        username = user.username
        user.delete()
        return Response({
            "message": f"Compte utilisateur '{username}' supprimé avec succès"
        }, status=status.HTTP_200_OK)


@extend_schema(
    request=DeviceLoginSerializer,
    responses={
        200: inline_serializer(
            name='DeviceLoginResponse',
            fields={
                'message': drf_serializers.CharField(),
                'device_token': drf_serializers.CharField(),
                'restaurant_id': drf_serializers.IntegerField(),
                'restaurant_name': drf_serializers.CharField(),
                'restaurant_ville': drf_serializers.CharField(allow_null=True),
                'next_step': drf_serializers.CharField(),
            },
        ),
        400: inline_serializer(
            name='DeviceLoginValidationErrors',
            fields={'detail': drf_serializers.DictField(required=False)},
        ),
    },
)
class DeviceLoginView(APIView):
    """
    Connexion d'un équipement (iPad) au restaurant.
    Première étape : ID Restaurant + PIN Restaurant → Device Token
    Aucune authentification utilisateur requise.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DeviceLoginSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            restaurant = validated_data['restaurant']
            device_token = validated_data['device_token']

            response_data = {
                "message": "Équipement connecté au restaurant avec succès",
                "device_token": device_token,
                "restaurant_id": restaurant.id_restaurant,
                "restaurant_name": restaurant.nom_restaurant,
                "restaurant_ville": restaurant.ville,
                "next_step": "quick_login"
            }

            return Response(response_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    parameters=[OpenApiParameter(name='device_token', type=str, required=True, description='Token équipement')],
    responses={
        200: inline_serializer(
            name='RestaurantEmployeesResponse',
            fields={
                'restaurant_id': drf_serializers.IntegerField(),
                'restaurant_name': drf_serializers.CharField(),
                'employees': drf_serializers.ListField(child=drf_serializers.DictField()),
                'total': drf_serializers.IntegerField(),
            },
        ),
        400: inline_serializer(name='RestaurantEmployeesError', fields={'error': drf_serializers.CharField()}),
        401: inline_serializer(name='RestaurantEmployeesUnauthorized', fields={'error': drf_serializers.CharField()}),
    },
)
class GetRestaurantEmployeesView(APIView):
    """
    Récupère la liste des employés d'un restaurant après connexion device.
    Utilise le device_token pour identifier le restaurant.
    Aucune authentification utilisateur requise.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        device_token = request.query_params.get('device_token')
        
        if not device_token:
            return Response({
                "error": "device_token est requis en paramètre de requête"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cache_key = f'device_{device_token}'
        device_data = cache.get(cache_key)
        
        if not device_data:
            return Response({
                "error": "Équipement non configuré ou session expirée. Veuillez reconnecter l'équipement."
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        restaurant_id = device_data['restaurant_id']
        
        # Récupérer tous les employés du restaurant avec leurs informations
        restaurant_employes = RestaurantEmploye.objects.filter(
            restaurant__id_restaurant=restaurant_id
        ).select_related('employe', 'employe__type_employe', 'employe__user')
        
        employees_list = []
        for re in restaurant_employes:
            employe = re.employe
            # Ne retourner que les employés qui ont un PIN (peuvent se connecter)
            if employe.pin_code and employe.user and employe.user.is_active:
                employees_list.append({
                    "employee_id": employe.id,
                    "employee_name": f"{employe.prenom} {employe.nom}",
                    "employee_first_name": employe.prenom,
                    "employee_last_name": employe.nom,
                    "employee_type": employe.type_employe.nom_type,
                    "employee_type_id": employe.type_employe.id,
                    "has_pin": True  # Indique que l'employé peut se connecter
                })
        
        return Response({
            "restaurant_id": restaurant_id,
            "restaurant_name": device_data['restaurant_name'],
            "employees": employees_list,
            "total": len(employees_list)
        }, status=status.HTTP_200_OK)


@extend_schema(
    request=QuickLoginSerializer,
    responses={
        200: inline_serializer(
            name='QuickLoginResponse',
            fields={
                'message': drf_serializers.CharField(),
                'access_token': drf_serializers.CharField(),
                'refresh_token': drf_serializers.CharField(),
                'user_id': drf_serializers.IntegerField(),
                'username': drf_serializers.CharField(),
                'employee_id': drf_serializers.IntegerField(),
                'employee_name': drf_serializers.CharField(),
                'employee_first_name': drf_serializers.CharField(),
                'employee_last_name': drf_serializers.CharField(),
                'employee_type': drf_serializers.CharField(),
                'employee_type_id': drf_serializers.IntegerField(),
                'restaurant_id': drf_serializers.IntegerField(),
                'restaurant_name': drf_serializers.CharField(),
            },
        ),
        400: inline_serializer(
            name='QuickLoginValidationErrors',
            fields={'detail': drf_serializers.DictField(required=False)},
        ),
    },
)
class QuickLoginView(APIView):
    """
    Connexion rapide d'un employé avec son PIN.
    Utilise le device_token (restaurant déjà configuré) + PIN employé
    Aucune authentification utilisateur requise.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = QuickLoginSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            user = validated_data['user']
            employe = validated_data['employe']

            response_data = {
                "message": "Connexion réussie",
                "access_token": validated_data['access'],
                "refresh_token": validated_data['refresh'],
                "user_id": user.id,
                "username": user.username,
                "employee_id": employe.id,
                "employee_name": f"{employe.prenom} {employe.nom}",
                "employee_first_name": employe.prenom,
                "employee_last_name": employe.nom,
                "employee_type": employe.type_employe.nom_type,
                "employee_type_id": employe.type_employe.id,
                "restaurant_id": validated_data['restaurant_id'],
                "restaurant_name": validated_data['restaurant_name']
            }

            return Response(response_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    request=EmailPasswordLoginSerializer,
    responses={
        200: inline_serializer(
            name='LoginResponse',
            fields={
                'message': drf_serializers.CharField(),
                'access_token': drf_serializers.CharField(allow_null=True),
                'token': drf_serializers.CharField(allow_null=True),
                'refresh_token': drf_serializers.CharField(allow_null=True),
                'requires_mfa': drf_serializers.BooleanField(allow_null=True),
                'temp_token': drf_serializers.CharField(allow_null=True),
                'user_id': drf_serializers.IntegerField(allow_null=True),
                'username': drf_serializers.CharField(),
                'email': drf_serializers.EmailField(),
                'first_name': drf_serializers.CharField(),
                'last_name': drf_serializers.CharField(),
                'employee_id': drf_serializers.IntegerField(allow_null=True),
                'employee_name': drf_serializers.CharField(allow_null=True),
                'employee_first_name': drf_serializers.CharField(allow_null=True),
                'employee_last_name': drf_serializers.CharField(allow_null=True),
                'employee_type': drf_serializers.CharField(allow_null=True),
                'employee_type_id': drf_serializers.IntegerField(allow_null=True),
                'restaurant_id': drf_serializers.IntegerField(allow_null=True),
                'restaurant_name': drf_serializers.CharField(allow_null=True),
            },
        ),
        400: inline_serializer(
            name='LoginValidationErrors',
            fields={'detail': drf_serializers.DictField(required=False)},
        ),
    },
    description='Login par email + mot de passe. Si MFA est activé, la réponse contient requires_mfa=true et temp_token ; envoyer ensuite temp_token + code TOTP à POST /api/auth/verify-mfa/ pour obtenir les tokens. Envoyer le JWT dans le header Authorization: Token <access_token> ou Authorization: Bearer <access_token>.',
)
class EmailPasswordLoginView(APIView):
    """
    Authentification par email + mot de passe → tokens JWT.
    Si MFA est activé pour l'utilisateur, renvoie requires_mfa + temp_token au lieu des tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailPasswordLoginSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            user = data["user"]
            # Si MFA activé : ne pas renvoyer les tokens, exiger le code TOTP
            if getattr(user, "mfa_enabled", False) and getattr(user, "totp_secret", ""):
                temp_token = secrets.token_urlsafe(32)
                cache_key = f"mfa_temp_{temp_token}"
                cache.set(cache_key, {"user_id": user.id}, timeout=300)
                return Response({
                    "requires_mfa": True,
                    "temp_token": temp_token,
                    "email": user.email or "",
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
                }, status=status.HTTP_200_OK)
            access = data["access"]
            response = {
                "message": "Connexion réussie",
                "access_token": access,
                "token": access,
                "refresh_token": data["refresh"],
                "user_id": data["user"].id,
                "username": data["user"].username,
                "email": data["user"].email,
                "first_name": data["user"].first_name,
                "last_name": data["user"].last_name,
            }
            if data.get("employee"):
                response.update(data["employee"])
            return Response(response, status=status.HTTP_200_OK)
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Login failed: {serializer.errors}, data received: {request.data}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── MFA (TOTP) ─────────────────────────────────────────────────────────────

def _login_response_with_tokens(user):
    """Construit la réponse login (tokens + infos user/employé). Inclut 'token' comme alias de access_token pour le frontend."""
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    response = {
        "message": "Connexion réussie",
        "access_token": access,
        "token": access,
        "refresh_token": str(refresh),
        "user_id": user.id,
        "username": user.username,
        "email": user.email or "",
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
    }
    emp_info = get_employee_info(user)
    if emp_info:
        response.update(emp_info)
    return response


@extend_schema(
    request=inline_serializer(
        name="VerifyMFASerializer",
        fields={
            "temp_token": drf_serializers.CharField(help_text="Token reçu après login quand MFA est requis"),
            "code": drf_serializers.CharField(help_text="Code à 6 chiffres de l'app TOTP"),
        },
    ),
    responses={
        200: inline_serializer(
            name="VerifyMFASuccess",
            fields={
                "message": drf_serializers.CharField(),
                "access_token": drf_serializers.CharField(),
                "token": drf_serializers.CharField(),
                "refresh_token": drf_serializers.CharField(),
                "user_id": drf_serializers.IntegerField(),
                "username": drf_serializers.CharField(),
                "email": drf_serializers.EmailField(),
                "first_name": drf_serializers.CharField(),
                "last_name": drf_serializers.CharField(),
            },
        ),
        400: inline_serializer(name="VerifyMFAError", fields={"detail": drf_serializers.CharField()}),
        401: inline_serializer(name="VerifyMFAUnauthorized", fields={"detail": drf_serializers.CharField()}),
    },
)
class VerifyMFAView(APIView):
    """
    Vérification du code TOTP après un login avec MFA.
    Corps : temp_token (reçu au login), code (6 chiffres).
    Retourne les tokens JWT en cas de succès.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        User = get_user_model()
        temp_token = (request.data.get("temp_token") or "").strip()
        code = (request.data.get("code") or "").strip().replace(" ", "")
        if not temp_token or not code:
            return Response(
                {"detail": "temp_token et code sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cache_key = f"mfa_temp_{temp_token}"
        payload = cache.get(cache_key)
        if not payload:
            return Response(
                {"detail": "Session expirée ou token invalide. Veuillez vous reconnecter."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            user = User.objects.get(pk=payload["user_id"])
        except User.DoesNotExist:
            cache.delete(cache_key)
            return Response(
                {"detail": "Utilisateur introuvable."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not getattr(user, "totp_secret", "") or not getattr(user, "mfa_enabled", False):
            cache.delete(cache_key)
            return Response(
                {"detail": "MFA non activé pour ce compte."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(code, valid_window=1):
            return Response(
                {"detail": "Code de vérification invalide."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        cache.delete(cache_key)
        return Response(_login_response_with_tokens(user), status=status.HTTP_200_OK)


@extend_schema(
    responses={
        200: inline_serializer(
            name="MFASetupResponse",
            fields={
                "secret": drf_serializers.CharField(),
                "otpauth_url": drf_serializers.CharField(),
            },
        ),
        400: inline_serializer(name="MFASetupError", fields={"detail": drf_serializers.CharField()}),
    },
)
class MFASetupView(APIView):
    """
    Génère un secret TOTP et l'URL otpauth (QR code).
    N'active pas le MFA tant que mfa/confirm n'est pas appelé avec un code valide.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if getattr(user, "mfa_enabled", False):
            return Response(
                {"detail": "Le MFA est déjà activé."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        secret = pyotp.random_base32()
        user.totp_secret = secret
        user.save(update_fields=["totp_secret"])
        totp = pyotp.TOTP(secret)
        issuer = "HollyFork"
        otpauth_url = totp.provisioning_uri(name=user.email or user.username, issuer_name=issuer)
        return Response({"secret": secret, "otpauth_url": otpauth_url}, status=status.HTTP_200_OK)


@extend_schema(
    request=inline_serializer(
        name="MFAConfirmSerializer",
        fields={"code": drf_serializers.CharField(help_text="Code à 6 chiffres")},
    ),
    responses={
        200: inline_serializer(name="MFAConfirmSuccess", fields={"detail": drf_serializers.CharField()}),
        400: inline_serializer(name="MFAConfirmError", fields={"detail": drf_serializers.CharField()}),
    },
)
class MFAConfirmView(APIView):
    """
    Vérifie le code TOTP et active le MFA pour l'utilisateur.
    Appeler mfa/setup avant pour obtenir le QR / secret.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        code = (request.data.get("code") or "").strip().replace(" ", "")
        if not code:
            return Response({"detail": "Le code est requis."}, status=status.HTTP_400_BAD_REQUEST)
        if not getattr(user, "totp_secret", ""):
            return Response(
                {"detail": "Appelez d'abord MFA setup pour générer le QR code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if getattr(user, "mfa_enabled", False):
            return Response({"detail": "Le MFA est déjà activé."}, status=status.HTTP_400_BAD_REQUEST)
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(code, valid_window=1):
            return Response({"detail": "Code de vérification invalide."}, status=status.HTTP_400_BAD_REQUEST)
        user.mfa_enabled = True
        user.save(update_fields=["mfa_enabled"])
        return Response({"detail": "MFA activé."}, status=status.HTTP_200_OK)


@extend_schema(
    request=inline_serializer(
        name="MFADisableSerializer",
        fields={"password": drf_serializers.CharField(help_text="Mot de passe pour confirmer")},
    ),
    responses={
        200: inline_serializer(name="MFADisableSuccess", fields={"detail": drf_serializers.CharField()}),
        401: inline_serializer(name="MFADisableError", fields={"detail": drf_serializers.CharField()}),
    },
)
class MFADisableView(APIView):
    """
    Désactive le MFA. Corps : password (pour confirmer).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get("password", "")
        if not request.user.check_password(password):
            return Response({"detail": "Mot de passe incorrect."}, status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        user.mfa_enabled = False
        user.totp_secret = ""
        user.save(update_fields=["mfa_enabled", "totp_secret"])
        return Response({"detail": "MFA désactivé."}, status=status.HTTP_200_OK)


@extend_schema(
    responses={
        200: inline_serializer(
            name="MFAStatusResponse",
            fields={"mfa_enabled": drf_serializers.BooleanField()},
        ),
    },
)
class MFAStatusView(APIView):
    """
    Indique si le MFA est activé pour l'utilisateur connecté.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {"mfa_enabled": getattr(request.user, "mfa_enabled", False)},
            status=status.HTTP_200_OK,
        )
