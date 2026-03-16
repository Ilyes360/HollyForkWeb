from rest_framework.routers import SimpleRouter
from .views import ShiftViewSet

router = SimpleRouter()
router.register(r'shifts', ShiftViewSet, basename='shift')

urlpatterns = router.urls

