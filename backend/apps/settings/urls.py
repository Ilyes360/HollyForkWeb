from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    RestaurantSettingsView,
    NotificationSettingsViewSet,
    BillingSettingsViewSet,
    UsersSettingsView,
    UserSettingsDetailView,
)

router = SimpleRouter()
router.register(r'notifications', NotificationSettingsViewSet, basename='notification-settings')
router.register(r'billing', BillingSettingsViewSet, basename='billing-settings')

urlpatterns = [
    path('restaurant/', RestaurantSettingsView.as_view(), name='restaurant-settings'),
    path('users/', UsersSettingsView.as_view(), name='users-settings'),
    path('users/<int:user_id>/', UserSettingsDetailView.as_view(), name='user-settings-detail'),
    path('', include(router.urls)),
]

