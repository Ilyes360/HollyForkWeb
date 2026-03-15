from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.salles.models import Salle, Table
from apps.salles.serializers import SalleSerializer, TableSerializer
from rest_framework.permissions import IsAuthenticated
from django.utils.dateparse import parse_date
from apps.reservations.models import Reservation
from apps.commandes.models import Commande

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.select_related('salle__restaurant', 'employee_in_charge').all()
    serializer_class = TableSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['salle_id', 'employee_in_charge_id']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_table = self.request.query_params.get('id')
        restaurant_id = self.request.query_params.get('restaurant_id')
        numero = self.request.query_params.get('numero')
        
        if id_table:
            try:
                queryset = queryset.filter(id=int(id_table))
            except ValueError:
                queryset = queryset.none()
        
        if restaurant_id:
            try:
                queryset = queryset.filter(salle__restaurant_id=int(restaurant_id))
            except ValueError:
                queryset = queryset.none()
        
        if numero:
            try:
                queryset = queryset.filter(numero=int(numero))
            except ValueError:
                queryset = queryset.none()
                
        return queryset
    
    @action(detail=False, methods=['get'], url_path='status')
    def status(self, request):
        """
        GET /api/tables/status?date=YYYY-MM-DD&service=midi|soir&restaurant_id=X
        """
        date_str = request.query_params.get('date')
        service = request.query_params.get('service')
        restaurant_id = request.query_params.get('restaurant_id')
        
        if not date_str:
            return Response({'error': 'date requis (YYYY-MM-DD)'}, status=400)
        
        parsed_date = parse_date(date_str)
        if not parsed_date:
            return Response({'error': 'Format de date invalide'}, status=400)
        
        queryset = Table.objects.select_related('salle__restaurant', 'employee_in_charge')
        
        if restaurant_id:
            try:
                queryset = queryset.filter(salle__restaurant_id=int(restaurant_id))
            except ValueError:
                return Response({'error': 'restaurant_id invalide'}, status=400)
        
        tables_status = []
        for table in queryset:
            # Vérifier les réservations du jour
            reservations = Reservation.objects.filter(
                salle=table.salle,
                date_heure__date=parsed_date
            )
            
            if service:
                if service == 'midi':
                    reservations = reservations.filter(date_heure__hour__lt=15)
                elif service == 'soir':
                    reservations = reservations.filter(date_heure__hour__gte=15)
            
            # Vérifier les commandes en cours
            commandes = Commande.objects.filter(
                table=table,
                statut='EN_COURS',
                created_at__date=parsed_date
            )
            
            tables_status.append({
                'table_id': table.id,
                'numero': table.numero,
                'salle': table.salle.nom_salle,
                'capacity': table.capacity,
                'is_occupied': table.is_occupied,
                'employee_in_charge': f"{table.employee_in_charge.prenom} {table.employee_in_charge.nom}" if table.employee_in_charge else None,
                'reservations_count': reservations.count(),
                'commandes_count': commandes.count(),
            })
        
        return Response({
            'date': date_str,
            'service': service,
            'restaurant_id': restaurant_id,
            'tables': tables_status
        })


class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.select_related('restaurant').all()
    serializer_class = SalleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant_id']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_salle = self.request.query_params.get('id')
        restaurant_id = self.request.query_params.get('restaurant_id')
        
        if id_salle:
            try:
                queryset = queryset.filter(id=int(id_salle))
            except ValueError:
                queryset = queryset.none()
                
        if restaurant_id:
            try:
                queryset = queryset.filter(restaurant_id=int(restaurant_id))
            except ValueError:
                queryset = queryset.none()
                
        return queryset
