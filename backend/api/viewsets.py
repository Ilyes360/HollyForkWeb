"""
CRUD ViewSets for strong-candidate models (Salle, Role, Table, Client, etc.).
All require authentication; list/detail are filtered by user's salle when applicable.
"""
from datetime import date, datetime, timedelta
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Salle,
    Role,
    Table,
    Client,
    Reservation,
    Detail_Reservation_Table,
    Menu,
    Groupe_Menu,
    Plat,
    Appartenance_Menu_Plat,
    Formule,
    Ingredient,
    IngredientMovement,
    Fournisseur,
    CommandeFournisseur,
    LigneCommandeFournisseur,
    Categorie_Produit,
    Produit,
    StockMovement,
    Commande,
    Ligne_Commande,
    Facture,
    Paiement,
    Type_Apport,
    Apport,
    Employee,
    PlanningShift,
    PlanningCapacity,
    SupplierOrder,
    TeamShift,
)
from .serializers import (
    SalleSerializer,
    RoleSerializer,
    TableSerializer,
    ClientSerializer,
    ReservationSerializer,
    MenuSerializer,
    GroupeMenuSerializer,
    PlatSerializer,
    FormuleSerializer,
    IngredientSerializer,
    IngredientMovementSerializer,
    FournisseurSerializer,
    LigneCommandeFournisseurSerializer,
    CommandeFournisseurSerializer,
    CategorieProduitSerializer,
    ProduitSerializer,
    StockMovementSerializer,
    CommandeSerializer,
    CommandeHistoriqueSerializer,
    LigneCommandeSerializer,
    FactureSerializer,
    PaiementSerializer,
    TypeApportSerializer,
    ApportSerializer,
    EmployeeSerializer,
    PlanningShiftSerializer,
    PlanningCapacitySerializer,
    SupplierOrderSerializer,
    TeamShiftSerializer,
)


class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer
    permission_classes = [IsAuthenticated]


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]


class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [IsAuthenticated]


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]


