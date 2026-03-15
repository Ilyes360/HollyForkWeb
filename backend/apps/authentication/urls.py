from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserRegistrationView,
    LogoutView,
    GetCSRFTokenView,
    UserProfileView,
    DeviceLoginView,
    QuickLoginView,
    EmailPasswordLoginView,
    GetRestaurantEmployeesView,
    HealthCheckView,
    VerifyMFAView,
    MFASetupView,
    MFAConfirmView,
    MFADisableView,
    MFAStatusView,
    DeleteAccountView,
)

app_name = 'authentication'

urlpatterns = [
    # Endpoint de monitoring / health check
    path('health/', HealthCheckView.as_view(), name='health'),

    # Authentification équipement restaurant (2 étapes)
    path('device-login/', DeviceLoginView.as_view(), name='device_login'),
    path('restaurant-employees/', GetRestaurantEmployeesView.as_view(), name='restaurant_employees'),
    path('quick-login/', QuickLoginView.as_view(), name='quick_login'),
    path('login/', EmailPasswordLoginView.as_view(), name='login'),
    path('verify-mfa/', VerifyMFAView.as_view(), name='verify_mfa'),

    # MFA (TOTP) — authentification à deux facteurs
    path('mfa/setup/', MFASetupView.as_view(), name='mfa_setup'),
    path('mfa/confirm/', MFAConfirmView.as_view(), name='mfa_confirm'),
    path('mfa/disable/', MFADisableView.as_view(), name='mfa_disable'),
    path('mfa/status/', MFAStatusView.as_view(), name='mfa_status'),

    # Gestion utilisateur
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Utilitaires
    path('csrf-token/', GetCSRFTokenView.as_view(), name='csrf_token'),
    
    # Profil utilisateur
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete_account'),
]