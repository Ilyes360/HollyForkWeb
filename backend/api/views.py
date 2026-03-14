from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from django.utils import timezone
from datetime import date, timedelta
import pyotp

from .models import Reservation, SupplierOrder, TeamShift, RoomMap, UserProfile, TempLoginToken, Employee, PlanningShift, PlanningCapacity
from .serializers import RegisterSerializer, LoginSerializer, RoomMapSerializer, UserProfileSerializer


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
    """Register with email and password. Persists User (auth_user) and UserProfile (api_userprofile). Returns token and user email."""
    ser = RegisterSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    user = ser.save()
    # Ensure profile exists in DB (links user to ERD: role, salle, MFA)
    UserProfile.objects.get_or_create(user=user)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'email': user.email,
    }, status=status.HTTP_201_CREATED)


TEMP_LOGIN_EXPIRE_MINUTES = 5


def _user_response_from_db(user):
    """Build auth response from DB user (auth_user + api_userprofile)."""
    out = {'email': user.email, 'first_name': user.first_name or '', 'last_name': user.last_name or ''}
    try:
        profile = user.profile
        out['role_id'] = profile.role_id
        out['salle_id'] = profile.salle_id
    except UserProfile.DoesNotExist:
        out['role_id'] = None
        out['salle_id'] = None
    return out


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Sign in with email and password. All auth is from DB: auth_user (password check), api_userprofile (MFA), authtoken_token / api_templogintoken."""
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
        expires_at = timezone.now() + timedelta(minutes=TEMP_LOGIN_EXPIRE_MINUTES)
        temp = TempLoginToken.objects.create(user=user, expires_at=expires_at)
        return Response({
            'requires_mfa': True,
            'temp_token': temp.token,
            'email': user.email,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
        }, status=status.HTTP_200_OK)
    token, _ = Token.objects.get_or_create(user=user)
    resp = {'token': token.key, **(_user_response_from_db(user))}
    return Response(resp, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_mfa(request):
    """Verify TOTP code and return auth token. Uses DB: api_templogintoken, api_userprofile (totp_secret), authtoken_token."""
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
    now = timezone.now()
    if temp.expires_at and temp.expires_at < now:
        temp.delete()
        return Response({'detail': 'Session expired. Please log in again.'}, status=status.HTTP_401_UNAUTHORIZED)
    cutoff = now - timedelta(minutes=TEMP_LOGIN_EXPIRE_MINUTES)
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
    resp = {'token': token.key, **(_user_response_from_db(user))}
    return Response(resp, status=status.HTTP_200_OK)


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
    """Remove auth token from DB (authtoken_token) so the session is invalidated."""
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return current user from DB (auth_user + api_userprofile: email, name, role_id, salle_id)."""
    return Response(_user_response_from_db(request.user), status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_update(request):
    """GET or PATCH current user's profile (role, salle). mfa_enabled is read-only."""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        ser = UserProfileSerializer(profile)
        data = ser.data
        data['email'] = request.user.email
        data['first_name'] = request.user.first_name or ''
        data['last_name'] = request.user.last_name or ''
        return Response(data, status=status.HTTP_200_OK)
    ser = UserProfileSerializer(profile, data=request.data, partial=True)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    ser.save()
    data = ser.data
    data['email'] = request.user.email
    data['first_name'] = request.user.first_name or ''
    data['last_name'] = request.user.last_name or ''
    return Response(data, status=status.HTTP_200_OK)


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
    # POST: link map to user and optionally to their salle (from profile/DB)
    ser = RoomMapSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    salle = None
    try:
        profile = request.user.profile
        if profile.salle_id:
            salle = profile.salle
    except UserProfile.DoesNotExist:
        pass
    ser.save(user=request.user, salle=salle)
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


def _default_capacity():
    """Default capacity per day (0=Mon..6=Sun) for Midi and Soir."""
    return {
        'midi': {0: 4, 1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 3},
        'soir': {0: 4, 1: 4, 2: 5, 3: 4, 4: 6, 5: 6, 6: 4},
    }


def _capacity_for_salle(salle_id):
    """Build capacity dict from PlanningCapacity for salle_id; fallback to _default_capacity() if no rows."""
    if salle_id is None:
        return _default_capacity()
    rows = PlanningCapacity.objects.filter(salle_id=salle_id)
    if not rows.exists():
        return _default_capacity()
    midi = {i: 0 for i in range(7)}
    soir = {i: 0 for i in range(7)}
    for r in rows:
        d = midi if r.type_shift == 'Midi' else soir
        if 0 <= r.day_of_week <= 6:
            d[r.day_of_week] = r.required_count
    return {'midi': midi, 'soir': soir}


def _get_salle_id(request):
    """Salle from query param ?salle= or from request.user.profile.salle_id. None = no filter."""
    raw = request.query_params.get('salle')
    if raw is not None and raw != '':
        try:
            return int(raw)
        except (ValueError, TypeError):
            pass
    try:
        profile = request.user.profile
        if getattr(profile, 'salle_id', None) is not None:
            return profile.salle_id
    except Exception:
        pass
    return None


def _week_bounds_from_date(d):
    """Return (monday, sunday) for the ISO week containing d."""
    day_of_week = d.weekday()
    monday = d - timedelta(days=day_of_week)
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _compute_alerts(shifts_by_emp_date, employees_qs, capacity):
    """Build list of staffing alerts: { day, type, required, actual, message }."""
    day_names = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    alerts = []
    for day_index in range(7):
        for shift_type, key in [('Midi', 'midi'), ('Soir', 'soir')]:
            required = capacity.get(key, {}).get(day_index, 0)
            actual = 0
            for emp in employees_qs:
                for slot in shifts_by_emp_date.get(emp.id, {}).get(day_index, []):
                    if slot.get('type') == shift_type:
                        actual += 1
                        break
            if required > 0 and actual < required:
                missing = required - actual
                day_name = day_names[day_index] if day_index < len(day_names) else f'Jour {day_index}'
                alerts.append({
                    'day': day_index,
                    'dayName': day_name,
                    'type': shift_type,
                    'required': required,
                    'actual': actual,
                    'message': f'{day_name} {shift_type.lower()}: {missing} personne(s) manquante(s)',
                })
    return alerts


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def planning_week(request):
    """GET ?date=YYYY-MM-DD&salle=ID. POST body: { weekStart, salle_id?, shifts: [{ employee_id, day, type, start, end }] }. Alerts in GET response."""
    from datetime import datetime as dt
    if request.method == 'POST':
        data = request.data or {}
        raw_start = data.get('weekStart') or request.query_params.get('date', '')
        try:
            if raw_start:
                monday = dt.strptime(str(raw_start)[:10], '%Y-%m-%d').date()
            else:
                monday = date.today()
                monday = monday - timedelta(days=monday.weekday())
        except (ValueError, TypeError):
            return Response({'error': 'Invalid weekStart'}, status=status.HTTP_400_BAD_REQUEST)
        sunday = monday + timedelta(days=6)
        salle_id = data.get('salle_id')
        if salle_id is None:
            salle_id = _get_salle_id(request)
        employees_qs = Employee.objects.all().order_by('nom')
        if salle_id is not None:
            employees_qs = employees_qs.filter(salle_id=salle_id)
        employee_ids = set(employees_qs.values_list('id', flat=True))
        shifts_payload = data.get('shifts') or []
        # Dedupe by (employee_id, day, type) to respect DB unique_together on PlanningShift
        seen = {}
        for item in shifts_payload:
            try:
                emp_id = item.get('employee_id')
                day_index = item.get('day')
                if emp_id not in employee_ids or day_index is None or day_index < 0 or day_index > 6:
                    continue
                type_shift = item.get('type') or 'Midi'
                if type_shift not in ('Midi', 'Soir', 'Journée'):
                    type_shift = 'Midi'
                key = (emp_id, int(day_index), type_shift)
                seen[key] = item
            except (ValueError, TypeError, KeyError):
                continue
        PlanningShift.objects.filter(
            date__gte=monday,
            date__lte=sunday,
            employee__in=employees_qs,
        ).delete()
        for (emp_id, day_index, type_shift), item in seen.items():
            shift_date = monday + timedelta(days=day_index)
            PlanningShift.objects.create(
                employee_id=emp_id,
                date=shift_date,
                type_shift=type_shift,
                heure_debut=str(item.get('start') or '11:00')[:10],
                heure_fin=str(item.get('end') or '15:00')[:10],
            )
        return Response({'weekStart': monday.isoformat(), 'weekEnd': sunday.isoformat(), 'saved': len(seen)}, status=status.HTTP_200_OK)
    raw = request.query_params.get('date', '')
    try:
        if raw:
            d = dt.strptime(raw, '%Y-%m-%d').date()
        else:
            d = date.today()
    except ValueError:
        d = date.today()
    monday, sunday = _week_bounds_from_date(d)
    salle_id = _get_salle_id(request)
    employees_qs = Employee.objects.all().order_by('nom')
    if salle_id is not None:
        employees_qs = employees_qs.filter(salle_id=salle_id)
    shifts_qs = PlanningShift.objects.filter(
        date__gte=monday,
        date__lte=sunday,
        employee__in=employees_qs,
    ).select_related('employee')
    shifts_by_emp_date = {}
    for s in shifts_qs:
        eid = s.employee_id
        if eid not in shifts_by_emp_date:
            shifts_by_emp_date[eid] = {}
        day_index = (s.date - monday).days
        if day_index not in shifts_by_emp_date[eid]:
            shifts_by_emp_date[eid][day_index] = []
        shifts_by_emp_date[eid][day_index].append({
            'type': s.type_shift,
            'start': s.heure_debut,
            'end': s.heure_fin,
        })
    employees = []
    for emp in employees_qs:
        shifts = {}
        for i in range(7):
            shifts[str(i)] = shifts_by_emp_date.get(emp.id, {}).get(i, [])
        employees.append({
            'id': emp.id,
            'name': emp.nom,
            'initials': emp.initiales or (emp.nom[:2].upper() if emp.nom else ''),
            'role': emp.role,
            'weeklyHours': emp.heures_semaine,
            'color': emp.color or '#e3f2fd',
            'shifts': shifts,
        })
    capacity = _capacity_for_salle(salle_id)
    alerts = _compute_alerts(shifts_by_emp_date, employees_qs, capacity)
    return Response({
        'employees': employees,
        'capacity': capacity,
        'weekStart': monday.isoformat(),
        'weekEnd': sunday.isoformat(),
        'alerts': alerts,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def planning_week_copy(request):
    """POST { source_date, target_date } or { weekStart (source), target_week_start }. Copy shifts from source week to target week (same employees/salle)."""
    from datetime import datetime as dt
    data = request.data or {}
    source_raw = data.get('source_date') or data.get('weekStart') or request.query_params.get('source_date')
    target_raw = data.get('target_date') or data.get('target_week_start') or request.query_params.get('target_date')
    if not source_raw or not target_raw:
        return Response({'error': 'source_date and target_date (or weekStart and target_week_start) required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        source_date = dt.strptime(str(source_raw)[:10], '%Y-%m-%d').date()
        target_date = dt.strptime(str(target_raw)[:10], '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return Response({'error': 'Invalid date format (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
    source_monday, source_sunday = _week_bounds_from_date(source_date)
    target_monday, target_sunday = _week_bounds_from_date(target_date)
    salle_id = data.get('salle_id')
    if salle_id is None:
        salle_id = _get_salle_id(request)
    employees_qs = Employee.objects.all()
    if salle_id is not None:
        employees_qs = employees_qs.filter(salle_id=salle_id)
    source_shifts = list(PlanningShift.objects.filter(
        date__gte=source_monday,
        date__lte=source_sunday,
        employee__in=employees_qs,
    ))
    PlanningShift.objects.filter(
        date__gte=target_monday,
        date__lte=target_sunday,
        employee__in=employees_qs,
    ).delete()
    created = 0
    for s in source_shifts:
        day_index = (s.date - source_monday).days
        if 0 <= day_index <= 6:
            new_date = target_monday + timedelta(days=day_index)
            PlanningShift.objects.create(
                employee=s.employee,
                date=new_date,
                type_shift=s.type_shift,
                heure_debut=s.heure_debut,
                heure_fin=s.heure_fin,
            )
            created += 1
    return Response({
        'sourceWeekStart': source_monday.isoformat(),
        'targetWeekStart': target_monday.isoformat(),
        'copied': created,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    """Dashboard data: reservations, supplier orders, and team shifts from DB; rest from defaults."""
    reservations = list(Reservation.objects.all())
    supplier_orders = list(SupplierOrder.objects.all())
    shifts = list(TeamShift.objects.all())

    if reservations:
        res_data = [
            {
                'client': f"{r.client.prenom_client} {r.client.nom_client}" if r.client else '',
                'heure': r.heure_reservation.strftime('%H:%M') if r.heure_reservation else '',
                'couverts': r.nombre_personnes,
                'canal': r.get_canal_display() if getattr(r, 'canal', None) else '',
                'statut': r.get_statut_reservation_display(),
                'statutType': r.statut_reservation,
            }
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
