"""
Configuration des URLs pour l'application menu.
"""

from rest_framework.routers import SimpleRouter
from .views import ArticleViewSet, ArticleIngredientViewSet, CategorieArticleViewSet

router = SimpleRouter()
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'article-ingredients', ArticleIngredientViewSet, basename='article-ingredient')
router.register(r'categories', CategorieArticleViewSet, basename='categorie')

urlpatterns = router.urls

