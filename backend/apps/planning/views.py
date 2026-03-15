from collections import defaultdict

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime, timedelta, date, time
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer

from .models import Shift
from .serializers import ShiftSerializer
from apps.staff.models import Employe
from apps.restaurant.models import Restaurant

JOURS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.select_related('employe', 'restaurant').all()
    serializer_class = ShiftSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant_id', 'employe_id', 'type_shift']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        week = self.request.query_params.get('week')  # Format: YYYY-Www
        
        if week:
            try:
                # Parser le format ISO week (YYYY-Www)
                year, week_num = week.split('-W')
                year = int(year)
                week_num = int(week_num)
                # Calculer le début de la semaine ISO
                from datetime import date
                # Utiliser date.fromisocalendar() pour calculer la date du début de semaine
                date_debut_semaine = date.fromisocalendar(year, week_num, 1)  # 1 = lundi
                date_fin_semaine = date.fromisocalendar(year, week_num, 7)  # 7 = dimanche
                # Convertir en datetime avec minuit
                date_debut_semaine = timezone.make_aware(datetime.combine(date_debut_semaine, datetime.min.time()))
                date_fin_semaine = timezone.make_aware(datetime.combine(date_fin_semaine, datetime.max.time().replace(microsecond=0)))
                queryset = queryset.filter(
                    date_debut__gte=date_debut_semaine,
                    date_debut__lte=date_fin_semaine
                )
            except (ValueError, AttributeError) as e:
                # Si le format est invalide, on ignore le filtre
                pass
        
        return queryset.order_by('date_debut')

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        GET /api/planning/stats?week=YYYY-Www&restaurant_id=X
        """
        week = request.query_params.get('week')
        restaurant_id = request.query_params.get('restaurant_id')
        
        queryset = self.get_queryset()
        
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        
        if not week:
            return Response({'error': 'week requis (format: YYYY-Www)'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Stats
        total_shifts = queryset.count()
        total_heures = sum(
            (shift.date_fin - shift.date_debut).total_seconds() / 3600
            for shift in queryset
        )
        employes_count = queryset.values('employe').distinct().count()
        
        # Par type de shift
        shifts_by_type = {}
        for shift_type, label in Shift._meta.get_field('type_shift').choices:
            count = queryset.filter(type_shift=shift_type).count()
            shifts_by_type[shift_type] = {
                'label': label,
                'count': count
            }
        
        return Response({
            'week': week,
            'restaurant_id': restaurant_id,
            'stats': {
                'total_shifts': total_shifts,
                'total_heures': round(total_heures, 2),
                'employes_count': employes_count,
                'shifts_by_type': shifts_by_type,
            }
        })

    @extend_schema(
        summary="Emploi du temps d'un employé pour une semaine",
        description=(
            "Retourne l'emploi du temps (créneaux par jour) pour un employé et une semaine donnée. "
            "Nécessite une authentification (Bearer token après login ou quick-login)."
        ),
        parameters=[
            OpenApiParameter(name='employe_id', type=int, required=True, description="ID de l'employé"),
            OpenApiParameter(name='week', type=str, required=True, description="Semaine au format ISO : YYYY-Www (ex. 2026-W10)"),
            OpenApiParameter(name='restaurant_id', type=int, required=False, description="ID du restaurant (recommandé si l'employé a des créneaux dans plusieurs établissements)"),
        ],
        responses={
            200: inline_serializer(
                name='EmploiDuTempsResponse',
                fields={
                    'restaurant': inline_serializer(
                        name='EmploiRestaurant',
                        fields={'id': serializers.IntegerField(), 'nom': serializers.CharField()},
                    ),
                    'semaine': inline_serializer(
                        name='EmploiSemaine',
                        fields={
                            'debut': serializers.CharField(help_text='Date début (JJ/MM/AAAA)'),
                            'fin': serializers.CharField(help_text='Date fin (JJ/MM/AAAA)'),
                        },
                    ),
                    'jours': serializers.ListSerializer(
                        child=inline_serializer(
                            name='EmploiJour',
                            fields={
                                'date': serializers.CharField(help_text='JJ/MM'),
                                'jour': serializers.CharField(help_text='Lundi, Mardi, ...'),
                                'creneaux': serializers.ListSerializer(
                                    child=inline_serializer(
                                        name='EmploiCreneau',
                                        fields={
                                            'debut': serializers.CharField(help_text='HH:MM'),
                                            'fin': serializers.CharField(help_text='HH:MM'),
                                        },
                                    ),
                                ),
                                'total_heures': serializers.FloatField(),
                            },
                        ),
                    ),
                    'total_semaine_heures': serializers.FloatField(),
                },
            ),
            400: inline_serializer(name='EmploiDuTempsError', fields={'error': serializers.CharField()}),
            401: inline_serializer(name='EmploiDuTempsUnauthorized', fields={'detail': serializers.CharField()}),
            404: inline_serializer(name='EmploiDuTempsNotFound', fields={'error': serializers.CharField()}),
        },
    )
    @action(detail=False, methods=['get'], url_path='emploi-du-temps')
    def emploi_du_temps(self, request):
        """
        GET /api/planning/shifts/emploi-du-temps/?employe_id=X&week=YYYY-Www&restaurant_id=Y
        Retourne l'emploi du temps de l'employé pour la semaine.
        """
        employe_id = request.query_params.get('employe_id')
        restaurant_id = request.query_params.get('restaurant_id')
        week = request.query_params.get('week')

        if not employe_id or not week:
            return Response(
                {'error': 'employe_id et week requis (week au format YYYY-Www)'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            year, week_num = week.split('-W')
            year, week_num = int(year), int(week_num)
            date_debut_semaine = date.fromisocalendar(year, week_num, 1)
            date_fin_semaine = date.fromisocalendar(year, week_num, 7)
        except (ValueError, AttributeError):
            return Response(
                {'error': 'week invalide (format attendu: YYYY-Www)'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filtre par plage de datetimes (évite les soucis __date + timezone en MySQL/SQLite)
        debut_dt = timezone.make_aware(datetime.combine(date_debut_semaine, time.min))
        fin_dt = timezone.make_aware(datetime.combine(date_fin_semaine, time.max))
        queryset = Shift.objects.filter(
            employe_id=employe_id,
            date_debut__gte=debut_dt,
            date_debut__lte=fin_dt,
        ).select_related('restaurant').order_by('date_debut')

        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        shifts = list(queryset)
        if shifts:
            restaurant = shifts[0].restaurant
        elif restaurant_id:
            try:
                restaurant = Restaurant.objects.get(id_restaurant=restaurant_id)
            except Restaurant.DoesNotExist:
                return Response(
                    {'error': 'Restaurant introuvable.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            return Response(
                {'error': 'restaurant_id requis lorsqu\'il n\'y a aucun créneau pour cette semaine.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Grouper les shifts par jour (date)
        par_jour = defaultdict(list)
        for s in shifts:
            par_jour[s.date_debut.date()].append(s)

        def d_fmt(d):
            return d.strftime('%d/%m/%Y')

        def d_short(d):
            return d.strftime('%d/%m')

        def heure_fmt(dt):
            return dt.strftime('%H:%M')

        def heures_entre(debut_dt, fin_dt):
            return (fin_dt - debut_dt).total_seconds() / 3600.0

        jours_payload = []
        total_semaine_heures = 0.0

        for i in range(7):
            d = date_debut_semaine + timedelta(days=i)
            creneaux_jour = par_jour.get(d, [])
            creneaux = [
                {'debut': heure_fmt(s.date_debut), 'fin': heure_fmt(s.date_fin)}
                for s in sorted(creneaux_jour, key=lambda x: x.date_debut)
            ]
            total_heures_jour = sum(heures_entre(s.date_debut, s.date_fin) for s in creneaux_jour)
            total_semaine_heures += total_heures_jour
            jours_payload.append({
                'date': d_short(d),
                'jour': JOURS_FR[d.weekday()],
                'creneaux': creneaux,
                'total_heures': round(total_heures_jour, 2),
            })

        return Response({
            'restaurant': {
                'id': restaurant.id_restaurant,
                'nom': restaurant.nom_restaurant,
            },
            'semaine': {
                'debut': d_fmt(date_debut_semaine),
                'fin': d_fmt(date_fin_semaine),
            },
            'jours': jours_payload,
            'total_semaine_heures': round(total_semaine_heures, 2),
        })

