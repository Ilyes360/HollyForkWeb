from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.inventory.models import Ingredient, Reapprovisionnement, Stock
from apps.inventory.serializers import IngredientSerializer, ReapprovisionnementSerializer, StockSerializer
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.db.models import Sum, Avg
from datetime import datetime, timedelta
from django.utils import timezone

class ReapprovisionnementViewSet(viewsets.ModelViewSet):
    queryset = Reapprovisionnement.objects.select_related('restaurant', 'ingredient').all()
    serializer_class = ReapprovisionnementSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant_id', 'ingredient_id']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_reappro = self.request.query_params.get('id')
        if id_reappro:
            try:
                queryset = queryset.filter(id=int(id_reappro))
            except ValueError:
                queryset = queryset.none()
        return queryset


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('restaurant', 'ingredient').all()
    serializer_class = StockSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant_id', 'ingredient_id']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_stock = self.request.query_params.get('id')
        category = self.request.query_params.get('category')  # Filtre par catégorie d'ingrédient
        
        if id_stock:
            try:
                queryset = queryset.filter(id=int(id_stock))
            except ValueError:
                queryset = queryset.none()
        
        # TODO: Implémenter le filtre par catégorie si vous avez un modèle Category pour Ingredient
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='alerts')
    def alerts(self, request):
        """
        GET /api/stocks/alerts?restaurant_id=X
        """
        restaurant_id = request.query_params.get('restaurant_id')
        
        queryset = Stock.objects.select_related('restaurant', 'ingredient')
        
        if restaurant_id:
            try:
                queryset = queryset.filter(restaurant_id=int(restaurant_id))
            except ValueError:
                return Response({'error': 'restaurant_id invalide'}, status=400)
        
        # Stocks en alerte (quantité <= seuil)
        alerts = []
        for stock in queryset:
            if stock.est_en_rupture():
                alerts.append({
                    'stock_id': stock.id,
                    'ingredient_name': stock.ingredient.nom,
                    'quantity_in_stock': float(stock.quantite_en_stock),
                    'alert_threshold': float(stock.seuil_alerte),
                    'unit': stock.ingredient.unite,
                    'restaurant_name': stock.restaurant.nom_restaurant,
                })
        
        return Response({
            'restaurant_id': restaurant_id,
            'alerts_count': len(alerts),
            'alerts': alerts
        })
    
    @action(detail=False, methods=['get'], url_path='reports')
    def reports(self, request):
        """
        GET /api/stocks/reports?period=day|week|month|year&restaurant_id=X
        """
        period = request.query_params.get('period', 'month')
        restaurant_id = request.query_params.get('restaurant_id')
        
        queryset = Stock.objects.select_related('restaurant', 'ingredient')
        
        if restaurant_id:
            try:
                queryset = queryset.filter(restaurant_id=int(restaurant_id))
            except ValueError:
                return Response({'error': 'restaurant_id invalide'}, status=400)
        
        # Calculer la période
        now = timezone.now()
        if period == 'day':
            start_date = now - timedelta(days=1)
        elif period == 'week':
            start_date = now - timedelta(weeks=1)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)
        
        # Récupérer les réapprovisionnements de la période
        reapprovs = Reapprovisionnement.objects.filter(
            date_ajout__gte=start_date,
            restaurant_id=restaurant_id if restaurant_id else None
        )
        
        # Statistiques
        total_reapprovs = reapprovs.count()
        total_montant = reapprovs.aggregate(Sum('prix_achat'))['prix_achat__sum'] or Decimal('0')
        valeur_stock_actuel = sum(
            float(stock.quantite_en_stock * stock.cout_moyen_pondere)
            for stock in queryset
        )
        
        return Response({
            'period': period,
            'restaurant_id': restaurant_id,
            'start_date': start_date.isoformat(),
            'end_date': now.isoformat(),
            'stats': {
                'total_replenishments': total_reapprovs,
                'total_amount': float(total_montant),
                'current_stock_value': round(valeur_stock_actuel, 2),
            }
        })
    
    @action(detail=True, methods=['post'], url_path='adjust')
    def adjust(self, request, pk=None):
        """
        POST /api/stocks/{id}/adjust
        Body: {"quantite": 10.5, "raison": "Inventaire", "type": "ajout|retrait"}
        """
        stock = self.get_object()
        quantity = request.data.get('quantity') or request.data.get('quantite')
        reason = request.data.get('reason') or request.data.get('raison', 'Ajustement manuel')
        adjustment_type = request.data.get('adjustment_type') or request.data.get('type', 'ajout')
        
        if not quantity:
            return Response({'error': 'quantity required'}, status=400)
        
        try:
            quantity = Decimal(str(quantity))
        except (ValueError, TypeError):
            return Response({'error': 'invalid quantity'}, status=400)
        
        if adjustment_type == 'ajout':
            stock.quantite_en_stock += quantity
        elif adjustment_type == 'retrait':
            stock.quantite_en_stock -= quantity
            if stock.quantite_en_stock < 0:
                stock.quantite_en_stock = Decimal('0')
        else:
            return Response({'error': 'invalid type (ajout|retrait)'}, status=400)

        stock.save()

        Reapprovisionnement.objects.create(
            restaurant=stock.restaurant,
            ingredient=stock.ingredient,
            quantite_ajoutee=quantity if adjustment_type == 'ajout' else -quantity,
            prix_achat=None,
        )

        serializer = self.get_serializer(stock)
        return Response({
            'message': f'Ajustement effectué ({adjustment_type})',
            'stock': serializer.data
        })

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_ingredient = self.request.query_params.get('id_ingredient')
        if id_ingredient:
            try:
                queryset = queryset.filter(id=int(id_ingredient))
            except ValueError:
                queryset = queryset.none()
        return queryset

