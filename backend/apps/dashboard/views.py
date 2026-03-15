from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Avg, Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from apps.commandes.models import Commande, CommandeHistoric
from apps.reservations.models import Reservation
from apps.salles.models import Table
from apps.inventory.models import Stock
from apps.restaurant.models import Restaurant

_kpis_response = inline_serializer(
    name='DashboardKPIsResponse',
    fields={
        'restaurant_id': serializers.IntegerField(),
        'restaurant_name': serializers.CharField(),
        'date': serializers.CharField(),
        'kpis': serializers.DictField(),
    },
)

_map_response = inline_serializer(
    name='DashboardMapResponse',
    fields={
        'restaurants': serializers.ListField(child=serializers.DictField()),
        'suppliers': serializers.ListField(child=serializers.DictField()),
    },
)


@extend_schema(
    parameters=[
        OpenApiParameter(name='restaurant_id', type=int, required=True),
        OpenApiParameter(name='date', type=str, required=False, description='YYYY-MM-DD'),
    ],
    responses={
        200: _kpis_response,
        400: inline_serializer(name='DashboardKPIsError', fields={'error': serializers.CharField()}),
        404: inline_serializer(name='DashboardKPIsNotFound', fields={'error': serializers.CharField()}),
    },
)
class DashboardKPIsView(APIView):
    """
    Endpoint pour récupérer les KPIs du dashboard.
    GET /api/dashboard/kpis?restaurant_id=X&date=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        restaurant_id = request.query_params.get('restaurant_id')
        date_str = request.query_params.get('date')
        
        if not restaurant_id:
            return Response({'error': 'restaurant_id requis'}, status=400)
        
        try:
            restaurant = Restaurant.objects.get(id_restaurant=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant introuvable'}, status=404)
        
        # Date par défaut = aujourd'hui
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Format de date invalide (YYYY-MM-DD)'}, status=400)
        else:
            target_date = timezone.now().date()
        
        # CA du jour
        ca_jour = CommandeHistoric.objects.filter(
            restaurant=restaurant,
            created_at__date=target_date,
            statut='VALIDEE'
        ).aggregate(total=Sum('montant'))['total'] or Decimal('0')
        
        # CA du mois
        mois_debut = target_date.replace(day=1)
        ca_mois = CommandeHistoric.objects.filter(
            restaurant=restaurant,
            created_at__date__gte=mois_debut,
            created_at__date__lte=target_date,
            statut='VALIDEE'
        ).aggregate(total=Sum('montant'))['total'] or Decimal('0')
        
        # Remplissage (tables occupées / total)
        tables_total = Table.objects.filter(salle__restaurant=restaurant).count()
        tables_occupees = Table.objects.filter(salle__restaurant=restaurant, is_occupied=True).count()
        remplissage = (tables_occupees / tables_total * 100) if tables_total > 0 else 0
        
        # Couverts (nombre de personnes dans les réservations du jour)
        couverts = Reservation.objects.filter(
            salle__restaurant=restaurant,
            date_heure__date=target_date
        ).aggregate(total=Sum('nombre_personnes'))['total'] or 0
        
        # Food cost (CMV / CA)
        cmv_jour = CommandeHistoric.objects.filter(
            restaurant=restaurant,
            created_at__date=target_date,
            statut='VALIDEE'
        ).aggregate(total=Sum('cout_total_marchandises_vendues'))['total'] or Decimal('0')
        
        food_cost = (cmv_jour / ca_jour * 100) if ca_jour > 0 else 0
        
        # Satisfaction (à implémenter si vous avez un système de notes)
        satisfaction = None  # TODO: implémenter si nécessaire
        
        return Response({
            'restaurant_id': restaurant_id,
            'restaurant_name': restaurant.nom_restaurant,
            'date': target_date.isoformat(),
            'kpis': {
                'daily_revenue': float(ca_jour),
                'monthly_revenue': float(ca_mois),
                'occupancy_rate': round(remplissage, 2),
                'covers': couverts,
                'food_cost': round(float(food_cost), 2),
                'satisfaction': satisfaction,
            }
        })


@extend_schema(
    parameters=[OpenApiParameter(name='restaurant_id', type=int, required=False)],
    responses={200: _map_response},
)
class DashboardMapView(APIView):
    """
    Endpoint pour récupérer la carte avec restaurants et fournisseurs.
    GET /api/dashboard/map?restaurant_id=X
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant_id = request.query_params.get('restaurant_id')
        
        restaurants_data = []
        if restaurant_id:
            try:
                restaurant = Restaurant.objects.get(id_restaurant=restaurant_id)
                restaurants_data.append({
                    'restaurant_id': restaurant.id_restaurant,
                    'name': restaurant.nom_restaurant,
                    'type': 'restaurant',
                    'lat': float(restaurant.latitude) if restaurant.latitude else None,
                    'lng': float(restaurant.longitude) if restaurant.longitude else None,
                    'city': restaurant.ville,
                })
            except Restaurant.DoesNotExist:
                pass
        else:
            # Tous les restaurants
            restaurants = Restaurant.objects.all()
            for restaurant in restaurants:
                restaurants_data.append({
                    'restaurant_id': restaurant.id_restaurant,
                    'name': restaurant.nom_restaurant,
                    'type': 'restaurant',
                    'lat': float(restaurant.latitude) if restaurant.latitude else None,
                    'lng': float(restaurant.longitude) if restaurant.longitude else None,
                    'city': restaurant.ville,
                })
        
        # Fournisseurs (à implémenter quand l'app suppliers sera créée)
        suppliers_data = []  # TODO: remplir quand suppliers sera créé
        
        return Response({
            'restaurants': restaurants_data,
            'suppliers': suppliers_data,
        })