def _reservation_salle_id(request):
    """Salle ID from query param ?salle= or user profile. None = no filter."""
    raw = getattr(request, 'query_params', None) and request.query_params.get('salle')
    if raw is not None and raw != '':
        try:
            return int(raw)
        except (ValueError, TypeError):
            pass
    try:
        if hasattr(request, 'user') and hasattr(request.user, 'profile'):
            return getattr(request.user.profile, 'salle_id', None)
    except Exception:
        pass
    return None


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from datetime import datetime as dt
        qs = Reservation.objects.all().select_related('client', 'salle').prefetch_related('tables').order_by('date_reservation', 'heure_reservation')
        salle_id = _reservation_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(salle_id=salle_id)
        params = self.request.query_params
        statut = params.get('statut')
        if statut:
            qs = qs.filter(statut_reservation=statut)
        client_id = params.get('client')
        if client_id:
            try:
                qs = qs.filter(client_id=int(client_id))
            except (ValueError, TypeError):
                pass
        date_from = params.get('date_from')
        if date_from:
            try:
                qs = qs.filter(date_reservation__gte=dt.strptime(str(date_from)[:10], '%Y-%m-%d').date())
            except (ValueError, TypeError):
                pass
        date_to = params.get('date_to')
        if date_to:
            try:
                qs = qs.filter(date_reservation__lte=dt.strptime(str(date_to)[:10], '%Y-%m-%d').date())
            except (ValueError, TypeError):
                pass
        return qs

    @action(detail=False, methods=['get'], url_path='today')
    def today(self, request):
        """GET /api/reservations/today/?salle=ID — reservations for today (optional salle filter)."""
        qs = self.get_queryset()
        qs = qs.filter(date_reservation=date.today())
        ser = ReservationSerializer(qs, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='by-date')
    def by_date(self, request):
        """GET /api/reservations/by_date/?date=YYYY-MM-DD&salle=ID — reservations for the given date."""
        raw = request.query_params.get('date')
        if not raw:
            return Response({'error': 'Query param date= (YYYY-MM-DD) required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            d = datetime.strptime(str(raw)[:10], '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        qs = self.get_queryset().filter(date_reservation=d)
        ser = ReservationSerializer(qs, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='confirmer')
    def confirmer(self, request, pk=None):
        """POST /api/reservations/<id>/confirmer/ — met le statut à confirmed."""
        resa = self.get_object()
        if resa.statut_reservation == 'cancelled':
            return Response({'error': 'Impossible de confirmer une réservation annulée.'}, status=status.HTTP_400_BAD_REQUEST)
        resa.statut_reservation = 'confirmed'
        resa.save(update_fields=['statut_reservation'])
        ser = ReservationSerializer(resa)
        return Response(ser.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='annuler')
    def annuler(self, request, pk=None):
        """POST /api/reservations/<id>/annuler/ — met le statut à cancelled."""
        resa = self.get_object()
        resa.statut_reservation = 'cancelled'
        resa.save(update_fields=['statut_reservation'])
        ser = ReservationSerializer(resa)
        return Response(ser.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='marquer-arrivee')
    def marquer_arrivee(self, request, pk=None):
        """POST /api/reservations/<id>/marquer-arrivee/ — met le statut à arrived."""
        resa = self.get_object()
        if resa.statut_reservation == 'cancelled':
            return Response({'error': 'Impossible de marquer comme arrivée une réservation annulée.'}, status=status.HTTP_400_BAD_REQUEST)
        resa.statut_reservation = 'arrived'
        resa.save(update_fields=['statut_reservation'])
        ser = ReservationSerializer(resa)
        return Response(ser.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'post', 'delete'], url_path='tables')
    def tables_action(self, request, pk=None):
        """GET: liste des tables. POST: ajouter une table (body: { "table": <id> }). DELETE: retirer (query: ?table=<id>)."""
        resa = self.get_object()
        if request.method == 'GET':
            data = [{'id': t.id, 'numero_table': t.numero_table, 'capacite_table': t.capacite_table} for t in resa.tables.all()]
            return Response(data, status=status.HTTP_200_OK)
        if request.method == 'POST':
            table_id = request.data.get('table')
            if table_id is None:
                return Response({'error': 'Clé "table" (id) requise.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                table = Table.objects.get(pk=table_id)
            except (Table.DoesNotExist, ValueError, TypeError):
                return Response({'error': 'Table introuvable.'}, status=status.HTTP_404_NOT_FOUND)
            if table.salle_id != resa.salle_id:
                return Response({'error': 'La table doit appartenir à la même salle que la réservation.'}, status=status.HTTP_400_BAD_REQUEST)
            from datetime import datetime as dt, timedelta
            resa_start = dt.combine(resa.date_reservation, resa.heure_reservation)
            resa_end = resa_start + timedelta(hours=2)
            overlapping = Reservation.objects.filter(
                date_reservation=resa.date_reservation,
                statut_reservation__in=['pending', 'confirmed', 'arrived'],
                tables=table,
            ).exclude(pk=resa.pk)
            for other in overlapping:
                other_start = dt.combine(other.date_reservation, other.heure_reservation)
                other_end = other_start + timedelta(hours=2)
                if other_start < resa_end and other_end > resa_start:
                    return Response(
                        {'error': f'La table est déjà réservée à un créneau qui chevauche ({other.heure_reservation.strftime("%H:%M")}).'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            cap_actuelle = sum(t.capacite_table for t in resa.tables.all())
            if cap_actuelle + table.capacite_table < resa.nombre_personnes:
                return Response(
                    {'error': f'La capacité des tables ({cap_actuelle + table.capacite_table}) serait insuffisante pour {resa.nombre_personnes} couverts.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            link, created = Detail_Reservation_Table.objects.get_or_create(reservation=resa, table=table)
            if not created:
                return Response({'detail': 'Cette table est déjà assignée à la réservation.', 'table_id': table_id}, status=status.HTTP_200_OK)
            return Response({'detail': 'Table assignée.', 'table_id': table_id}, status=status.HTTP_201_CREATED)
        table_id = request.query_params.get('table')
        if not table_id:
            return Response({'error': 'Paramètre "table" (id) requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            table_id = int(table_id)
        except (ValueError, TypeError):
            return Response({'error': 'Paramètre "table" invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = Detail_Reservation_Table.objects.filter(reservation=resa, table_id=table_id).delete()
        if not deleted:
            return Response({'detail': 'Table non assignée à cette réservation.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='creneaux-disponibles')
    def creneaux_disponibles(self, request):
        """GET /api/reservations/creneaux-disponibles/?date=YYYY-MM-DD&salle=<id>&couverts=<n> — créneaux avec tables dispo (durée 2h par résa)."""
        from datetime import time as dt_time
        raw_date = request.query_params.get('date')
        if not raw_date:
            return Response({'error': 'Paramètre date= (YYYY-MM-DD) requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            d = datetime.strptime(str(raw_date)[:10], '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return Response({'error': 'Format date invalide (YYYY-MM-DD).'}, status=status.HTTP_400_BAD_REQUEST)
        salle_id = request.query_params.get('salle') or _reservation_salle_id(request)
        if not salle_id:
            return Response({'error': 'Paramètre salle= ou profil salle requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            salle_id = int(salle_id)
        except (ValueError, TypeError):
            return Response({'error': 'salle invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        couverts = request.query_params.get('couverts')
        if couverts is not None:
            try:
                couverts = int(couverts)
            except (ValueError, TypeError):
                couverts = None
        tables_qs = Table.objects.filter(salle_id=salle_id, actif=True)
        if couverts is not None:
            tables_qs = tables_qs.filter(capacite_table__gte=couverts)
        tables = list(tables_qs)
        if not tables:
            return Response({'creneaux': [], 'date': str(d), 'salle': salle_id}, status=status.HTTP_200_OK)
        table_ids = [t.id for t in tables]
        resas = Reservation.objects.filter(
            date_reservation=d,
            statut_reservation__in=['pending', 'confirmed', 'arrived'],
        ).filter(tables__id__in=table_ids).prefetch_related('tables').distinct()
        duree_resa_heures = 2
        slots = []
        for h in range(11, 23):
            for m in (0, 30):
                if h == 22 and m == 30:
                    break
                slots.append(dt_time(h, m))
        creneaux = []
        for slot_time in slots:
            slot_dt = datetime.combine(d, slot_time)
            from datetime import timedelta
            slot_end = slot_dt + timedelta(hours=duree_resa_heures)
            tables_occupees = set()
            for resa in resas:
                resa_dt = datetime.combine(resa.date_reservation, resa.heure_reservation)
                resa_end = resa_dt + timedelta(hours=duree_resa_heures)
                if resa_dt < slot_end and resa_end > slot_dt:
                    for t in resa.tables.all():
                        if t.id in table_ids:
                            tables_occupees.add(t.id)
            tables_dispo = [tid for tid in table_ids if tid not in tables_occupees]
            creneaux.append({
                'heure': slot_time.strftime('%H:%M'),
                'tables_disponibles': tables_dispo,
            })
        return Response({'creneaux': creneaux, 'date': str(d), 'salle': salle_id}, status=status.HTTP_200_OK)


class MenuViewSet(viewsets.ModelViewSet):
    queryset = Menu.objects.all().prefetch_related('lien_plats__plat')
    serializer_class = MenuSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get', 'post', 'delete'], url_path='plats')
    def plats(self, request, pk=None):
        """GET: liste des plats du menu. POST: ajouter un plat (body: { "plat": <id> }). DELETE: retirer (query: ?plat=<id>)."""
        menu = self.get_object()
        if request.method == 'GET':
            links = menu.lien_plats.select_related('plat').all()
            data = [
                {'id': link.plat_id, 'nom_plat': link.plat.nom_plat, 'prix_plat': str(link.plat.prix_plat)}
                for link in links
            ]
            return Response(data, status=status.HTTP_200_OK)
        if request.method == 'POST':
            plat_id = request.data.get('plat')
            if plat_id is None:
                return Response({'error': 'Clé "plat" (id du plat) requise.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                plat = Plat.objects.get(pk=plat_id)
            except (Plat.DoesNotExist, ValueError, TypeError):
                return Response({'error': 'Plat introuvable.'}, status=status.HTTP_404_NOT_FOUND)
            if plat.salle_id != menu.salle_id:
                return Response(
                    {'error': 'Le plat doit appartenir à la même salle que le menu.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            link, created = Appartenance_Menu_Plat.objects.get_or_create(menu=menu, plat=plat)
            if not created:
                return Response(
                    {'detail': 'Ce plat est déjà dans le menu.', 'plat_id': plat_id},
                    status=status.HTTP_200_OK,
                )
            return Response(
                {'detail': 'Plat ajouté au menu.', 'plat_id': plat_id},
                status=status.HTTP_201_CREATED,
            )
        # DELETE
        plat_id = request.query_params.get('plat')
        if not plat_id:
            return Response({'error': 'Paramètre "plat" (id) requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            plat_id = int(plat_id)
        except (ValueError, TypeError):
            return Response({'error': 'Paramètre "plat" invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = Appartenance_Menu_Plat.objects.filter(menu=menu, plat_id=plat_id).delete()
        if not deleted:
            return Response({'detail': 'Plat non présent dans le menu.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupeMenuViewSet(viewsets.ModelViewSet):
    queryset = Groupe_Menu.objects.all()
    serializer_class = GroupeMenuSerializer
    permission_classes = [IsAuthenticated]


class PlatViewSet(viewsets.ModelViewSet):
    queryset = Plat.objects.all()
    serializer_class = PlatSerializer
    permission_classes = [IsAuthenticated]


class FormuleViewSet(viewsets.ModelViewSet):
    queryset = Formule.objects.all()
    serializer_class = FormuleSerializer
    permission_classes = [IsAuthenticated]


class CategorieProduitViewSet(viewsets.ModelViewSet):
    queryset = Categorie_Produit.objects.all()
    serializer_class = CategorieProduitSerializer
    permission_classes = [IsAuthenticated]


def _ingredient_salle_id(request):
    """Salle ID from query param ?salle= or user profile. None = no filter."""
    raw = getattr(request, 'query_params', None) and request.query_params.get('salle')
    if raw is not None and raw != '':
        try:
            return int(raw)
        except (ValueError, TypeError):
            pass
    try:
        if hasattr(request, 'user') and hasattr(request.user, 'profile'):
            return getattr(request.user.profile, 'salle_id', None)
    except Exception:
        pass
    return None


class IngredientViewSet(viewsets.ModelViewSet):
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Ingredient.objects.all().select_related('salle')
        salle_id = _ingredient_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(salle_id=salle_id)
        return qs

    @action(detail=True, methods=['patch'], url_path='stock')
    def stock(self, request, pk=None):
        """PATCH /api/stock/<id>/stock/ — set or adjust stock (ingredients). Body: { quantity: n } or { delta: n }."""
        from decimal import Decimal
        ingredient = self.get_object()
        quantity = request.data.get('quantity')
        delta = request.data.get('delta')
        if quantity is not None:
            try:
                new_stock = Decimal(str(quantity))
            except (TypeError, ValueError):
                return Response({'error': 'quantity must be a number'}, status=status.HTTP_400_BAD_REQUEST)
        elif delta is not None:
            try:
                new_stock = ingredient.stock_actuel + Decimal(str(delta))
            except (TypeError, ValueError):
                return Response({'error': 'delta must be a number'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Provide quantity or delta'}, status=status.HTTP_400_BAD_REQUEST)
        if new_stock < 0:
            return Response({'error': 'Stock cannot be negative'}, status=status.HTTP_400_BAD_REQUEST)
        ingredient.stock_actuel = new_stock
        ingredient.save(update_fields=['stock_actuel'])
        return Response({'stock_actuel': str(ingredient.stock_actuel)}, status=status.HTTP_200_OK)


class IngredientMovementViewSet(viewsets.ModelViewSet):
    """List/create/retrieve ingredient stock movements. No update/delete."""
    serializer_class = IngredientMovementSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = IngredientMovement.objects.all().select_related('ingredient', 'user').order_by('-created_at')
        salle_id = _ingredient_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(ingredient__salle_id=salle_id)
        ingredient_id = self.request.query_params.get('ingredient')
        if ingredient_id:
            try:
                qs = qs.filter(ingredient_id=int(ingredient_id))
            except (ValueError, TypeError):
                pass
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def _fournisseur_salle_id(request):
    """Salle ID from query param ?salle= or user profile."""
    raw = getattr(request, 'query_params', None) and request.query_params.get('salle')
    if raw is not None and raw != '':
        try:
            return int(raw)
        except (ValueError, TypeError):
            pass
    try:
        if hasattr(request, 'user') and hasattr(request.user, 'profile'):
            return getattr(request.user.profile, 'salle_id', None)
    except Exception:
        pass
    return None


class FournisseurViewSet(viewsets.ModelViewSet):
    """Suppliers (fournisseurs) for restocking ingredients. Filtered by salle."""
    serializer_class = FournisseurSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Fournisseur.objects.all().select_related('salle')
        salle_id = _fournisseur_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(salle_id=salle_id)
        return qs


class CommandeFournisseurViewSet(viewsets.ModelViewSet):
    """Supplier orders for restocking. Action marquer_comme_livree creates stock movements."""
    serializer_class = CommandeFournisseurSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = CommandeFournisseur.objects.all().select_related(
            'fournisseur', 'salle'
        ).prefetch_related('lignes__ingredient').order_by('-created_at')
        salle_id = _fournisseur_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(salle_id=salle_id)
        return qs

    def perform_create(self, serializer):
        if 'salle' not in serializer.validated_data or serializer.validated_data['salle'] is None:
            fournisseur = serializer.validated_data.get('fournisseur')
            if fournisseur:
                serializer.validated_data['salle'] = fournisseur.salle
        serializer.save()

    def perform_update(self, serializer):
        instance = serializer.instance
        old_statut = instance.statut
        serializer.save()
        if serializer.validated_data.get('statut') == 'livree' and old_statut != 'livree' and not instance.livraison_effectuee:
            instance.appliquer_livraison(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='marquer-comme-livree')
    def marquer_comme_livree(self, request, pk=None):
        """Mark order as delivered: create ingredient stock movements and set statut to livree."""
        commande = self.get_object()
        if commande.livraison_effectuee:
            return Response(
                {'detail': 'Livraison déjà effectuée.', 'statut': commande.statut},
                status=status.HTTP_200_OK,
            )
        if commande.statut == 'annulee':
            return Response(
                {'error': 'Impossible de livrer une commande annulée.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        commande.appliquer_livraison(user=request.user)
        ser = CommandeFournisseurSerializer(commande)
        return Response(ser.data, status=status.HTTP_200_OK)


class LigneCommandeFournisseurViewSet(viewsets.ModelViewSet):
    """Lines of a supplier order. Filtered by salle (via commande)."""
    serializer_class = LigneCommandeFournisseurSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = LigneCommandeFournisseur.objects.all().select_related('commande', 'ingredient')
        salle_id = _fournisseur_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(commande__salle_id=salle_id)
        return qs


def _produit_salle_id(request):
    """Salle ID from query param ?salle= or user profile. None = no filter."""
    raw = getattr(request, 'query_params', None) and request.query_params.get('salle')
    if raw is not None and raw != '':
        try:
            return int(raw)
        except (ValueError, TypeError):
            pass
    try:
        if hasattr(request, 'user') and hasattr(request.user, 'profile'):
            return getattr(request.user.profile, 'salle_id', None)
    except Exception:
        pass
    return None


class ProduitViewSet(viewsets.ModelViewSet):
    serializer_class = ProduitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Produit.objects.all().select_related('categorie', 'salle')
        salle_id = _produit_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(salle_id=salle_id)
        return qs

    @action(detail=True, methods=['patch'], url_path='stock')
    def stock(self, request, pk=None):
        """PATCH /api/produits/<id>/stock/ — set or adjust stock. Body: { quantity: n } or { delta: n }."""
        product = self.get_object()
        quantity = request.data.get('quantity')
        delta = request.data.get('delta')
        if quantity is not None:
            try:
                new_stock = int(quantity)
            except (TypeError, ValueError):
                return Response({'error': 'quantity must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        elif delta is not None:
            try:
                new_stock = product.stock_produit + int(delta)
            except (TypeError, ValueError):
                return Response({'error': 'delta must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Provide quantity or delta'}, status=status.HTTP_400_BAD_REQUEST)
        if new_stock < 0:
            return Response({'error': 'Stock cannot be negative'}, status=status.HTTP_400_BAD_REQUEST)
        product.stock_produit = new_stock
        product.save(update_fields=['stock_produit'])
        return Response({'stock_produit': product.stock_produit}, status=status.HTTP_200_OK)


class StockMovementViewSet(viewsets.ModelViewSet):
    """CRUD for stock movements. Create applies delta to product stock. List/retrieve only (no update/delete)."""
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = StockMovement.objects.all().select_related('produit', 'user').order_by('-created_at')
        salle_id = _produit_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(produit__salle_id=salle_id)
        produit_id = self.request.query_params.get('produit')
        if produit_id:
            try:
                qs = qs.filter(produit_id=int(produit_id))
            except (ValueError, TypeError):
                pass
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def _commande_salle_id(request):
    """Salle ID from query param ?salle= or user profile. None = no filter."""
    raw = getattr(request, 'query_params', None) and request.query_params.get('salle')
    if raw is not None and raw != '':
        try:
            return int(raw)
        except (ValueError, TypeError):
            pass
    try:
        if hasattr(request, 'user') and hasattr(request.user, 'profile'):
            return getattr(request.user.profile, 'salle_id', None)
    except Exception:
        pass
    return None


class CommandeViewSet(viewsets.ModelViewSet):
    """Historique des commandes : list/retrieve incluent lignes + facture (résumé). Filtres : salle, date_from, date_to, statut, has_facture, statut_facture."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from datetime import datetime as dt
        qs = Commande.objects.all().select_related(
            'salle', 'table', 'client', 'user', 'facture'
        ).prefetch_related('lignes').order_by('-date_commande')
        params = self.request.query_params
        salle_id = _commande_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(salle_id=salle_id)
        date_from = params.get('date_from')
        if date_from:
            try:
                d = dt.strptime(str(date_from)[:10], '%Y-%m-%d').date()
                qs = qs.filter(date_commande__date__gte=d)
            except (ValueError, TypeError):
                pass
        date_to = params.get('date_to')
        if date_to:
            try:
                d = dt.strptime(str(date_to)[:10], '%Y-%m-%d').date()
                qs = qs.filter(date_commande__date__lte=d)
            except (ValueError, TypeError):
                pass
        statut = params.get('statut') or params.get('statut_commande')
        if statut:
            qs = qs.filter(statut_commande=statut)
        has_facture = params.get('has_facture')
        if has_facture is not None and str(has_facture).lower() in ('true', '1', 'yes'):
            qs = qs.filter(facture__isnull=False)
        elif has_facture is not None and str(has_facture).lower() in ('false', '0', 'no'):
            qs = qs.filter(facture__isnull=True)
        statut_facture = params.get('statut_facture')
        if statut_facture:
            qs = qs.filter(facture__statut_facture=statut_facture)
        return qs

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve', 'historique'):
            return CommandeHistoriqueSerializer
        return CommandeSerializer

    @action(detail=True, methods=['post'], url_path='creer-facture')
    def creer_facture(self, request, pk=None):
        """Crée une facture pour cette commande (montant = somme des lignes ou total_commande)."""
        from decimal import Decimal
        from django.db.models import Sum
        commande = self.get_object()
        if hasattr(commande, 'facture') and commande.facture:
            return Response(
                {'detail': 'Une facture existe déjà pour cette commande.', 'facture_id': commande.facture.id},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if commande.statut_commande == 'cancelled':
            return Response(
                {'error': 'Impossible de facturer une commande annulée.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        total = commande.lignes.aggregate(Sum('total_ligne'))['total_ligne__sum']
        if total is None:
            total = commande.total_commande or Decimal('0')
        facture = Facture.objects.create(
            commande=commande,
            client=commande.client,
            salle=commande.salle,
            montant_total=total,
            statut_facture='unpaid',
        )
        ser = FactureSerializer(facture)
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='historique')
    def historique(self, request):
        """GET /api/commandes/historique/ — alias de la liste avec filtres (même queryset et serializer)."""
        return self.list(request)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """GET /api/commandes/stats/ — agrégats sur l'historique (nombre, CA, par statut). Filtres : date_from, date_to, salle."""
        from django.db.models import Sum, Count
        from datetime import datetime as dt
        qs = self.get_queryset()
        total_count = qs.count()
        result = qs.aggregate(
            total_ca=Sum('total_commande'),
        )
        total_ca = result.get('total_ca') or 0
        by_statut = dict(
            qs.values('statut_commande').annotate(count=Count('id')).values_list('statut_commande', 'count')
        )
        with_facture = qs.filter(facture__isnull=False).count()
        facture_paid = qs.filter(facture__statut_facture='paid').count()
        facture_unpaid = qs.filter(facture__statut_facture='unpaid').count()
        return Response({
            'total_commandes': total_count,
            'total_ca': str(total_ca),
            'par_statut_commande': {
                'open': by_statut.get('open', 0),
                'paid': by_statut.get('paid', 0),
                'cancelled': by_statut.get('cancelled', 0),
            },
            'avec_facture': with_facture,
            'facture_payee': facture_paid,
            'facture_impayee': facture_unpaid,
        }, status=status.HTTP_200_OK)


class LigneCommandeViewSet(viewsets.ModelViewSet):
    queryset = Ligne_Commande.objects.all()
    serializer_class = LigneCommandeSerializer
    permission_classes = [IsAuthenticated]

    def _recalcul_commande(self, commande):
        if commande:
            commande.recalculer_total_commande()

    def perform_create(self, serializer):
        ligne = serializer.save()
        self._recalcul_commande(ligne.commande)

    def perform_update(self, serializer):
        ligne = serializer.save()
        self._recalcul_commande(ligne.commande)

    def perform_destroy(self, instance):
        commande = instance.commande
        instance.delete()
        self._recalcul_commande(commande)


class FactureViewSet(viewsets.ModelViewSet):
    queryset = Facture.objects.all()
    serializer_class = FactureSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='recalculer-montant')
    def recalculer_montant(self, request, pk=None):
        """Recalcule montant_total à partir de la somme des lignes de la commande."""
        facture = self.get_object()
        facture.recalculer_montant_total()
        ser = FactureSerializer(facture)
        return Response(ser.data, status=status.HTTP_200_OK)


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer
    permission_classes = [IsAuthenticated]

    def _recalcul_statut_facture(self, facture):
        if facture:
            facture.recalculer_statut()

    def perform_create(self, serializer):
        paiement = serializer.save()
        self._recalcul_statut_facture(paiement.facture)

    def perform_update(self, serializer):
        paiement = serializer.save()
        self._recalcul_statut_facture(paiement.facture)

    def perform_destroy(self, instance):
        facture = instance.facture
        instance.delete()
        self._recalcul_statut_facture(facture)


class TypeApportViewSet(viewsets.ModelViewSet):
    queryset = Type_Apport.objects.all()
    serializer_class = TypeApportSerializer
    permission_classes = [IsAuthenticated]


class ApportViewSet(viewsets.ModelViewSet):
    queryset = Apport.objects.all()
    serializer_class = ApportSerializer
    permission_classes = [IsAuthenticated]


def _planning_salle_id(request):
    """Salle ID from query param ?salle= or user profile. None = no filter."""
    raw = getattr(request, 'query_params', None) and request.query_params.get('salle')
    if raw is not None and raw != '':
        try:
            return int(raw)
        except (ValueError, TypeError):
            pass
    try:
        if hasattr(request, 'user') and hasattr(request.user, 'profile'):
            return getattr(request.user.profile, 'salle_id', None)
    except Exception:
        pass
    return None


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Employee.objects.all().order_by('nom')
        salle_id = _planning_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(salle_id=salle_id)
        return qs


class PlanningShiftViewSet(viewsets.ModelViewSet):
    serializer_class = PlanningShiftSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = PlanningShift.objects.all().select_related('employee')
        salle_id = _planning_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(employee__salle_id=salle_id)
        return qs


class PlanningCapacityViewSet(viewsets.ModelViewSet):
    """CRUD capacité planning : effectif requis par salle, jour (0=lund..6=dim), type (Midi/Soir)."""
    serializer_class = PlanningCapacitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = PlanningCapacity.objects.all().select_related('salle').order_by('salle', 'day_of_week', 'type_shift')
        salle_id = _planning_salle_id(self.request)
        if salle_id is not None:
            qs = qs.filter(salle_id=salle_id)
        return qs


class SupplierOrderViewSet(viewsets.ModelViewSet):
    queryset = SupplierOrder.objects.all()
    serializer_class = SupplierOrderSerializer
    permission_classes = [IsAuthenticated]


class TeamShiftViewSet(viewsets.ModelViewSet):
    queryset = TeamShift.objects.all()
    serializer_class = TeamShiftSerializer
    permission_classes = [IsAuthenticated]
