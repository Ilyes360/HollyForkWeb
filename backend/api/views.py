from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from django.utils import timezone
from datetime import timedelta
import pyotp

from .models import Reservation, SupplierOrder, TeamShift, RoomMap, UserProfile, TempLoginToken
from .serializers import RegisterSerializer, LoginSerializer, RoomMapSerializer


def _default_kpis():
    return [
        {'title': 'CA JOUR', 'value': '3 245 €', 'trend': 'up', 'trendValue': '+12% vs hier'},
        {'title': 'CA MOIS', 'value': '78 340 €', 'trend': 'up', 'trendValue': '+8% vs M-1'},
        {'title': 'TAUX DE REMPLISSAGE', 'value': '87%', 'trend': 'up', 'trendValue': '+5%', 'details': [{'label': 'Midi', 'value': '92%'}, {'label': 'Soir', 'value': '82%'}]},
        {'title': 'COUVERTS', 'value': '142', 'trend': 'down', 'trendValue': '-3%', 'details': [{'label': 'Semaine', 'value': '896'}]},
        {'title': 'FOOD COST', 'value': '28.5%', 'trend': 'up', 'trendValue': '+1.2%', 'objective': '27%'},
        {'title': 'SATISFACTION', 'value': '4.6/5', 'trend': 'up', 'trendValue': '+0.2', 'reviews': '47'},
    ]


def _default_reservations():
    return [
        {'client': 'Martin Dupont', 'heure': '12:30', 'couverts': 4, 'canal': 'Site', 'statut': 'Confirmée', 'statutType': 'confirmed'},
        {'client': 'Sophie Bernard', 'heure': '13:00', 'couverts': 2, 'canal': 'Téléphone', 'statut': 'Arrivée', 'statutType': 'arrived'},
        {'client': 'Jean Moreau', 'heure': '19:30', 'couverts': 6, 'canal': 'TheFork', 'statut': 'Confirmée', 'statutType': 'confirmed'},
        {'client': 'Marie Leclerc', 'heure': '20:00', 'couverts': 3, 'canal': 'Site', 'statut': 'En Attente', 'statutType': 'pending'},
        {'client': 'Pierre Dubois', 'heure': '20:30', 'couverts': 2, 'canal': 'Téléphone', 'statut': 'Confirmée', 'statutType': 'confirmed'},
    ]


def _default_supplier_orders():
    return [
        {'produit': 'Filet de bœuf', 'fournisseur': 'Boucherie Moderne', 'prix': '28.90 €/kg', 'variation': '-2.3%', 'variationType': 'down', 'stock': 'Faible', 'stockType': 'low', 'derniereCmd': '3j'},
        {'produit': 'Saumon frais', 'fournisseur': 'Océan Frais', 'prix': '22.50 €/kg', 'variation': '+5.1%', 'variationType': 'up', 'stock': 'Moyen', 'stockType': 'medium', 'derniereCmd': '1j'},
        {'produit': 'Tomates bio', 'fournisseur': 'Potager Local', 'prix': '3.20 €/kg', 'variation': '-0.8%', 'variationType': 'down', 'stock': 'Bon', 'stockType': 'good', 'derniereCmd': '2j'},
        {'produit': "Huile d'olive", 'fournisseur': 'Epicerie Fine', 'prix': '18.90 €/L', 'variation': '+1.2%', 'variationType': 'up', 'stock': 'Bon', 'stockType': 'good', 'derniereCmd': '5j'},
        {'produit': 'Vin rouge AOC', 'fournisseur': 'Cave Sélection', 'prix': '12.40 €/btl', 'variation': '0%', 'variationType': 'neutral', 'stock': 'Faible', 'stockType': 'low', 'derniereCmd': '7j'},
    ]


