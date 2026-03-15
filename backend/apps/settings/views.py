from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from .models import NotificationSettings, BillingSettings
from .serializers import NotificationSettingsSerializer, BillingSettingsSerializer
from apps.restaurant.models import Restaurant
from apps.restaurant.serializers import RestaurantSerializer
from apps.authentication.models import HollyUser
from apps.authentication.serializers import UserProfileSerializer, UserRegistrationSerializer


@extend_schema_view(
    get=extend_schema(
        parameters=[OpenApiParameter(name='restaurant_id', type=int, required=True)],
        responses={200: RestaurantSerializer, 400: None, 404: None},
    ),
    patch=extend_schema(
        parameters=[OpenApiParameter(name='restaurant_id', type=int, required=True)],
        request=RestaurantSerializer,
        responses={200: RestaurantSerializer, 400: None, 404: None},
    ),
)
class RestaurantSettingsView(APIView):
    """
    GET /api/settings/restaurant?restaurant_id=X
    PATCH /api/settings/restaurant?restaurant_id=X
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant_id = request.query_params.get('restaurant_id')
        if not restaurant_id:
            return Response({'error': 'restaurant_id requis'}, status=400)
        
        try:
            restaurant = Restaurant.objects.get(id_restaurant=restaurant_id)
            serializer = RestaurantSerializer(restaurant)
            return Response(serializer.data)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant introuvable'}, status=404)

    def patch(self, request):
        restaurant_id = request.query_params.get('restaurant_id')
        if not restaurant_id:
            return Response({'error': 'restaurant_id requis'}, status=400)
        
        try:
            restaurant = Restaurant.objects.get(id_restaurant=restaurant_id)
            serializer = RestaurantSerializer(restaurant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant introuvable'}, status=404)


class NotificationSettingsViewSet(viewsets.ModelViewSet):
    queryset = NotificationSettings.objects.select_related('restaurant').all()
    serializer_class = NotificationSettingsSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['restaurant_id']


class BillingSettingsViewSet(viewsets.ModelViewSet):
    queryset = BillingSettings.objects.select_related('restaurant').all()
    serializer_class = BillingSettingsSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['restaurant_id']


@extend_schema_view(
    get=extend_schema(
        operation_id='settings_users_list',
        parameters=[OpenApiParameter(name='restaurant_id', type=int, required=False)],
        responses={200: UserProfileSerializer},
    ),
    post=extend_schema(
        operation_id='settings_users_create',
        request=UserRegistrationSerializer,
        responses={201: UserProfileSerializer, 400: None},
    ),
)
class UsersSettingsView(APIView):
    """
    GET /api/settings/users?restaurant_id=X — liste des utilisateurs
    POST /api/settings/users — création utilisateur
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        restaurant_id = request.query_params.get('restaurant_id')
        users = HollyUser.objects.all()
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserProfileSerializer(user).data, status=201)
        return Response(serializer.errors, status=400)


@extend_schema_view(
    get=extend_schema(
        operation_id='settings_user_retrieve',
        responses={200: UserProfileSerializer, 404: None},
    ),
    patch=extend_schema(
        operation_id='settings_user_partial_update',
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer, 400: None, 404: None},
    ),
)
class UserSettingsDetailView(APIView):
    """
    GET /api/settings/users/{user_id}/ — détail d'un utilisateur
    PATCH /api/settings/users/{user_id}/ — mise à jour partielle
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = HollyUser.objects.get(id=user_id)
            return Response(UserProfileSerializer(user).data)
        except HollyUser.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=404)

    def patch(self, request, user_id):
        try:
            user = HollyUser.objects.get(id=user_id)
            serializer = UserProfileSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except HollyUser.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=404)

