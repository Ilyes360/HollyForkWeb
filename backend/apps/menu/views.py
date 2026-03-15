from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from apps.menu.models import Article, ArticleIngredient, CategorieArticle
from apps.menu.serializers import ArticleDetailSerializer, ArticleIngredientSerializer, CategorieArticleSerializer
from rest_framework.permissions import IsAuthenticated

class CategorieArticleViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les catégories d'articles.
    """
    queryset = CategorieArticle.objects.all()
    serializer_class = CategorieArticleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['nom']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        id_categorie = self.request.query_params.get('id')
        restaurant_id = self.request.query_params.get('restaurant_id')
        
        if id_categorie:
            try:
                queryset = queryset.filter(id=int(id_categorie))
            except ValueError:
                queryset = queryset.none()
                
        if restaurant_id:
            try:
                # Catégories effectivement utilisées par les articles d'un restaurant donné
                queryset = CategorieArticle.objects.filter(
                    article__restaurant_id=int(restaurant_id)
                ).distinct()
            except ValueError:
                queryset = queryset.none()
                
        return queryset.order_by('ordre_affichage', 'nom')

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.prefetch_related(
        'ingredients',
        'ingredients__ingredient'
    ).all()
    serializer_class = ArticleDetailSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['disponible']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_article = self.request.query_params.get('id')
        restaurant_id = self.request.query_params.get('restaurant_id')
        
        if id_article:
            try:
                queryset = queryset.filter(id=int(id_article))
            except ValueError:
                queryset = queryset.none()
                
        if restaurant_id:
            try:
                # Articles directement rattachés au restaurant
                queryset = queryset.filter(restaurant_id=int(restaurant_id))
            except ValueError:
                queryset = queryset.none()
                
        return queryset

class ArticleIngredientViewSet(viewsets.ModelViewSet):
    queryset = ArticleIngredient.objects.select_related('article', 'ingredient').all()
    serializer_class = ArticleIngredientSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['article_id', 'ingredient_id']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_article_ingredient = self.request.query_params.get('id')
        if id_article_ingredient:
            try:
                queryset = queryset.filter(id=int(id_article_ingredient))
            except ValueError:
                queryset = queryset.none()
        return queryset
