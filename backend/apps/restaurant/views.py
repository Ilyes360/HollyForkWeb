"""
Views pour la gestion des restaurants dans Holly Pi.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from apps.restaurant.models import Restaurant
from apps.restaurant.serializers import RestaurantSerializer
from apps.staff.models import Employe, TypeEmploye, RestaurantEmploye

User = get_user_model()


class RestaurantViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des restaurants.
    
    Endpoints:
    - GET /api/restaurants/ - Liste des restaurants
    - POST /api/restaurants/ - Créer un restaurant
    - GET /api/restaurants/{id_restaurant}/ - Détail d'un restaurant
    - PUT/PATCH /api/restaurants/{id_restaurant}/ - Modifier un restaurant
    - DELETE /api/restaurants/{id_restaurant}/ - Supprimer un restaurant
    - GET /api/restaurants/logo/{id}/ - Récupérer le logo
    """
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id_restaurant'
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_restaurant = self.request.query_params.get('id_restaurant')
        user_id = self.request.query_params.get('user_id')
        
        if id_restaurant:
            try:
                queryset = queryset.filter(id_restaurant=int(id_restaurant))
            except ValueError:
                queryset = queryset.none()
                
        if user_id:
            try:
                user = User.objects.get(id=int(user_id))
                try:
                    employe = Employe.objects.get(user=user)
                    restaurant_ids = RestaurantEmploye.objects.filter(
                        employe=employe
                    ).values_list('restaurant', flat=True)
                    queryset = queryset.filter(id_restaurant__in=restaurant_ids)
                except Employe.DoesNotExist:
                    queryset = queryset.none()
            except (User.DoesNotExist, ValueError):
                queryset = queryset.none()
                
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Crée un nouveau restaurant et ajoute automatiquement 
        l'utilisateur qui le crée comme manager.
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Vous devez être authentifié pour créer un restaurant."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            employe = Employe.objects.get(user=request.user)
        except Employe.DoesNotExist:
            try:
                type_manager, _ = TypeEmploye.objects.get_or_create(
                    nom_type="Manager",
                    defaults={"description": "Gestionnaire du restaurant"}
                )
                
                employe = Employe.objects.create(
                    user=request.user,
                    nom=request.user.last_name or request.user.username,
                    prenom=request.user.first_name or "",
                    type_employe=type_manager
                )
            except Exception as e:
                return Response(
                    {"detail": f"Erreur lors de la création de l'employé : {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        restaurant = serializer.save()

        try:
            RestaurantEmploye.objects.create(
                restaurant=restaurant,
                employe=employe
            )
        except Exception as e:
            restaurant.delete()
            return Response(
                {"detail": f"Erreur lors de l'association employé-restaurant : {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'], url_path='logo/(?P<id_restaurant>[0-9]+)')
    def get_logo(self, request, id_restaurant=None):
        """
        Récupère uniquement l'URL du logo d'un restaurant.
        
        Usage: GET /api/restaurants/logo/{id_restaurant}/
        """
        restaurant = get_object_or_404(Restaurant, id_restaurant=id_restaurant)
        
        return Response({
            "restaurant_id": restaurant.id_restaurant,
            "name": restaurant.nom_restaurant,
            "logo_url": restaurant.logo_url
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='verify/(?P<id_restaurant>[0-9]+)', permission_classes=[AllowAny])
    def verify_restaurant(self, request, id_restaurant=None):
        """
        Endpoint public pour vérifier l'existence d'un restaurant.
        Utilisé avant l'authentification pour vérifier que le restaurant existe.
        
        Usage: GET /api/restaurants/verify/{id_restaurant}/
        """
        try:
            restaurant = Restaurant.objects.get(id_restaurant=id_restaurant)
            return Response({
                "exists": True,
                "restaurant_id": restaurant.id_restaurant,
                "name": restaurant.nom_restaurant,
                "has_pin": bool(restaurant.pin_restaurant)
            }, status=status.HTTP_200_OK)
        except Restaurant.DoesNotExist:
            return Response({
                "exists": False,
                "message": "Restaurant introuvable"
            }, status=status.HTTP_404_NOT_FOUND)
