from decimal import Decimal

from django.db import transaction
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from apps.commandes.models import Commande, LigneCommande
from apps.commandes.serializers import CommandeSerializer, LigneCommandeSerializer
from apps.commandes.services import CommandeService, LigneCommandeService
from apps.salles.models import Table
from rest_framework.permissions import IsAuthenticated

# Create your views here.
class CommandeViewSet(viewsets.ModelViewSet):
    serializer_class = CommandeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant_id', 'created_by_id', 'table_id', 'statut']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Utilise le manager optimisé selon le contexte."""
        # Récupérer les paramètres de requête
        restaurant_id = self.request.query_params.get('restaurant_id')
        id_commande = self.request.query_params.get('id')
        statut = self.request.query_params.get('statut')
        limit_days = self.request.query_params.get('limit_days')
        
        # Utiliser le manager optimisé
        if restaurant_id:
            try:
                restaurant_id = int(restaurant_id)
                limit_days_int = int(limit_days) if limit_days else None
                
                # Utiliser la méthode optimisée du manager
                queryset = Commande.objects.by_restaurant(
                    restaurant_id=restaurant_id,
                    statut=statut,
                    limit_days=limit_days_int
                )
            except ValueError:
                queryset = Commande.objects.get_optimized_queryset()
        else:
            queryset = Commande.objects.get_optimized_queryset()
            
            # Appliquer les filtres manuellement si pas de restaurant_id
            if statut:
                queryset = queryset.filter(statut=statut)
                
            if limit_days:
                try:
                    from django.utils import timezone
                    from datetime import timedelta
                    limit_days_int = int(limit_days)
                    date_limite = timezone.now() - timedelta(days=limit_days_int)
                    queryset = queryset.filter(created_at__gte=date_limite)
                except ValueError:
                    pass
        
        # Filtrage par ID de commande
        if id_commande:
            try:
                queryset = queryset.filter(id=int(id_commande))
            except ValueError:
                queryset = queryset.none()
                
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """
        Surcharge pour gérer l'archivage automatique des commandes.
        Quand une commande passe en statut VALIDEE ou ANNULEE, elle est archivée
        dans CommandeHistoric et supprimée de la table Commande.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Créer le serializer et valider
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Récupérer le statut demandé
        new_statut = serializer.validated_data.get('status', instance.statut)
        
        # Si la commande va être archivée, capturer les données AVANT la mise à jour
        if new_statut in ['VALIDEE', 'ANNULEE']:
            # Créer une copie des données actuelles pour la réponse
            response_serializer = self.get_serializer(instance)
            response_data = response_serializer.data
            
            # Mettre à jour le statut dans les données de réponse
            response_data['statut'] = new_statut
            
            # Effectuer la mise à jour (qui va archiver et supprimer)
            self.perform_update(serializer)
            
            # Retourner les données capturées avant archivage
            return Response(response_data)
        
        # Pour les autres statuts, comportement normal
        self.perform_update(serializer)
        
        # Rafraîchir et re-sérialiser
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """PATCH utilise la même logique que PUT."""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        commande = self.get_object()
        if commande.statut == 'ANNULEE':
            return Response({'detail': 'La commande est déjà annulée.'}, status=status.HTTP_400_BAD_REQUEST)
        commande.annuler()
        return Response({'detail': 'Commande annulée avec succès.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='deplacer')
    def deplacer(self, request, pk=None):
        """
        Déplace la commande vers une autre table.
        Body: {"table_id": <id>}
        Retourne 400 avec "La table est occupée." si une commande EN_COURS existe déjà sur cette table.
        """
        commande = self.get_object()
        table_id = request.data.get('table_id')
        if table_id is None:
            return Response(
                {'detail': 'table_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            table = Table.objects.get(pk=table_id)
        except Table.DoesNotExist:
            return Response(
                {'detail': 'Table introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        if commande.statut != 'EN_COURS':
            return Response(
                {'detail': 'Seule une commande en cours peut être déplacée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            CommandeService.deplacer_commande_vers_table(commande, table)
        except ValueError as e:
            msg = str(e)
            if 'occupée' in msg:
                return Response({'detail': 'La table est occupée.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'detail': msg}, status=status.HTTP_400_BAD_REQUEST)
        commande.refresh_from_db()
        serializer = self.get_serializer(commande)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='kitchen/orders')
    def kitchen_orders(self, request):
        """
        Endpoint spécifique pour la cuisine : récupère les commandes avec filtres date/service.
        """
        restaurant_id = request.query_params.get('restaurant_id')
        service = request.query_params.get('service')  # 'midi' ou 'soir'
        date = request.query_params.get('date')  # YYYY-MM-DD
        statut_cuisine = request.query_params.get('statut_cuisine')  # PENDING, IN_PROGRESS, READY
        
        queryset = Commande.objects.get_optimized_queryset().filter(statut='EN_COURS')
        
        if restaurant_id:
            try:
                queryset = queryset.filter(restaurant_id=int(restaurant_id))
            except ValueError:
                return Response({'error': 'restaurant_id invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        if statut_cuisine:
            queryset = queryset.filter(statut_cuisine=statut_cuisine)
        
        if date:
            from django.utils.dateparse import parse_date
            parsed_date = parse_date(date)
            if parsed_date:
                queryset = queryset.filter(created_at__date=parsed_date)
        
        if service:
            # Logique pour déterminer midi/soir selon l'heure (ex: < 15h = midi, >= 15h = soir)
            from django.utils import timezone
            if service == 'midi':
                queryset = queryset.filter(created_at__hour__lt=15)
            elif service == 'soir':
                queryset = queryset.filter(created_at__hour__gte=15)
        
        # Trier par priorité puis date
        priority_order = {'URGENT': 0, 'HIGH': 1, 'NORMAL': 2, 'LOW': 3}
        queryset = sorted(queryset, key=lambda x: (priority_order.get(x.priorite, 3), x.created_at))
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='kitchen/update-status')
    def update_kitchen_status(self, request, pk=None):
        """
        Met à jour le statut cuisine et/ou la priorité d'une commande.
        """
        commande = self.get_object()
        statut_cuisine = request.data.get('kitchen_status')
        priorite = request.data.get('priority')
        
        if statut_cuisine:
            if statut_cuisine not in [choice[0] for choice in Commande.STATUT_CUISINE_CHOICES]:
                return Response({'error': 'statut_cuisine invalide'}, status=status.HTTP_400_BAD_REQUEST)
            commande.statut_cuisine = statut_cuisine
        
        if priorite:
            if priorite not in [choice[0] for choice in Commande.PRIORITE_CHOICES]:
                return Response({'error': 'priorite invalide'}, status=status.HTTP_400_BAD_REQUEST)
            commande.priorite = priorite
        
        commande.save(update_fields=['statut_cuisine', 'priorite'])
        serializer = self.get_serializer(commande)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='kitchen/print')
    def print_kitchen_order(self, request, pk=None):
        """
        Endpoint pour imprimer un ticket de cuisine (optionnel).
        """
        commande = self.get_object()
        # Ici on pourrait intégrer une logique d'impression
        # Pour l'instant, on retourne juste les données de la commande
        serializer = self.get_serializer(commande)
        return Response({
            'message': 'Ticket de cuisine généré',
            'commande': serializer.data
        })

class LigneCommandeViewSet(viewsets.ModelViewSet):
    queryset = LigneCommande.objects.select_related(
        'commande',
        'commande__restaurant',
        'commande__created_by',
        'commande__table',
        'article'
    ).prefetch_related(
        'article__ingredients',
        'article__ingredients__ingredient'
    ).all()
    serializer_class = LigneCommandeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['commande_id', 'article_id', 'commande__statut']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Récupérer les paramètres de requête
        commande_id = self.request.query_params.get('commande_id')
        article_id = self.request.query_params.get('article_id')
        id_ligne = self.request.query_params.get('id')
        
        if commande_id:
            try:
                commande_id = int(commande_id)
                queryset = queryset.filter(commande_id=commande_id)
            except ValueError:
                queryset = queryset.none()
        
        if article_id:
            try:
                queryset = queryset.filter(article_id=int(article_id))
            except ValueError:
                queryset = queryset.none()
                
        if id_ligne:
            try:
                queryset = queryset.filter(id=int(id_ligne))
            except ValueError:
                queryset = queryset.none()
        return queryset

    @action(detail=True, methods=['post'], url_path='reclamer')
    def reclamer(self, request, pk=None):
        """
        Réclame une ligne mise en attente de service (ex: dessert).
        Passe en_attente_service à False pour que l'article soit pris en compte pour préparation/service.
        """
        ligne = self.get_object()
        if not ligne.en_attente_service:
            return Response(
                {'detail': 'Cette ligne n\'est pas en attente de service.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        ligne.en_attente_service = False
        ligne.save(update_fields=['en_attente_service'])

        # La ligne est maintenant envoyée en préparation : déduire les stocks à ce moment-là
        if ligne.commande.statut != 'ANNULEE':
            LigneCommandeService.deduire_stocks(ligne)
        serializer = self.get_serializer(ligne)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='deplacer')
    def deplacer(self, request, pk=None):
        """
        Déplace l'article (ligne) vers une autre commande.
        Body: {"commande_id": <id>} ou {"table_id": <id>}.
        Si table_id est fourni et qu'aucune commande EN_COURS n'est sur cette table,
        retourne 400 "La table cible n'a pas de commande."
        """
        ligne = self.get_object()
        commande_id = request.data.get('commande_id')
        table_id = request.data.get('table_id')
        if commande_id is None and table_id is None:
            return Response(
                {'detail': 'commande_id ou table_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if commande_id is not None and table_id is not None:
            return Response(
                {'detail': 'Indiquez soit commande_id soit table_id, pas les deux.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if table_id is not None:
            # Récupérer la table cible
            try:
                table = Table.objects.get(pk=table_id)
            except Table.DoesNotExist:
                return Response(
                    {'detail': 'Table introuvable.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Vérifier que la table appartient au même restaurant que la commande source
            if table.salle.restaurant_id != ligne.commande.restaurant_id:
                return Response(
                    {'detail': "La table cible n'appartient pas au même restaurant que la commande source."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Chercher une commande EN_COURS existante sur cette table
            commande_cible = LigneCommandeService.commande_en_cours_pour_table(table_id)

            # Si aucune commande EN_COURS n'existe, en créer une automatiquement
            if commande_cible is None:
                commande_cible = Commande.objects.create(
                    created_by=ligne.commande.created_by,
                    restaurant=table.salle.restaurant,
                    table=table,
                    statut='EN_COURS',
                    montant=Decimal('0.00'),
                    nb_articles=0,
                )
        else:
            try:
                commande_cible = Commande.objects.get(pk=commande_id)
            except Commande.DoesNotExist:
                return Response(
                    {'detail': 'Commande cible introuvable.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        try:
            LigneCommandeService.deplacer_ligne_vers_commande(ligne, commande_cible)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        ligne.refresh_from_db()
        serializer = self.get_serializer(ligne)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='deplacer-selection')
    def deplacer_selection(self, request):
        """
        Déplace une sélection de lignes de commande vers une autre commande.
        Body:
        {
            "ligne_ids": [1, 2, 3],
            "commande_id": <id>  // OU
            "table_id": <id>
        }

        - Toutes les lignes doivent appartenir à la même commande source et au même restaurant.
        - Si table_id est fourni et qu'aucune commande EN_COURS n'existe sur cette table,
          une nouvelle commande EN_COURS est automatiquement créée sur cette table.
        """
        ligne_ids = request.data.get('ligne_ids') or request.data.get('ids')
        commande_id = request.data.get('commande_id')
        table_id = request.data.get('table_id')

        if not ligne_ids or not isinstance(ligne_ids, list):
            return Response(
                {'detail': 'ligne_ids (liste d\'IDs) est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if commande_id is None and table_id is None:
            return Response(
                {'detail': 'commande_id ou table_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if commande_id is not None and table_id is not None:
            return Response(
                {'detail': 'Indiquez soit commande_id soit table_id, pas les deux.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Charger les lignes concernées
        lignes = list(
            LigneCommande.objects.select_related('commande', 'commande__restaurant')
            .filter(pk__in=ligne_ids)
        )

        if not lignes:
            return Response(
                {'detail': 'Aucune ligne trouvée pour les IDs fournis.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Vérifier que toutes les lignes appartiennent à la même commande source
        commande_source_ids = {ligne.commande_id for ligne in lignes}
        if len(commande_source_ids) != 1:
            return Response(
                {'detail': 'Toutes les lignes doivent appartenir à la même commande source.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        commande_source = lignes[0].commande

        # Déterminer la commande cible
        if table_id is not None:
            try:
                table = Table.objects.get(pk=table_id)
            except Table.DoesNotExist:
                return Response(
                    {'detail': 'Table introuvable.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if table.salle.restaurant_id != commande_source.restaurant_id:
                return Response(
                    {'detail': "La table cible n'appartient pas au même restaurant que la commande source."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            commande_cible = LigneCommandeService.commande_en_cours_pour_table(table_id)
            if commande_cible is None:
                commande_cible = Commande.objects.create(
                    created_by=commande_source.created_by,
                    restaurant=table.salle.restaurant,
                    table=table,
                    statut='EN_COURS',
                    montant=Decimal('0.00'),
                    nb_articles=0,
                )
        else:
            try:
                commande_cible = Commande.objects.get(pk=commande_id)
            except Commande.DoesNotExist:
                return Response(
                    {'detail': 'Commande cible introuvable.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Vérifications métier sur la commande cible
        if commande_cible.statut != 'EN_COURS':
            return Response(
                {'detail': 'La commande cible doit être en cours.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if commande_cible.restaurant_id != commande_source.restaurant_id:
            return Response(
                {'detail': 'La commande cible doit appartenir au même restaurant que la commande source.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Déplacement transactionnel de toutes les lignes
        try:
            with transaction.atomic():
                for ligne in lignes:
                    LigneCommandeService.deplacer_ligne_vers_commande(ligne, commande_cible)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Recharger les lignes mises à jour
        lignes_updated = LigneCommande.objects.filter(pk__in=[l.id for l in lignes])
        serializer = self.get_serializer(lignes_updated, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
