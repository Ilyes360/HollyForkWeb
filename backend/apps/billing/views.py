from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum
from django.utils import timezone

from apps.billing.models import Facture, Paiement, MethodePaiement
from apps.billing.serializers import FactureSerializer, PaiementSerializer, MethodePaiementSerializer
from apps.staff.permissions import HasPermission, CanProcessPayments, CanAccessFinancialReports
from apps.staff.employee_roles import Permission, EmployeeRole
from apps.staff.permissions_utils import PermissionChecker


class FactureViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les factures.
    
    Permissions requises:
    - Liste/Lecture: GENERATE_INVOICES ou VIEW_FINANCIAL_REPORTS
    - Création: GENERATE_INVOICES
    - Modification/Suppression: GENERATE_INVOICES + (Admin ou Directeur)
    """
    serializer_class = FactureSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant', 'etat', 'date']

    def get_permissions(self):
        """Stats requiert VIEW_FINANCIAL_REPORTS."""
        if self.action == 'stats':
            return [IsAuthenticated(), CanAccessFinancialReports()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Retourne les factures filtrées selon l'accès restaurant de l'utilisateur.
        Les Super Admins voient tout, les autres uniquement leurs restaurants.
        """
        queryset = Facture.objects.select_related(
            'restaurant',
            'commande',
            'commande__restaurant',
            'commande__created_by'
        ).prefetch_related(
            'lignes',
            'lignes__produit',
            'lignes__taux_tva'
        )
        
        # Filtrer selon l'accès restaurant
        checker = PermissionChecker(user=self.request.user)
        
        # Super Admin voit tout
        if checker.role == EmployeeRole.SUPER_ADMIN_GROUPE:
            return queryset.all()
        
        # Les autres voient uniquement leurs restaurants
        restaurants = checker.get_restaurants()
        return queryset.filter(restaurant__in=restaurants)

    @action(detail=True, methods=['patch'])
    def marquer_payee(self, request, pk=None):
        """
        Marque une facture comme payée.
        Permission requise: PROCESS_PAYMENTS ou PROCESS_CASH
        """
        try:
            facture = self.get_queryset().get(pk=pk)
        except Facture.DoesNotExist:
            raise NotFound("Facture non trouvée.")

        if facture.etat == 'payee':
            return Response(
                {"detail": "La facture est déjà marquée comme payée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        facture.etat = 'payee'
        facture.save(update_fields=['etat', 'updated_at'])
        return Response(self.get_serializer(facture).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Retourne les statistiques globales de facturation.
        Permission requise: VIEW_FINANCIAL_REPORTS
        """
        checker = PermissionChecker(user=request.user)
        
        # Filtrer selon l'accès restaurant
        if checker.role == EmployeeRole.SUPER_ADMIN_GROUPE:
            queryset = Facture.objects.all()
        else:
            restaurants = checker.get_restaurants()
            queryset = Facture.objects.filter(restaurant__in=restaurants)
        
        total_invoices = queryset.count()
        aggregates = queryset.aggregate(
            total_revenue_ht=Sum('montant_ht'),
            total_revenue_ttc=Sum('montant_ttc'),
            total_tva=Sum('montant_tva')
        )
        
        return Response({
            "total_invoices": total_invoices,
            "total_revenue_before_tax": float(aggregates['total_revenue_ht'] or 0),
            "total_revenue_ttc": float(aggregates['total_revenue_ttc'] or 0),
            "total_tva": float(aggregates['total_tva'] or 0),
            "date_generated": timezone.now().isoformat(),
            "scope": "global" if checker.role == EmployeeRole.SUPER_ADMIN_GROUPE else "restaurants"
        })


class PaiementViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les paiements.
    
    Permissions requises:
    - Liste/Lecture: PROCESS_PAYMENTS ou VIEW_FINANCIAL_REPORTS
    - Création: PROCESS_PAYMENTS ou PROCESS_CASH
    - Modification/Suppression: Réservé aux Admins et Directeurs
    """
    serializer_class = PaiementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['facture', 'methode_paiement']

    def get_queryset(self):
        """
        Retourne les paiements filtrés selon l'accès restaurant de l'utilisateur.
        """
        queryset = Paiement.objects.select_related(
            'facture',
            'facture__restaurant',
            'methode_paiement'
        )
        
        # Filtrer selon l'accès restaurant
        checker = PermissionChecker(user=self.request.user)
        
        # Super Admin voit tout
        if checker.role == EmployeeRole.SUPER_ADMIN_GROUPE:
            return queryset.all()
        
        # Les autres voient uniquement leurs restaurants
        restaurants = checker.get_restaurants()
        return queryset.filter(facture__restaurant__in=restaurants)

    def perform_create(self, serializer):
        """Après création du paiement, marque la facture comme payée si le total payé >= montant TTC."""
        paiement = serializer.save()
        facture = paiement.facture
        if facture.etat == 'en_attente' and facture.montant_paye >= facture.montant_ttc:
            facture.etat = 'payee'
            facture.save(update_fields=['etat', 'updated_at'])


class MethodePaiementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Liste des méthodes de paiement disponibles (lecture seule).
    Accessible à tous les utilisateurs authentifiés.
    """
    queryset = MethodePaiement.objects.all()
    serializer_class = MethodePaiementSerializer
    permission_classes = [IsAuthenticated]
