from datetime import datetime, time, timedelta

from django.utils import timezone
from django.utils.dateparse import parse_date
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.reservations.models import Reservation
from apps.reservations.serializers import ReservationSerializer


@extend_schema_view(
    list=extend_schema(
        summary="Liste des réservations",
        description="Liste des réservations avec filtres optionnels : id, restaurant_id, salle_id, table_id, date (YYYY-MM-DD), service (midi|soir).",
        parameters=[
            OpenApiParameter("id", int, description="ID de la réservation"),
            OpenApiParameter("restaurant_id", int, description="ID du restaurant"),
            OpenApiParameter("salle_id", int, description="ID de la salle"),
            OpenApiParameter("table_id", int, description="ID de la table réservée"),
            OpenApiParameter("date", str, description="Date au format YYYY-MM-DD"),
            OpenApiParameter("service", str, description="Service : 'midi' (heure < 15h) ou 'soir' (heure >= 15h)"),
        ],
    ),
    create=extend_schema(
        summary="Créer une réservation",
        description="Créer une réservation. Optionnellement associer une table (table_id) ; la table doit appartenir à la salle et être libre au créneau.",
    ),
    retrieve=extend_schema(summary="Détail d'une réservation"),
    update=extend_schema(summary="Modifier une réservation"),
    partial_update=extend_schema(summary="Modifier partiellement une réservation"),
    destroy=extend_schema(summary="Supprimer une réservation"),
)
class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related(
        'salle', 'salle__restaurant', 'table', 'table__salle'
    ).all()
    serializer_class = ReservationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['salle_id', 'table_id']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_reservation = self.request.query_params.get('id')
        restaurant_id = self.request.query_params.get('restaurant_id')
        date = self.request.query_params.get('date')  # YYYY-MM-DD
        service = self.request.query_params.get('service')  # 'midi' ou 'soir'
        
        if id_reservation:
            try:
                queryset = queryset.filter(id=int(id_reservation))
            except ValueError:
                queryset = queryset.none()
                
        if restaurant_id:
            try:
                queryset = queryset.filter(salle__restaurant_id=int(restaurant_id))
            except ValueError:
                queryset = queryset.none()
        
        if date:
            parsed_date = parse_date(date)
            if parsed_date:
                # On filtre sur un intervalle [début_de_jour, début_jour_suivant)
                # dans le fuseau horaire par défaut, pour éviter les surprises liées à l'UTC.
                tz = timezone.get_default_timezone()
                start_of_day = timezone.make_aware(
                    datetime.combine(parsed_date, time.min),
                    tz,
                )
                end_of_day = start_of_day + timedelta(days=1)
                queryset = queryset.filter(
                    date_heure__gte=start_of_day,
                    date_heure__lt=end_of_day,
                )
        
        if service:
            # Logique pour déterminer midi/soir selon l'heure (ex: < 15h = midi, >= 15h = soir)
            if service == 'midi':
                queryset = queryset.filter(date_heure__hour__lt=15)
            elif service == 'soir':
                queryset = queryset.filter(date_heure__hour__gte=15)
                
        return queryset.order_by('date_heure')
