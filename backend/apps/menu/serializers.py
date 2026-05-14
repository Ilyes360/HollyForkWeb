from rest_framework import serializers

from apps.inventory.serializers import IngredientSerializer
from apps.restaurant.models import Restaurant
from apps.menu.models import Article, ArticleIngredient, Ingredient, CategorieArticle

class CategorieArticleSerializer(serializers.HyperlinkedModelSerializer):
    name = serializers.CharField(source='nom', max_length=50)
    display_order = serializers.IntegerField(source='ordre_affichage', required=False, default=0)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = CategorieArticle
        fields = ['id', 'name', 'display_order', 'description']
        extra_kwargs = {
            'id': {'read_only': True},
            'name': {
                'error_messages': {
                    'required': 'Le nom de la catégorie est obligatoire.',
                    'blank': 'Le nom de la catégorie ne peut pas être vide.',
                    'max_length': 'Le nom de la catégorie ne peut pas dépasser 50 caractères.',
                    'unique': 'Une catégorie avec ce nom existe déjà.'
                }
            },
            'display_order': {
                'required': False,
                'error_messages': {
                    'invalid': "L'ordre d'affichage doit être un nombre entier positif.",
                    'min_value': "L'ordre d'affichage doit être supérieur ou égal à 0."
                }
            },
            'description': {
                'error_messages': {
                    'max_length': 'La description ne peut pas dépasser 1000 caractères.'
                }
            }
        }

    def validate_name(self, value):
        """
        Validation personnalisée pour le nom de la catégorie.
        """
        if not value.strip():
            raise serializers.ValidationError("Le nom de la catégorie ne peut pas contenir uniquement des espaces.")
        
        # Vérifier si le nom commence par une majuscule
        if not value[0].isupper():
            raise serializers.ValidationError("Le nom de la catégorie doit commencer par une majuscule.")
        
        # Vérifier si le nom contient des caractères spéciaux non autorisés
        if any(char in value for char in '!@#$%^&*()_+{}[]|\\:;"\'<>?,./'):
            raise serializers.ValidationError("Le nom de la catégorie ne peut pas contenir de caractères spéciaux.")
        
        return value.strip()

    def validate_display_order(self, value):
        """
        Validation personnalisée pour l'ordre d'affichage.
        """
        if value is not None and value < 0:
            raise serializers.ValidationError("L'ordre d'affichage ne peut pas être négatif.")
        
        # Si une valeur est fournie, vérifier qu'elle n'est pas déjà utilisée pour ce restaurant
        if value is not None:
            # Vérifier que l'ordre d'affichage n'est pas déjà utilisé par une autre catégorie
            qs = CategorieArticle.objects.filter(ordre_affichage=value)
            if self.instance is not None:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError(
                    f"L'ordre d'affichage {value} est déjà utilisé par une autre catégorie."
                )
        return value

    def validate_description(self, value):
        """
        Validation personnalisée pour la description.
        """
        if value is not None:
            if len(value.strip()) == 0:
                raise serializers.ValidationError("La description ne peut pas contenir uniquement des espaces.")
            
            if len(value) > 1000:
                raise serializers.ValidationError("La description ne peut pas dépasser 1000 caractères.")
        
        return value
    
    def validate(self, data):
        name = data.get('nom', '')
        if self.instance is None:
            categories_existantes = CategorieArticle.objects.filter(
                nom__icontains=name
            ).exclude(nom=name)
        else:
            categories_existantes = CategorieArticle.objects.filter(
                nom__icontains=name
            ).exclude(id=self.instance.id).exclude(nom=name)

        if categories_existantes.exists():
            categories_similaires = [cat.nom for cat in categories_existantes[:3]]
            raise serializers.ValidationError({
                'name': f"Attention : Des catégories similaires existent déjà : {', '.join(categories_similaires)}"
            })
        return data

    def create(self, validated_data):
        return CategorieArticle.objects.create(
            nom=validated_data['nom'],
            ordre_affichage=validated_data.get('ordre_affichage', 0),
            description=validated_data.get('description'),
        )

    def update(self, instance, validated_data):
        instance.nom = validated_data.get('nom', instance.nom)
        instance.ordre_affichage = validated_data.get('ordre_affichage', instance.ordre_affichage)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance

