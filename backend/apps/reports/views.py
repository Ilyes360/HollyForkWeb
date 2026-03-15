from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.http import FileResponse
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from .models import Report
from .serializers import ReportSerializer
from apps.staff.models import Employe


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.select_related('restaurant', 'created_by').all()
    serializer_class = ReportSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant', 'type_report']
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

    def get_queryset(self):
        queryset = super().get_queryset()
        period = self.request.query_params.get('period')  # 'DAILY', 'WEEKLY', 'MONTHLY', etc.
        type_report = self.request.query_params.get('type') or self.request.query_params.get('type_report')
        
        if period:
            from django.utils import timezone
            from datetime import timedelta
            now = timezone.now().date()
            
            # Mapper les périodes en français vers les périodes du modèle
            period_mapping = {
                'DAILY': 'day',
                'WEEKLY': 'week',
                'MONTHLY': 'month',
                'QUARTERLY': 'month',  # Approximatif
                'ANNUAL': 'year',
                'day': 'day',
                'week': 'week',
                'month': 'month',
                'year': 'year',
            }
            
            period_normalized = period_mapping.get(period.upper(), period.lower())
            
            if period_normalized == 'day':
                queryset = queryset.filter(periode_debut=now, periode_fin=now)
            elif period_normalized == 'week':
                week_start = now - timedelta(days=now.weekday())
                queryset = queryset.filter(periode_debut__gte=week_start, periode_fin__lte=now)
            elif period_normalized == 'month':
                month_start = now.replace(day=1)
                queryset = queryset.filter(periode_debut__gte=month_start, periode_fin__lte=now)
            elif period_normalized == 'year':
                year_start = now.replace(month=1, day=1)
                queryset = queryset.filter(periode_debut__gte=year_start, periode_fin__lte=now)
        
        if type_report:
            queryset = queryset.filter(type_report=type_report)
        
        return queryset.order_by('-generated_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """
        GET /api/reports/{id}/download
        """
        report = self.get_object()
        if not report.fichier:
            return Response({'error': 'Aucun fichier disponible'}, status=status.HTTP_404_NOT_FOUND)
        
        return FileResponse(report.fichier.open(), as_attachment=True, filename=report.fichier.name)


class EmployeesStatusView(viewsets.ViewSet):
    """
    GET /api/employees/status?restaurant_id=X&date=YYYY-MM-DD
    """

    @extend_schema(
        parameters=[
            OpenApiParameter(name='restaurant_id', type=int, required=False),
            OpenApiParameter(name='date', type=str, required=False, description='YYYY-MM-DD'),
        ],
        responses={
            200: inline_serializer(
                name='EmployeesStatusResponse',
                fields={
                    'date': serializers.CharField(),
                    'restaurant_id': serializers.IntegerField(allow_null=True),
                    'employees': serializers.ListField(child=serializers.DictField()),
                },
            ),
            400: inline_serializer(name='EmployeesStatusError', fields={'error': serializers.CharField()}),
        },
    )
    def list(self, request):
        restaurant_id = request.query_params.get('restaurant_id')
        date_str = request.query_params.get('date')
        
        from django.utils import timezone
        from datetime import datetime
        from apps.planning.models import Shift
        
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Format de date invalide'}, status=400)
        else:
            target_date = timezone.now().date()
        
        queryset = Employe.objects.all()
        if restaurant_id:
            from apps.staff.models import RestaurantEmploye
            employes_ids = RestaurantEmploye.objects.filter(
                restaurant_id=restaurant_id
            ).values_list('employe_id', flat=True)
            queryset = queryset.filter(id__in=employes_ids)
        
        employees_status = []
        for employe in queryset:
            # Vérifier les shifts du jour
            shifts_today = Shift.objects.filter(
                employe=employe,
                date_debut__date=target_date
            )
            is_present = shifts_today.exists()
            
            # TODO: Vérifier les congés
            is_on_leave = False  # À implémenter si vous avez un modèle Conges
            
            employees_status.append({
                'employee_id': employe.id,
                'employee_name': f"{employe.prenom} {employe.nom}",
                'is_present': is_present,
                'is_on_leave': is_on_leave,
                'shifts_count': shifts_today.count(),
            })
        
        return Response({
            'date': target_date.isoformat(),
            'restaurant_id': restaurant_id,
            'employees': employees_status
        })

