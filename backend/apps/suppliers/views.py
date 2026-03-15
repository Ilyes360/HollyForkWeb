from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Fournisseur, JourLivraison, CommandeFournisseur
from .serializers import FournisseurSerializer, JourLivraisonSerializer, CommandeFournisseurSerializer


class FournisseurViewSet(viewsets.ModelViewSet):
    queryset = Fournisseur.objects.all()
    serializer_class = FournisseurSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['actif']
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='delivery-days')
    def delivery_days(self, request, pk=None):
        """
        GET /api/suppliers/{id}/delivery-days
        """
        fournisseur = self.get_object()
        jours = JourLivraison.objects.filter(fournisseur=fournisseur)
        serializer = JourLivraisonSerializer(jours, many=True)
        return Response(serializer.data)


class CommandeFournisseurViewSet(viewsets.ModelViewSet):
    queryset = CommandeFournisseur.objects.select_related('fournisseur', 'restaurant').all()
    serializer_class = CommandeFournisseurSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant', 'fournisseur', 'statut']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        restaurant_id = self.request.query_params.get('restaurant_id')
        if restaurant_id:
            try:
                queryset = queryset.filter(restaurant_id=int(restaurant_id))
            except ValueError:
                pass
        return queryset

