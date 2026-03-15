from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from apps.notes.models import Note
from apps.notes.serializers import NoteSerializer
from rest_framework.permissions import IsAuthenticated

# Create your views here.

class NoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les notes.
    Auteur : [Votre Nom]
    Créé : 27/04/2025
    Version : 1.0
    """
    queryset = Note.objects.select_related('created_by', 'restaurant').all()
    serializer_class = NoteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant_id', 'created_by_id']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Permet de filtrer les notes par ID via les paramètres de requête.
        """
        queryset = super().get_queryset()
        id_note = self.request.query_params.get('id')
        if id_note:
            try:
                queryset = queryset.filter(id=int(id_note))
            except ValueError:
                queryset = queryset.none()
        return queryset
