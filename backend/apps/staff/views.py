from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from apps.staff.models import TypeEmploye, Employe, RestaurantEmploye
from apps.staff.serializers import TypeEmployeSerializer, EmployeSerializer, RestaurantEmployeSerializer
from rest_framework.permissions import IsAuthenticated

class TypeEmployeViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les types d'employés.
    """
    queryset = TypeEmploye.objects.all()
    serializer_class = TypeEmployeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['nom_type']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_type_employe = self.request.query_params.get('id')
        if id_type_employe:
            try:
                queryset = queryset.filter(id=int(id_type_employe))
            except ValueError:
                queryset = queryset.none()
        return queryset

class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.all()
    serializer_class = EmployeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_employe = self.request.query_params.get('id')
        if id_employe:
            try:
                queryset = queryset.filter(id=int(id_employe))
            except ValueError:
                queryset = queryset.none()
        return queryset

class RestaurantEmployeViewSet(viewsets.ModelViewSet):
    queryset = RestaurantEmploye.objects.select_related('restaurant', 'employe').all()
    serializer_class = RestaurantEmployeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant', 'employe']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_association = self.request.query_params.get('id')
        if id_association:
            try:
                queryset = queryset.filter(id=int(id_association))
            except ValueError:
                queryset = queryset.none()
        return queryset