class ArticleSerializer(serializers.HyperlinkedModelSerializer):
    name = serializers.CharField(source='nom', max_length=100)
    price = serializers.DecimalField(source='prix', max_digits=10, decimal_places=2)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    available = serializers.BooleanField(source='disponible', read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.all(),
        source='restaurant',
        write_only=True
    )
    categorie = CategorieArticleSerializer(read_only=True)
    categorie_id = serializers.PrimaryKeyRelatedField(
        queryset=CategorieArticle.objects.all(),
        source='categorie',
        write_only=True
    )

    class Meta:
        model = Article
        fields = ['id', 'name', 'restaurant_id', 'categorie', 'categorie_id', 'price', 'description', 'available']
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def create(self, validated_data):
        return Article.objects.create(
            nom=validated_data['nom'],
            prix=validated_data['prix'],
            description=validated_data.get('description'),
            restaurant=validated_data['restaurant'],
            categorie=validated_data.get('categorie'),
        )

    def update(self, instance, validated_data):
        instance.nom = validated_data.get('nom', instance.nom)
        instance.prix = validated_data.get('prix', instance.prix)
        instance.description = validated_data.get('description', instance.description)
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        if 'categorie' in validated_data:
            instance.categorie = validated_data['categorie']
        instance.save()
        return instance

class ArticleIngredientSerializer(serializers.HyperlinkedModelSerializer):
    required_quantity = serializers.DecimalField(source='quantite_necessaire', max_digits=10, decimal_places=4)
    article = ArticleSerializer(read_only=True)
    ingredient = IngredientSerializer(read_only=True)
    article_id = serializers.PrimaryKeyRelatedField(queryset=Article.objects.all(), source='article')
    ingredient_id = serializers.PrimaryKeyRelatedField(queryset=Ingredient.objects.all(), source='ingredient')

    def validate_required_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité nécessaire doit être supérieure à zéro.")
        return value

    class Meta:
        model = ArticleIngredient
        fields = ['id', 'article', 'ingredient', 'required_quantity', 'article_id', 'ingredient_id']
        extra_kwargs = {
            'id': {'read_only': True}
        }

    def create(self, validated_data):
        return ArticleIngredient.objects.create(
            article=validated_data['article'],
            ingredient=validated_data['ingredient'],
            quantite_necessaire=validated_data['quantite_necessaire'],
        )

    def update(self, instance, validated_data):
        instance.quantite_necessaire = validated_data.get('quantite_necessaire', instance.quantite_necessaire)
        if 'article' in validated_data:
            instance.article = validated_data['article']
        if 'ingredient' in validated_data:
            instance.ingredient = validated_data['ingredient']
        instance.save()
        return instance

class ArticleDetailSerializer(serializers.HyperlinkedModelSerializer):
    name = serializers.CharField(source='nom', max_length=100)
    price = serializers.DecimalField(source='prix', max_digits=10, decimal_places=2)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    available = serializers.BooleanField(source='disponible', read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.all(),
        source='restaurant',
        write_only=True,
        required=False
    )
    ingredients = ArticleIngredientSerializer(many=True, read_only=True)
    ingredients_update = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    categorie = CategorieArticleSerializer(read_only=True)
    categorie_id = serializers.PrimaryKeyRelatedField(
        queryset=CategorieArticle.objects.all(),
        source='categorie',
        write_only=True,
        required=False
    )

    class Meta:
        model = Article
        fields = ['id', 'name', 'restaurant_id', 'categorie', 'categorie_id', 'price', 'description', 'available', 'ingredients', 'ingredients_update']
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('ingredients_update', None)
        instance.nom = validated_data.get('nom', instance.nom)
        instance.prix = validated_data.get('prix', instance.prix)
        instance.description = validated_data.get('description', instance.description)
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        if 'categorie' in validated_data:
            instance.categorie = validated_data['categorie']
        instance.save()

        if ingredients_data is not None:
            instance.ingredients.all().delete()
            for ingredient_data in ingredients_data:
                ArticleIngredient.objects.create(
                    article=instance,
                    ingredient_id=ingredient_data.get('ingredient_id'),
                    quantite_necessaire=ingredient_data.get('required_quantity')
                )
        return instance

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients_update', [])
        article = Article.objects.create(
            nom=validated_data['nom'],
            prix=validated_data['prix'],
            description=validated_data.get('description'),
            restaurant=validated_data['restaurant'],
            categorie=validated_data.get('categorie'),
        )
        for ingredient_data in ingredients_data:
            ArticleIngredient.objects.create(
                article=article,
                ingredient_id=ingredient_data.get('ingredient_id'),
                quantite_necessaire=ingredient_data.get('required_quantity')
            )
        return article
