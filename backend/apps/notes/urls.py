"""
Configuration des URLs pour l'application notes.
"""

from rest_framework.routers import SimpleRouter
from .views import NoteViewSet

router = SimpleRouter()
router.register(r'notes', NoteViewSet, basename='note')

urlpatterns = router.urls

