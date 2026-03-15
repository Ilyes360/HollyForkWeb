from rest_framework import serializers
from apps.staff.models import RestaurantEmploye
from apps.commandes.models import Commande, LigneCommande
from apps.commandes.services import LigneCommandeService
from apps.menu.models import Article
from apps.restaurant.models import Restaurant
from apps.staff.models import Employe
from apps.salles.models import Table
from apps.salles.serializers import TableSerializer
from apps.staff.serializers import EmployeSerializer
from apps.restaurant.serializers import RestaurantSerializer
from apps.menu.serializers import ArticleDetailSerializer

class LigneCommandeSerializer(serializers.HyperlinkedModelSerializer):
    quantity = serializers.IntegerField(source='quantite')
    unit_price = serializers.DecimalField(source='prix_unitaire', max_digits=10, decimal_places=2, read_only=True)
    cost_of_goods_sold = serializers.DecimalField(source='cout_marchandise_vendue', max_digits=10, decimal_places=2, read_only=True)
    awaiting_service = serializers.BooleanField(source='en_attente_service', required=False)
    commande = serializers.HyperlinkedRelatedField(view_name='commande-detail', read_only=True)
    commande_id = serializers.PrimaryKeyRelatedField(queryset=Commande.objects.all(), source='commande', write_only=True)
    article = ArticleDetailSerializer(read_only=True)
    article_id = serializers.PrimaryKeyRelatedField(queryset=Article.objects.all(), source='article')

    class Meta:
        model = LigneCommande
        fields = [
            'id',
            'commande',
            'commande_id',
            'article',
            'quantity',
            'unit_price',
            'article_id',
            'cost_of_goods_sold',
            'awaiting_service',
        ]
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def create(self, validated_data):
        ligne = LigneCommande.objects.create(
            commande=validated_data['commande'],
            article=validated_data['article'],
            quantite=validated_data.get('quantity', validated_data.get('quantite', 1)),
            en_attente_service=validated_data.get('awaiting_service', validated_data.get('en_attente_service', False)),
        )

        # Si la ligne n'est pas en attente de service, déduire immédiatement les stocks
        if not ligne.en_attente_service and ligne.commande.statut != 'ANNULEE':
            LigneCommandeService.deduire_stocks(ligne)

        return ligne

    def update(self, instance, validated_data):
        # Conserver l'ancien état pour savoir si la ligne vient d'être "envoyée"
        ancien_en_attente = instance.en_attente_service

        instance.quantite = validated_data.get('quantity', validated_data.get('quantite', instance.quantite))
        if 'article' in validated_data:
            instance.article = validated_data['article']
        if 'awaiting_service' in validated_data or 'en_attente_service' in validated_data:
            instance.en_attente_service = validated_data.get(
                'awaiting_service',
                validated_data.get('en_attente_service', instance.en_attente_service)
            )
        instance.save()

        # Si la ligne passe de "en attente" à "envoyée", déduire les stocks à ce moment-là
        if ancien_en_attente and not instance.en_attente_service and instance.commande.statut != 'ANNULEE':
            LigneCommandeService.deduire_stocks(instance)

        return instance


class CommandeSerializer(serializers.HyperlinkedModelSerializer):
    items_count = serializers.IntegerField(source='nb_articles', read_only=True)
    amount = serializers.DecimalField(source='montant', max_digits=10, decimal_places=2, read_only=True)
    status = serializers.CharField(source='statut')
    kitchen_status = serializers.CharField(source='statut_cuisine', required=False)
    priority = serializers.CharField(source='priorite', required=False)
    total_cost_of_goods_sold = serializers.DecimalField(
        source='cout_total_marchandises_vendues', max_digits=10, decimal_places=2, read_only=True
    )
    is_in_progress = serializers.SerializerMethodField()
    created_by = EmployeSerializer(read_only=True)
    restaurant = RestaurantSerializer(read_only=True)
    table = TableSerializer(read_only=True)
    table_id = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all(), source='table', allow_null=True)
    created_by_id = serializers.PrimaryKeyRelatedField(queryset=Employe.objects.all(), source='created_by')
    restaurant_id = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), source='restaurant')
    lignes = LigneCommandeSerializer(many=True, read_only=True)

    class Meta:
        model = Commande
        fields = [
            'id', 'items_count', 'amount', 'created_at', 'created_by', 'restaurant', 'status',
            'kitchen_status', 'priority', 'created_by_id', 'restaurant_id', 'lignes', 'table', 'table_id',
            'total_cost_of_goods_sold', 'is_in_progress',
        ]
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def validate(self, data):
        """
        Vérifie que les données de la commande sont valides, y compris l'association restaurant-employé.
        """
        restaurant = data.get('restaurant')
        created_by = data.get('created_by')
        table: Table = data.get('table')
        statut = data.get('statut')

        valid_statuts = [choice[0] for choice in Commande.STATUT_CHOICES]
        if statut not in valid_statuts:
            raise serializers.ValidationError(f"Le statut doit être l'un des suivants : {valid_statuts}")

        # Valider l'association restaurant-employé
        if restaurant and created_by:
            if not RestaurantEmploye.objects.filter(restaurant=restaurant, employe=created_by).exists():
                raise serializers.ValidationError(
                    f"L'employé {created_by.nom} {created_by.prenom} n'est pas associé à ce restaurant."
                )

        # Valider la table
        if table and table.salle.restaurant != restaurant:
            raise serializers.ValidationError(
                f"La table {table.id} n'appartient pas au restaurant {restaurant.nom_restaurant}."
            )

        return data

    def create(self, validated_data):
        return Commande.objects.create(
            created_by=validated_data['created_by'],
            restaurant=validated_data['restaurant'],
            table=validated_data.get('table'),
            statut=validated_data.get('statut', 'EN_COURS'),
            statut_cuisine=validated_data.get('statut_cuisine', 'PENDING'),
            priorite=validated_data.get('priorite', 'NORMAL'),
        )

    def update(self, instance, validated_data):
        if 'statut' in validated_data:
            instance.statut = validated_data['statut']
        if 'statut_cuisine' in validated_data:
            instance.statut_cuisine = validated_data['statut_cuisine']
        if 'priorite' in validated_data:
            instance.priorite = validated_data['priorite']
        if 'created_by' in validated_data:
            instance.created_by = validated_data['created_by']
        if 'restaurant' in validated_data:
            instance.restaurant = validated_data['restaurant']
        if 'table' in validated_data:
            instance.table = validated_data['table']
        instance.save()
        return instance

    def get_is_in_progress(self, obj) -> bool:
        return obj.statut == 'EN_COURS'