def _default_shifts():
    return [
        {'time': '11:00', 'role': 'Chef de rang', 'name': 'Alice M.', 'status': 'assigned'},
        {'time': '11:00', 'role': 'Serveur', 'name': 'Thomas L.', 'status': 'assigned'},
        {'time': '12:00', 'role': 'Serveur', 'name': 'Julie P.', 'status': 'assigned'},
        {'time': '18:00', 'role': 'Chef de rang', 'name': 'Marc D.', 'status': 'assigned'},
        {'time': '18:00', 'role': 'Serveur', 'name': 'Sophie B.', 'status': 'unassigned'},
        {'time': '19:00', 'role': 'Serveur', 'name': 'Non assigné', 'status': 'unassigned'},
    ]


@api_view(['GET'])
def api_root(request):
    return Response({
        'message': 'Welcome to the API',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)


# ---------- Auth ----------

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register with email and password. Returns token and user email."""
    ser = RegisterSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    user = ser.save()
    UserProfile.objects.get_or_create(user=user)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'email': user.email,
    }, status=status.HTTP_201_CREATED)


TEMP_LOGIN_EXPIRE_MINUTES = 5


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Sign in with email and password. If MFA enabled, returns requires_mfa + temp_token; else token + email."""
    ser = LoginSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    email = ser.validated_data['email'].lower()
    password = ser.validated_data['password']
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.check_password(password):
        return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if profile.mfa_enabled and profile.totp_secret:
        TempLoginToken.objects.filter(user=user).delete()
        temp = TempLoginToken.objects.create(user=user)
        return Response({
            'requires_mfa': True,
            'temp_token': temp.token,
            'email': user.email,
        }, status=status.HTTP_200_OK)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'email': user.email,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_mfa(request):
    """Verify TOTP code and return auth token. Body: { temp_token, code }."""
    temp_token = request.data.get('temp_token', '').strip()
    code = request.data.get('code', '').strip().replace(' ', '')
    if not temp_token or not code:
        return Response(
            {'detail': 'temp_token and code are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        temp = TempLoginToken.objects.get(token=temp_token)
    except TempLoginToken.DoesNotExist:
        return Response({'detail': 'Invalid or expired code. Please log in again.'}, status=status.HTTP_401_UNAUTHORIZED)
    cutoff = timezone.now() - timedelta(minutes=TEMP_LOGIN_EXPIRE_MINUTES)
    if temp.created_at < cutoff:
        temp.delete()
        return Response({'detail': 'Session expired. Please log in again.'}, status=status.HTTP_401_UNAUTHORIZED)
    user = temp.user
    profile = user.profile
    totp = pyotp.TOTP(profile.totp_secret)
    if not totp.verify(code, valid_window=1):
        return Response({'detail': 'Invalid verification code.'}, status=status.HTTP_401_UNAUTHORIZED)
    temp.delete()
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'email': user.email,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mfa_setup(request):
    """Generate a new TOTP secret and return otpauth URL for QR. Does not enable MFA until confirm."""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if profile.mfa_enabled:
        return Response({'detail': 'MFA is already enabled.'}, status=status.HTTP_400_BAD_REQUEST)
    secret = pyotp.random_base32()
    profile.totp_secret = secret
    profile.save(update_fields=['totp_secret'])
    totp = pyotp.TOTP(secret)
    issuer = 'HollyFork'
    otpauth_url = totp.provisioning_uri(name=request.user.email, issuer_name=issuer)
    return Response({
        'secret': secret,
        'otpauth_url': otpauth_url,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mfa_confirm(request):
    """Verify TOTP code and enable MFA. Body: { code }."""
    code = request.data.get('code', '').strip().replace(' ', '')
    if not code:
        return Response({'detail': 'Code is required.'}, status=status.HTTP_400_BAD_REQUEST)
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if not profile.totp_secret:
        return Response({'detail': 'Call MFA setup first.'}, status=status.HTTP_400_BAD_REQUEST)
    if profile.mfa_enabled:
        return Response({'detail': 'MFA is already enabled.'}, status=status.HTTP_400_BAD_REQUEST)
    totp = pyotp.TOTP(profile.totp_secret)
    if not totp.verify(code, valid_window=1):
        return Response({'detail': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)
    profile.mfa_enabled = True
    profile.save(update_fields=['mfa_enabled'])
    return Response({'detail': 'MFA enabled.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mfa_disable(request):
    """Disable MFA. Body: { password } to confirm."""
    password = request.data.get('password', '')
    if not request.user.check_password(password):
        return Response({'detail': 'Invalid password.'}, status=status.HTTP_401_UNAUTHORIZED)
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.mfa_enabled = False
    profile.totp_secret = ''
    profile.save(update_fields=['mfa_enabled', 'totp_secret'])
    return Response({'detail': 'MFA disabled.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mfa_status(request):
    """Return whether MFA is enabled for the current user."""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    return Response({'mfa_enabled': profile.mfa_enabled}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Invalidate current token (logout)."""
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return current authenticated user email."""
    return Response({'email': request.user.email}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """Permanently delete the authenticated user's account."""
    user = request.user
    user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- Room maps (Salle) ----------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def room_maps_list(request):
    """List all maps for the current user, or create a new one."""
    if request.method == 'GET':
        maps = RoomMap.objects.filter(user=request.user)
        ser = RoomMapSerializer(maps, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)
    # POST
    ser = RoomMapSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    ser.save(user=request.user)
    return Response(ser.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def room_map_detail(request, pk):
    """Retrieve, update or delete a map (must belong to current user)."""
    try:
        room_map = RoomMap.objects.get(pk=pk, user=request.user)
    except RoomMap.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        ser = RoomMapSerializer(room_map)
        return Response(ser.data, status=status.HTTP_200_OK)
    if request.method == 'DELETE':
        room_map.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    # PUT or PATCH
    partial = request.method == 'PATCH'
    ser = RoomMapSerializer(room_map, data=request.data, partial=partial)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    ser.save()
    return Response(ser.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    """Dashboard data: reservations, supplier orders, and team shifts from DB; rest from defaults."""
    reservations = list(Reservation.objects.all())
    supplier_orders = list(SupplierOrder.objects.all())
    shifts = list(TeamShift.objects.all())

    if reservations:
        res_data = [
            {'client': r.client, 'heure': r.heure, 'couverts': r.couverts, 'canal': r.canal, 'statut': r.statut, 'statutType': r.statut_type}
            for r in reservations
        ]
    else:
        res_data = _default_reservations()

    if supplier_orders:
        ord_data = [
            {'produit': o.produit, 'fournisseur': o.fournisseur, 'prix': o.prix, 'variation': o.variation,
             'variationType': o.variation_type, 'stock': o.stock, 'stockType': o.stock_type, 'derniereCmd': o.derniere_cmd}
            for o in supplier_orders
        ]
    else:
        ord_data = _default_supplier_orders()

    if shifts:
        shift_data = [{'time': s.time, 'role': s.role, 'name': s.name, 'status': s.status} for s in shifts]
    else:
        shift_data = _default_shifts()

    data = {
        'kpis': _default_kpis(),
        'mapStats': {'establishments': 3, 'suppliers': 12, 'averageDelay': '2.4h'},
        'salesByCategory': [
            {'name': 'Plats', 'amount': '1,460 €', 'percentage': 100},
            {'name': 'Boissons', 'amount': '812 €', 'percentage': 56},
            {'name': 'Entrées', 'amount': '584 €', 'percentage': 40},
            {'name': 'Desserts', 'amount': '389 €', 'percentage': 27},
        ],
        'trendData': [
            {'day': 'Lun', 'value': 45}, {'day': 'Mar', 'value': 48}, {'day': 'Mer', 'value': 50},
            {'day': 'Jeu', 'value': 55}, {'day': 'Ven', 'value': 65}, {'day': 'Sam', 'value': 85}, {'day': 'Dim', 'value': 80},
        ],
        'teamPlanning': {'shifts': shift_data},
        'reservations': res_data,
        'supplierOrders': ord_data,
    }
    return Response(data, status=status.HTTP_200_OK)
