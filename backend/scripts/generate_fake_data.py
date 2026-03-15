import os
import sys

# ─────────────────────────────────────────────────────────────────────────────
# Configuration du projet Django
# ─────────────────────────────────────────────────────────────────────────────
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
os.chdir(project_root)

print(f"Répertoire du projet: {project_root}")
print(f"Répertoire de travail: {os.getcwd()}")

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

# Force UTF-8 pour les print sur Windows (evite UnicodeEncodeError avec caractères accentués)
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ─────────────────────────────────────────────────────────────────────────────
# Imports
# ─────────────────────────────────────────────────────────────────────────────
import random
from typing import List, Dict, Set, Tuple, Optional
from decimal import Decimal
from datetime import date, time, timedelta
from django.db import transaction, connection
from django.conf import settings
from django.apps import apps
from django.contrib.auth import get_user_model
from django.utils import timezone
from mimesis import Person, Address, Finance, Datetime, Food, Text, Generic
from mimesis.locales import Locale

# Modèles
from apps.restaurant.models import Restaurant
from apps.staff.models import Employe, RestaurantEmploye, TypeEmploye
from apps.inventory.models import Ingredient, Stock, Reapprovisionnement
from apps.menu.models import Article, ArticleIngredient, CategorieArticle
from apps.commandes.models import Commande, LigneCommande, CommandeHistoric, LigneCommandeHistoric
from apps.salles.models import Table, Salle
from apps.reservations.models import Reservation
from apps.notes.models import Note
from apps.shared.models import TauxTVA
from apps.billing.models import Facture, LigneFacture, Paiement, MethodePaiement
from apps.planning.models import Shift
from apps.suppliers.models import Fournisseur, JourLivraison, CommandeFournisseur
from apps.settings.models import NotificationSettings, BillingSettings
from apps.reports.models import Report

User = get_user_model()

# ─────────────────────────────────────────────────────────────────────────────
# Générateurs Mimesis
# ─────────────────────────────────────────────────────────────────────────────
person_gen = Person(locale=Locale.FR)
address_gen = Address(locale=Locale.FR)
finance_gen = Finance(locale=Locale.FR)
datetime_gen = Datetime(locale=Locale.FR)
food_gen = Food(locale=Locale.FR)
text_gen = Text(locale=Locale.FR)

# ─────────────────────────────────────────────────────────────────────────────
# Constantes
# ─────────────────────────────────────────────────────────────────────────────
NB_RESTAURANTS = 14
NB_EMPLOYES = 100
NB_COMMANDES_AUTRES = 480
NB_COMMANDES_LES_OMBRES = 20
NB_RESERVATIONS_LES_OMBRES = 10
NB_RESERVATIONS_AUTRES = 40
NB_NOTES = 50
NB_REAPPROVISIONNEMENTS = 30
NB_FOURNISSEURS_COMMANDES_OMBRES = 5
NB_FOURNISSEURS_COMMANDES_AUTRES = 45
NB_REPORTS_AUTRES = 15

LOGO_URLS = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400',
    'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=400',
    'https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=400',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
    'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=400',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
    'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=400',
    'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400',
    'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=400',
]

INGREDIENT_NAMES = [
    'Tomate', 'Fromage', 'Pâte', 'Oignon', 'Poivron', 'Champignon', 'Olive', 'Jambon',
    'Poulet', 'Basilic', 'Huile d\'olive', 'Mozzarella', 'Parmesan', 'Laitue', 'Carotte',
    'Pomme de terre', 'Riz', 'Boeuf', 'Porc', 'Crevette', 'Saumon', 'Thon', 'Ail',
    'Piment', 'Sel', 'Poivre', 'Sucre', 'Farine', 'Oeuf', 'Crème', 'Beurre', 'Citron',
    'Vinaigre', 'Moutarde', 'Persil', 'Aneth', 'Coriandre', 'Avocat', 'Concombre', 'Épinard',
]

UNITS = ['kg', 'l', 'g', 'ml', 'unité']

CATEGORIES_DATA = [
    {'nom': 'Entrées', 'ordre_affichage': 1, 'description': 'Entrées et apéritifs'},
    {'nom': 'Plats', 'ordre_affichage': 2, 'description': 'Plats principaux'},
    {'nom': 'Desserts', 'ordre_affichage': 3, 'description': 'Desserts et pâtisseries'},
    {'nom': 'Boissons', 'ordre_affichage': 4, 'description': 'Boissons et rafraîchissements'},
    {'nom': 'Vins', 'ordre_affichage': 5, 'description': 'Carte des vins'},
    {'nom': 'Cafés', 'ordre_affichage': 6, 'description': 'Cafés et thés'},
    {'nom': 'Menus', 'ordre_affichage': 7, 'description': 'Menus spéciaux'},
]

NOMS_SALLES = ['Principale', 'Terrasse', 'Étage', 'VIP', 'Salon privé', 'Véranda']

TYPES_EMPLOYES = [
    {'nom_type': 'Super Admin Groupe', 'description': 'Vue sur tous les établissements, paramétrage global, licences, stats globales.'},
    {'nom_type': 'Admin Établissement', 'description': "Gère l'établissement, toute la config locale."},
    {'nom_type': 'Directeur', 'description': "Gère l'établissement, toute la config locale."},
    {'nom_type': 'Manager Salle', 'description': 'Gère le service, les réservations, la répartition des tables.'},
    {'nom_type': 'Manager Cuisine', 'description': 'Gère la carte, les fiches techniques, les besoins matières.'},
    {'nom_type': 'Chef de rang', 'description': 'Service en salle avancé.'},
    {'nom_type': 'Runner', 'description': 'Support de service.'},
    {'nom_type': 'Serveur', 'description': 'Prise de commande, encaissement, suivi des tables.'},
    {'nom_type': 'Barman', 'description': 'Gère les commandes bar, stocks boissons.'},
    {'nom_type': 'Personne de Caisse', 'description': 'Encaissements, clôture de caisse.'},
    {'nom_type': 'Responsable Stock', 'description': 'Commandes fournisseurs, validation des livraisons.'},
    {'nom_type': 'Responsable Achats', 'description': 'Commandes fournisseurs, validation des livraisons.'},
    {'nom_type': 'Comptable', 'description': 'Accès aux exports comptables.'},
    {'nom_type': 'Expert comptable', 'description': 'Accès aux exports comptables.'},
    {'nom_type': 'Livreur', 'description': 'Accès aux commandes livraison.'},
    {'nom_type': 'Stagiaire', 'description': 'Rôle limité.'},
    {'nom_type': 'Extra', 'description': 'Rôle limité.'},
    {'nom_type': 'Fournisseur', 'description': 'Accès à son catalogue.'},
    {'nom_type': 'Consultant', 'description': 'Accès lecture stats.'},
    {'nom_type': 'Auditeur', 'description': 'Accès lecture stats.'},
]

ALLERGENES_LIST = [
    'Gluten', 'Crustacés', 'Oeufs', 'Poisson', 'Arachides', 'Soja',
    'Lait', 'Fruits à coque', 'Céleri', 'Moutarde', 'Sésame', 'Sulfites',
    'Lupin', 'Mollusques',
]


POSTES_PAR_TYPE = {
    'Super Admin Groupe': 'Administrateur Groupe',
    'Admin Établissement': 'Administrateur',
    'Directeur': 'Directeur de restaurant',
    'Manager Salle': 'Responsable de salle',
    'Manager Cuisine': 'Chef de cuisine',
    'Chef de rang': 'Chef de rang',
    'Runner': 'Runner',
    'Serveur': 'Serveur',
    'Barman': 'Barman',
    'Personne de Caisse': 'Caissier',
    'Responsable Stock': 'Gestionnaire de stock',
    'Responsable Achats': 'Responsable achats',
    'Comptable': 'Comptable',
    'Expert comptable': 'Expert comptable',
    'Livreur': 'Livreur',
    'Stagiaire': 'Stagiaire',
    'Extra': 'Extra',
    'Fournisseur': 'Référent fournisseur',
    'Consultant': 'Consultant',
    'Auditeur': 'Auditeur',
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def unique_random_digits(length: int, existing: Set[str]) -> str:
    """Génère une chaîne de chiffres aléatoires unique."""
    while True:
        value = ''.join([str(random.randint(0, 9)) for _ in range(length)])
        if value not in existing:
            existing.add(value)
            return value


def get_prix_range(categorie_nom: str) -> Tuple[int, int]:
    """Retourne le range de prix selon la catégorie."""
    ranges = {
        'Entrées': (5, 15), 'Plats': (15, 30), 'Desserts': (5, 12),
        'Boissons': (3, 8), 'Vins': (20, 100), 'Cafés': (2, 5), 'Menus': (25, 50),
    }
    return ranges.get(categorie_nom, (10, 25))


def random_decimal(low: float, high: float, places: str = '0.01') -> Decimal:
    """Génère un Decimal aléatoire."""
    return Decimal(random.uniform(low, high)).quantize(Decimal(places))


def get_employes_for_restaurant(restaurant, cache: Dict) -> List:
    """Récupère les employés d'un restaurant avec cache."""
    rid = restaurant.id_restaurant
    if rid not in cache:
        cache[rid] = [
            re.employe for re in
            RestaurantEmploye.objects.filter(restaurant=restaurant).select_related('employe')
        ]
    return cache[rid]


def make_aware_datetime(year_start=2024, year_end=2025) -> timezone.datetime:
    """Génère une datetime aware aléatoire."""
    naive = datetime_gen.datetime(start=year_start, end=year_end)
    return timezone.make_aware(naive)


def safe_kwargs(model_class, **kwargs) -> dict:
    """Filtre les kwargs pour ne garder que les champs existants sur le modèle.
    Permet d'ajouter des champs optionnels sans crasher si le modèle ne les a pas encore."""
    valid_fields = {f.name for f in model_class._meta.get_fields()}
    filtered = {k: v for k, v in kwargs.items() if k in valid_fields}
    dropped = set(kwargs.keys()) - set(filtered.keys())
    if dropped:
        # Log une seule fois par combinaison pour ne pas spammer
        if not hasattr(safe_kwargs, '_warned'):
            safe_kwargs._warned = set()
        key = (model_class.__name__, tuple(sorted(dropped)))
        if key not in safe_kwargs._warned:
            safe_kwargs._warned.add(key)
            print(f"  [i] {model_class.__name__}: champs ignorés (pas dans le modèle): {dropped}")
    return filtered


# ─────────────────────────────────────────────────────────────────────────────
# Vidage de la base de données
# ─────────────────────────────────────────────────────────────────────────────
def clear_database():
    """Vide toutes les tables dans l'ordre respectant les FK."""
    print("\n" + "=" * 70)
    print("ÉTAPE 0 : Vidage de la base de données")
    print("=" * 70)

    existing_tables = []
    try:
        existing_tables = connection.introspection.table_names()
    except Exception as e:
        print(f"  [!] Impossible de récupérer la liste des tables: {e}")

    # Ordre de suppression : enfants d'abord, parents ensuite
    models_to_clear = [
        # Billing
        Paiement, LigneFacture, Facture,
        # Reports
        Report,
        # Suppliers (JourLivraison inclus !)
        CommandeFournisseur, JourLivraison, Fournisseur,
        # Planning
        Shift,
        # Settings
        NotificationSettings, BillingSettings,
        # Commandes historiques
        LigneCommandeHistoric, CommandeHistoric,
        # Commandes actives
        LigneCommande, Commande,
        # Notes
        Note,
        # Reservations
        Reservation,
        # Tables
        Table,
        # Stock & Reapprovisionnement
        Reapprovisionnement, Stock,
        # Menu
        ArticleIngredient, Article, CategorieArticle,
        # Ingredients
        Ingredient,
        # Staff
        RestaurantEmploye, Employe, TypeEmploye,
        # Salles
        Salle,
        # Restaurant
        Restaurant,
        # Users
        User,
        # Shared
        MethodePaiement, TauxTVA,
    ]

    for model in models_to_clear:
        try:
            table_name = model._meta.db_table
            if table_name not in existing_tables:
                continue
            count = model.objects.count()
            if count > 0:
                model.objects.all().delete()
                print(f"  [OK] {model.__name__}: {count} enregistrement(s) supprimé(s)")
        except Exception as e:
            error_msg = str(e).lower()
            if 'no such table' not in error_msg and 'does not exist' not in error_msg:
                print(f"  [!] Erreur lors du vidage de {model.__name__}: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Étapes de génération
# ─────────────────────────────────────────────────────────────────────────────

def generate_taux_tva() -> List[TauxTVA]:
    """Étape 1 : Taux de TVA."""
    print("\n── Étape 1 : Taux de TVA")
    data = [
        {'taux': Decimal('20.00'), 'description': 'Taux normal', 'actif': True},
        {'taux': Decimal('10.00'), 'description': 'Taux réduit', 'actif': True},
        {'taux': Decimal('5.50'), 'description': 'Taux super réduit', 'actif': True},
        {'taux': Decimal('0.00'), 'description': 'Taux zéro', 'actif': True},
    ]
    result = []
    for d in data:
        taux = TauxTVA(**d)
        taux.save()
        result.append(taux)
    print(f"  [OK] {len(result)} taux de TVA créés")
    return result


def generate_methodes_paiement() -> List[MethodePaiement]:
    """Étape 2 : Méthodes de paiement."""
    print("\n── Étape 2 : Méthodes de paiement")
    noms = ['Espèces', 'Carte bancaire', 'Ticket restaurant', 'Virement', 'Chèque']
    result = []
    for nom in noms:
        methode = MethodePaiement(nom=nom)
        methode.save()
        result.append(methode)
    print(f"  [OK] {len(result)} méthodes de paiement créées")
    return result


def generate_types_employes() -> List[TypeEmploye]:
    """Étape 3 : Types d'employés."""
    print("\n── Étape 3 : Types d'employés")
    result = []
    for data in TYPES_EMPLOYES:
        te = TypeEmploye(nom_type=data['nom_type'], description=data['description'])
        te.save()
        result.append(te)
    print(f"  [OK] {len(result)} types d'employés créés")
    return result


def generate_restaurants(type_employes: List[TypeEmploye]) -> Tuple[Restaurant, List[Restaurant]]:
    """Étape 4 : Restaurants. Retourne (les_ombres, tous_les_restaurants)."""
    print("\n── Étape 4 : Restaurants")
    siret_set: Set[str] = set()
    pin_set: Set[str] = set()

    # Restaurant principal "Les Ombres et Bar"
    print("  → Création de 'Les Ombres et Bar' (id=1)")
    les_ombres = Restaurant(
        id_restaurant=1,
        nom_restaurant="Les Ombres et Bar",
        adresse_restaurant="27 quai Jacques Chirac",
        code_postal="75007",
        ville="Paris",
        numero_telephone="+33 1 47 53 68 00",
        numero_siret="90238056700021",
        code_naf="94.99Z",
        pin_restaurant="123456",
        logo_url="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
        latitude=Decimal('48.860600'),
        longitude=Decimal('2.337600'),
    )
    les_ombres.save()
    siret_set.add("90238056700021")
    pin_set.add("123456")

    # Reset auto-increment (SQLite: format direct pour eviter bug affichage Django avec ?)
    with connection.cursor() as cursor:
        if connection.vendor == 'mysql':
            table = connection.ops.quote_name(Restaurant._meta.db_table)
            cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 2")
        elif connection.vendor == 'sqlite':
            cursor.execute(
                "UPDATE sqlite_sequence SET seq = 1 WHERE name = '%s'" % Restaurant._meta.db_table
            )

    # Restaurants aléatoires
    print(f"  → Génération de {NB_RESTAURANTS} restaurants aléatoires")
    restaurants = [les_ombres]
    for i in range(NB_RESTAURANTS):
        siret = unique_random_digits(14, siret_set)
        pin = unique_random_digits(6, pin_set)

        restaurant = Restaurant(
            nom_restaurant=finance_gen.company(),
            adresse_restaurant=address_gen.address(),
            code_postal=address_gen.postal_code(),
            ville=address_gen.city(),
            numero_telephone=person_gen.telephone(mask='+33 # ## ## ## ##'),
            numero_siret=siret,
            code_naf=random.choice(['5610A', '5610B', '5621Z', '5629A']),
            pin_restaurant=pin,
            logo_url=LOGO_URLS[i % len(LOGO_URLS)],
            latitude=random_decimal(48.0, 49.0, '0.000001'),
            longitude=random_decimal(2.0, 7.0, '0.000001'),
        )
        restaurant.save()
        restaurants.append(restaurant)

    print(f"  [OK] {len(restaurants)} restaurants créés au total")
    return les_ombres, restaurants


def generate_salles(les_ombres: Restaurant, restaurants: List[Restaurant]) -> Tuple[List[Salle], List[Salle]]:
    """Étape 5 : Salles. Retourne (salles_les_ombres, toutes_les_salles)."""
    print("\n── Étape 5 : Salles")
    all_salles = []
    salles_les_ombres = []

    # Salles pour Les Ombres
    print("  → Salles pour 'Les Ombres'")
    ombres_config = [
        ('Principale', 50, 0),
        ('Terrasse', 30, 0),
        ('VIP', 20, 1),
    ]
    for nom, capacite, etage in ombres_config:
        salle = Salle(
            restaurant=les_ombres,
            nom_salle=f"{nom} - {les_ombres.nom_restaurant}",
            capacite=capacite,
            etage=etage,
            description=f"Salle {nom} du restaurant Les Ombres",
        )
        salle.save()
        all_salles.append(salle)
        salles_les_ombres.append(salle)

    # Salles pour les autres restaurants
    for restaurant in restaurants:
        if restaurant == les_ombres:
            continue
        num_salles = random.randint(2, 4)
        selected_noms = random.sample(NOMS_SALLES, min(num_salles, len(NOMS_SALLES)))
        for nom in selected_noms:
            salle = Salle(
                restaurant=restaurant,
                nom_salle=f"{nom} - {restaurant.nom_restaurant}",
                capacite=random.randint(20, 100),
                etage=random.randint(0, 2),
                description=text_gen.sentence(),
            )
            salle.save()
            all_salles.append(salle)

    print(f"  [OK] {len(all_salles)} salles créées")
    return salles_les_ombres, all_salles


def generate_users_and_employes(
    les_ombres: Restaurant,
    type_employes: List[TypeEmploye],
) -> Tuple[Employe, Employe, List[Employe]]:
    """Étapes 6-7 : Users, root, test, employés."""
    print("\n── Étape 6 : Utilisateur root")
    root_user, created = User.objects.get_or_create(
        username='root',
        defaults={
            'email': 'root@hollypi.com',
            'first_name': 'Admin',
            'last_name': 'System',
            'is_active': True,
            'last_login': timezone.now(),
        }
    )
    if created or not root_user.check_password('root'):
        root_user.set_password('root')
        root_user.is_active = True
        root_user.save()
    if not root_user.email or root_user.email != 'root@hollypi.com':
        root_user.email = 'root@hollypi.com'
        root_user.save(update_fields=['email'])

    type_admin = next((t for t in type_employes if t.nom_type == 'Super Admin Groupe'), type_employes[0])
    root_employe = Employe(**safe_kwargs(Employe,
        user=root_user,
        nom='Admin',
        prenom='System',
        type_employe=type_admin,
        salaire=Decimal('5000.00'),
        date_embauche=date(2020, 1, 1),
        numero_telephone='+33100000000',
        email_professionnel='admin@hollypi.com',
        poste=POSTES_PAR_TYPE.get(type_admin.nom_type, 'Admin'),
        restaurant_actif=les_ombres,
        stock_perm=True,
        note_perm=True,
    ))
    root_employe.save()

    # Employé de test pour Les Ombres
    print("\n── Étape 6.5 : Employé de test 'Les Ombres'")
    type_manager = next((t for t in type_employes if t.nom_type == 'Manager Salle'), type_employes[3])
    test_user, created = User.objects.get_or_create(
        username='test_ombres',
        defaults={
            'email': 'test@lesombres.com',
            'first_name': 'Jean',
            'last_name': 'Dupont',
            'is_active': True,
            'last_login': timezone.now(),
        }
    )
    if created or not test_user.check_password('Test1234!'):
        test_user.set_password('Test1234!')
        test_user.is_active = True
        test_user.save()
    if not test_user.email or test_user.email != 'test@lesombres.com':
        test_user.email = 'test@lesombres.com'
        test_user.save(update_fields=['email'])

    test_employe = Employe(**safe_kwargs(Employe,
        user=test_user,
        nom='Dupont',
        prenom='Jean',
        type_employe=type_manager,
        salaire=Decimal('3500.00'),
        date_embauche=date(2021, 6, 15),
        numero_telephone='+33612345678',
        pin_code='1234',
        email_professionnel='jean.dupont@lesombres.com',
        poste=POSTES_PAR_TYPE.get(type_manager.nom_type, 'Manager'),
        restaurant_actif=les_ombres,
        stock_perm=True,
        note_perm=True,
    ))
    test_employe.save()
    RestaurantEmploye.objects.create(restaurant=les_ombres, employe=test_employe)

    # Employés aléatoires
    print(f"\n── Étape 7 : Génération de {NB_EMPLOYES} employés")
    email_set: Set[str] = {'root@hollypi.com', 'test@lesombres.com'}
    all_employes = [root_employe, test_employe]

    for i in range(NB_EMPLOYES):
        username = person_gen.username() + str(i)
        while True:
            email = person_gen.email(domains=['hollypi.com'])
            if email not in email_set:
                email_set.add(email)
                break

        user = User.objects.create_user(
            username=username, email=email,
            password='Password123!', last_login=timezone.now(),
        )

        te = random.choice(type_employes)
        nom = person_gen.last_name()
        prenom = person_gen.first_name()

        employe = Employe(**safe_kwargs(Employe,
            user=user,
            nom=nom,
            prenom=prenom,
            type_employe=te,
            salaire=random_decimal(1500, 4000),
            date_embauche=datetime_gen.date(start=2018, end=2023),
            numero_telephone=person_gen.telephone(mask='+33#########') if random.random() > 0.2 else None,
            email_professionnel=f"{prenom.lower()}.{nom.lower()}@hollypi.com" if random.random() > 0.3 else None,
            poste=POSTES_PAR_TYPE.get(te.nom_type, 'Employé'),
            restaurant_actif=None,
            stock_perm=te.nom_type in (
                'Responsable Stock', 'Responsable Achats', 'Manager Cuisine',
                'Super Admin Groupe', 'Admin Établissement', 'Directeur',
            ),
            note_perm=te.nom_type not in ('Stagiaire', 'Extra', 'Fournisseur'),
        ))
        employe.save()
        all_employes.append(employe)

    print(f"  [OK] {len(all_employes)} employés créés")
    return root_employe, test_employe, all_employes


def associate_employes_to_restaurants(
    les_ombres: Restaurant,
    restaurants: List[Restaurant],
    all_employes: List[Employe],
    root_employe: Employe,
    test_employe: Employe,
) -> None:
    """Étapes 8-8.5 : Association employés/restaurants + codes PIN."""
    print("\n── Étape 8 : Association employés ↔ restaurants")

    # Association root à Les Ombres
    RestaurantEmploye.objects.get_or_create(restaurant=les_ombres, employe=root_employe)

    # Association aléatoire des autres employés
    for employe in all_employes:
        if employe in (root_employe, test_employe):
            continue
        num = random.randint(1, 3)
        selected = random.sample(restaurants, min(num, len(restaurants)))
        for restaurant in selected:
            RestaurantEmploye.objects.get_or_create(restaurant=restaurant, employe=employe)
        # Mettre à jour restaurant_actif si le champ existe
        if hasattr(employe, 'restaurant_actif'):
            employe.restaurant_actif = selected[0]
            employe.save(update_fields=['restaurant_actif'])

    # Garantir au moins 10 employés pour Les Ombres
    employes_ombres_ids = set(
        RestaurantEmploye.objects.filter(restaurant=les_ombres).values_list('employe_id', flat=True)
    )
    if len(employes_ombres_ids) < 10:
        needed = 10 - len(employes_ombres_ids)
        available = [e for e in all_employes if e.id not in employes_ombres_ids]
        for employe in random.sample(available, min(needed, len(available))):
            RestaurantEmploye.objects.get_or_create(restaurant=les_ombres, employe=employe)

    count = RestaurantEmploye.objects.count()
    print(f"  [OK] {count} associations créées")
    print(f"  [OK] Les Ombres: {RestaurantEmploye.objects.filter(restaurant=les_ombres).count()} employés")

    # Codes PIN uniques par restaurant
    print("\n── Étape 8.5 : Codes PIN")
    for restaurant in restaurants:
        employes_resto = [
            re.employe for re in
            RestaurantEmploye.objects.filter(restaurant=restaurant).select_related('employe')
        ]
        pins_used: Set[str] = {e.pin_code for e in employes_resto if e.pin_code}
        for employe in employes_resto:
            if employe.pin_code:
                continue
            pin = unique_random_digits(4, pins_used)
            employe.pin_code = pin
            employe.save(update_fields=['pin_code'])
    print("  [OK] Codes PIN générés")


def generate_notes(restaurants: List[Restaurant]) -> List[Note]:
    """Étape 9 : Notes."""
    print(f"\n── Étape 9 : {NB_NOTES} notes")
    messages = [' '.join(text_gen.sentence().split()[:10]) for _ in range(10)]
    result = []
    emp_cache: Dict = {}

    for _ in range(NB_NOTES):
        restaurant = random.choice(restaurants)
        employes = get_employes_for_restaurant(restaurant, emp_cache)
        if not employes:
            continue
        note = Note(
            created_by=random.choice(employes),
            restaurant=restaurant,
            message=random.choice(messages),
        )
        note.save()
        result.append(note)

    print(f"  [OK] {len(result)} notes créées")
    return result


def generate_ingredients() -> List[Ingredient]:
    """Étape 10 : Ingrédients."""
    print("\n── Étape 10 : Ingrédients")
    result = []
    for name in INGREDIENT_NAMES:
        ingredient = Ingredient(
            nom=name,
            unite=random.choice(UNITS),
            prix_unitaire=random_decimal(0.5, 15.0),
        )
        ingredient.save()
        result.append(ingredient)
    print(f"  [OK] {len(result)} ingrédients créés")
    return result


def generate_stocks(restaurants: List[Restaurant], ingredients: List[Ingredient]) -> None:
    """Étape 11 : Stocks."""
    print("\n── Étape 11 : Stocks")
    count = 0
    for restaurant in restaurants:
        for ingredient in ingredients:
            Stock(
                restaurant=restaurant,
                ingredient=ingredient,
                quantite_en_stock=random_decimal(20, 200),
                seuil_alerte=random_decimal(5, 30),
            ).save()
            count += 1
    print(f"  [OK] {count} entrées de stock créées")


def generate_categories() -> List[CategorieArticle]:
    """Étape 11.5 : Catégories d'articles (globales, partagées par tous les restaurants)."""
    print("\n── Étape 11.5 : Catégories d'articles")
    result = []
    for cat_data in CATEGORIES_DATA:
        categorie, _ = CategorieArticle.objects.get_or_create(
            nom=cat_data['nom'],
            defaults={
                'ordre_affichage': cat_data['ordre_affichage'],
                'description': cat_data['description'],
            }
        )
        result.append(categorie)
    print(f"  [OK] {len(result)} catégories créées")
    return result


def generate_articles(
    restaurants: List[Restaurant],
    categories: List[CategorieArticle],
    taux_tva_list: List[TauxTVA],
) -> List[Article]:
    """Étape 12 : Articles par restaurant avec allergènes et temps de préparation."""
    print("\n── Étape 12 : Articles")
    result = []

    for restaurant in restaurants:
        article_names: Set[str] = set()
        while len(article_names) < 25:
            article_names.add(food_gen.dish())

        for name in article_names:
            categorie = random.choice(categories)
            taux_tva = random.choice(taux_tva_list)
            prix_min, prix_max = get_prix_range(categorie.nom)

            # Allergènes : 0 à 3 par article
            nb_allergenes = random.randint(0, 3)
            allergenes_str = ', '.join(random.sample(ALLERGENES_LIST, nb_allergenes)) if nb_allergenes > 0 else ''

            # Temps de préparation réaliste selon catégorie
            if categorie.nom in ('Boissons', 'Cafés'):
                temps_prep = random.randint(1, 10)
            elif categorie.nom == 'Entrées':
                temps_prep = random.randint(5, 20)
            elif categorie.nom == 'Desserts':
                temps_prep = random.randint(5, 25)
            else:
                temps_prep = random.randint(10, 45)

            article = Article(**safe_kwargs(Article,
                nom=name,
                restaurant=restaurant,
                categorie=categorie,
                prix=random_decimal(prix_min, prix_max),
                description=text_gen.sentence(),
                disponible=True,
                taux_tva=taux_tva,
                allergenes=allergenes_str if allergenes_str else None,
                temps_preparation=temps_prep,
            ))
            article.save()
            result.append(article)

    print(f"  [OK] {len(result)} articles créés")
    return result


def generate_article_ingredients(
    articles: List[Article],
    ingredients: List[Ingredient],
) -> None:
    """Étape 13 : ArticleIngredient."""
    print("\n── Étape 13 : ArticleIngredient")
    count = 0
    for article in articles:
        num = random.randint(2, 6)
        selected = random.sample(ingredients, min(num, len(ingredients)))
        for ingredient in selected:
            ArticleIngredient(
                article=article,
                ingredient=ingredient,
                quantite_necessaire=random_decimal(0.1, 5.0),
            ).save()
            count += 1
    print(f"  [OK] {count} liens article-ingrédient créés")


def generate_tables(
    les_ombres: Restaurant,
    salles_les_ombres: List[Salle],
    all_salles: List[Salle],
) -> Tuple[List[Table], List[Table]]:
    """Étape 14 : Tables."""
    print("\n── Étape 14 : Tables")
    all_tables = []
    tables_les_ombres = []
    emp_cache: Dict = {}

    # Tables pour Les Ombres
    print("  → Tables pour 'Les Ombres'")
    employes_ombres = get_employes_for_restaurant(les_ombres, emp_cache)
    if employes_ombres:
        for salle in salles_les_ombres:
            if 'Principale' in salle.nom_salle:
                num_tables = 8
            elif 'Terrasse' in salle.nom_salle:
                num_tables = 5
            else:
                num_tables = 3
            for i in range(1, num_tables + 1):
                table = Table(
                    salle=salle,
                    numero=i,
                    capacity=random.choice([2, 4, 6, 8]),
                    reserved_seats=0,
                    employee_in_charge=random.choice(employes_ombres),
                    is_occupied=False,
                    position_x=random.randint(0, 100),
                    position_y=random.randint(0, 100),
                )
                table.save()
                all_tables.append(table)
                tables_les_ombres.append(table)

    # Tables pour les autres restaurants
    for salle in all_salles:
        if salle.restaurant == les_ombres:
            continue
        num_tables = random.randint(5, 15)
        employes_resto = get_employes_for_restaurant(salle.restaurant, emp_cache)
        if not employes_resto:
            continue
        for i in range(1, num_tables + 1):
            table = Table(
                salle=salle,
                numero=i,
                capacity=random.randint(2, 10),
                reserved_seats=0,
                employee_in_charge=random.choice(employes_resto),
                is_occupied=False,
                position_x=random.randint(0, 100),
                position_y=random.randint(0, 100),
            )
            table.save()
            all_tables.append(table)

    print(f"  [OK] {len(all_tables)} tables créées")
    return tables_les_ombres, all_tables


def generate_reservations(
    les_ombres: Restaurant,
    salles_les_ombres: List[Salle],
    all_salles: List[Salle],
    all_tables: List[Table],
) -> List[Reservation]:
    """Étape 15 : Réservations + mise à jour des reserved_seats."""
    print("\n── Étape 15 : Réservations")
    result = []

    # Index tables par salle
    tables_by_salle: Dict[int, List[Table]] = {}
    for t in all_tables:
        tables_by_salle.setdefault(t.salle_id, []).append(t)

    def max_table_capacity(salle: Salle) -> int:
        tables = tables_by_salle.get(salle.id, [])
        return max((t.capacity for t in tables), default=4)

    def assign_table(reservation: Reservation) -> None:
        """Assigne une table compatible à la réservation et met à jour reserved_seats."""
        tables_salle = tables_by_salle.get(reservation.salle_id, [])
        candidates = [t for t in tables_salle if t.capacity >= reservation.nombre_personnes]
        if not candidates:
            return
        table = random.choice(candidates)
        reservation.table = table
        reservation.save(update_fields=['table'])
        table.reserved_seats = min(
            table.reserved_seats + reservation.nombre_personnes,
            table.capacity,
        )
        table.save(update_fields=['reserved_seats'])

    # Réservations Les Ombres (prochains jours)
    print("  → Réservations 'Les Ombres' (7 prochains jours)")
    for _ in range(NB_RESERVATIONS_LES_OMBRES):
        salle = random.choice(salles_les_ombres)
        max_cap = max_table_capacity(salle)
        days_offset = random.randint(0, 7)
        target = timezone.now() + timedelta(days=days_offset)
        hour = random.choice([12, 12, 13, 13, 19, 19, 20, 20, 21])
        aware_dt = target.replace(
            hour=hour, minute=random.choice([0, 15, 30, 45]),
            second=0, microsecond=0,
        )
        nb_personnes = random.randint(1, max_cap)

        reservation = Reservation(
            salle=salle,
            nom_client=person_gen.full_name(),
            nombre_personnes=nb_personnes,
            date_heure=aware_dt,
            telephone=person_gen.telephone(mask='+33 # ## ## ## ##'),
        )
        reservation.save()
        assign_table(reservation)
        result.append(reservation)

    # Réservations autres restaurants (dates réalistes)
    for _ in range(NB_RESERVATIONS_AUTRES):
        salles_autres = [s for s in all_salles if s.restaurant != les_ombres]
        if not salles_autres:
            continue
        salle = random.choice(salles_autres)
        max_cap = max_table_capacity(salle)
        aware_dt = make_aware_datetime(2024, 2025)
        nb_personnes = random.randint(1, max_cap)

        reservation = Reservation(
            salle=salle,
            nom_client=person_gen.full_name(),
            nombre_personnes=nb_personnes,
            date_heure=aware_dt,
            telephone=person_gen.telephone(mask='+33 # ## ## ## ##'),
        )
        reservation.save()
        assign_table(reservation)
        result.append(reservation)

    print(f"  [OK] {len(result)} réservations créées")
    return result


def generate_commandes(
    les_ombres: Restaurant,
    restaurants: List[Restaurant],
    articles: List[Article],
    tables_les_ombres: List[Table],
    all_tables: List[Table],
) -> None:
    """Étapes 16-17 : Commandes + Lignes de commande.
    
    Logique corrigée :
    - save() ne retourne rien → on travaille directement sur l'objet commande
    - created_at forcé via UPDATE SQL pour contourner auto_now_add
    - montant calculé après création des lignes
    - couverts, nb_articles, note_cuisine, note_bar renseignés
    - tables_occupees correctement gérées
    """
    print("\n── Étape 16 : Commandes")
    now = timezone.now()
    emp_cache: Dict = {}

    # Index articles par restaurant
    articles_by_resto: Dict[int, List[Article]] = {}
    for a in articles:
        rid = a.restaurant_id
        articles_by_resto.setdefault(rid, []).append(a)

    # Index tables par restaurant
    tables_by_resto: Dict[int, List[Table]] = {}
    for t in all_tables:
        rid = t.salle.restaurant_id
        tables_by_resto.setdefault(rid, []).append(t)

    def create_lignes(commande: Commande, nb_articles: int) -> Decimal:
        """Crée les lignes de commande et retourne le montant total."""
        rid = commande.restaurant_id
        arts = articles_by_resto.get(rid, [])
        if not arts:
            return Decimal('0.00')

        montant = Decimal('0.00')
        available = list(arts)

        for _ in range(nb_articles):
            if not available:
                available = list(arts)
            article = random.choice(available)
            available.remove(article)
            quantite = random.randint(1, 2)

            if article.prix is None:
                continue

            en_attente = False
            try:
                cat_nom = article.categorie.nom
            except Exception:
                cat_nom = ""
            if cat_nom in ('Desserts', 'Boissons') and random.random() < 0.4:
                en_attente = True

            LigneCommande(
                commande=commande,
                article=article,
                quantite=quantite,
                en_attente_service=en_attente,
            ).save()

            montant += article.prix * quantite

        return montant

    def force_created_at(commande: Commande, dt):
        """Force created_at via SQL UPDATE (contourne auto_now_add) + sync objet Python."""
        Commande.objects.filter(pk=commande.pk).update(created_at=dt)
        commande.created_at = dt

    commandes_count = 0

    # ── Commandes Les Ombres ──
    print(f"  → {NB_COMMANDES_LES_OMBRES} commandes 'Les Ombres'")
    employes_ombres = get_employes_for_restaurant(les_ombres, emp_cache)

    if employes_ombres and tables_les_ombres:
        for i in range(NB_COMMANDES_LES_OMBRES):
            employe = random.choice(employes_ombres)
            table = random.choice(tables_les_ombres)
            arts_ombres = articles_by_resto.get(les_ombres.id_restaurant, [])
            if not arts_ombres:
                continue

            random_days = random.randint(0, 7)
            random_hours = random.randint(11, 22)
            random_minutes = random.choice([0, 15, 30, 45])
            created_at = now - timedelta(
                days=random_days, hours=24 - random_hours, minutes=random_minutes,
            )

            nombre_clients = random.randint(1, table.capacity)
            nb_articles = random.randint(nombre_clients, nombre_clients * 3)

            statut_cuisine = random.choice(['PENDING', 'IN_PROGRESS', 'READY'])
            priorite = random.choice(['LOW', 'NORMAL', 'HIGH'])

            if random_days > 1:
                statut_final = random.choice(['VALIDEE', 'ANNULEE'])
            else:
                statut_final = random.choice(['EN_COURS', 'VALIDEE'])

            commande = Commande(**safe_kwargs(Commande,
                created_by=employe,
                restaurant=les_ombres,
                statut='EN_COURS',
                statut_cuisine=statut_cuisine,
                priorite=priorite,
                montant=Decimal('0.00'),
                table=table,
                nb_articles=nb_articles,
            ))
            commande.save()
            force_created_at(commande, created_at)

            montant = create_lignes(commande, nb_articles)
            commande.montant = montant
            commande.statut = statut_final
            commande.save()
            commandes_count += 1

    # ── Commandes autres restaurants ──
    print(f"  → {NB_COMMANDES_AUTRES} commandes autres restaurants")
    tables_occupees: Set[int] = set()

    for _ in range(NB_COMMANDES_AUTRES):
        restaurant = random.choice(restaurants)
        employes = get_employes_for_restaurant(restaurant, emp_cache)
        if not employes:
            continue

        tables_resto = tables_by_resto.get(restaurant.id_restaurant, [])
        tables_dispo = [t for t in tables_resto if t.id not in tables_occupees]
        if not tables_dispo:
            continue

        employe = random.choice(employes)
        table = random.choice(tables_dispo)

        random_days = random.randint(0, 7)
        random_hours = random.randint(0, 23)
        random_minutes = random.randint(0, 59)
        created_at = now - timedelta(
            days=random_days, hours=random_hours, minutes=random_minutes,
        )

        nombre_clients = random.randint(1, table.capacity)
        nb_articles = random.randint(nombre_clients, nombre_clients * 3)

        if random_days > 1:
            statut_final = random.choice(['VALIDEE', 'ANNULEE'])
        else:
            statut_final = random.choice(['EN_COURS', 'VALIDEE', 'ANNULEE'])
            if statut_final == 'EN_COURS':
                tables_occupees.add(table.id)

        commande = Commande(**safe_kwargs(Commande,
            created_by=employe,
            restaurant=restaurant,
            statut='EN_COURS',
            statut_cuisine=random.choice(['PENDING', 'IN_PROGRESS', 'READY']),
            priorite=random.choice(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
            montant=Decimal('0.00'),
            table=table,
            nb_articles=nb_articles,
        ))
        commande.save()
        force_created_at(commande, created_at)

        montant = create_lignes(commande, nb_articles)
        commande.montant = montant
        commande.statut = statut_final
        commande.save()
        commandes_count += 1

    # Mettre à jour is_occupied sur les tables encore occupées
    Table.objects.filter(id__in=tables_occupees).update(is_occupied=True)

    print(f"  [OK] {commandes_count} commandes créées au total")
    print(f"  [OK] {LigneCommande.objects.count()} lignes de commande actives")
    print(f"  [OK] {CommandeHistoric.objects.count()} commandes archivées")
    print(f"  [OK] {LigneCommandeHistoric.objects.count()} lignes historiques")


def generate_reapprovisionnements(
    restaurants: List[Restaurant],
    ingredients: List[Ingredient],
) -> None:
    """Étape 18 : Réapprovisionnements."""
    print(f"\n── Étape 18 : {NB_REAPPROVISIONNEMENTS} réapprovisionnements")
    for _ in range(NB_REAPPROVISIONNEMENTS):
        restaurant = random.choice(restaurants)
        ingredient = random.choice(ingredients)
        quantite = random_decimal(5, 50)
        facteur = random_decimal(0.8, 1.1)
        prix_achat = (quantite * ingredient.prix_unitaire * facteur).quantize(Decimal('0.01'))

        Reapprovisionnement(
            restaurant=restaurant,
            ingredient=ingredient,
            quantite_ajoutee=quantite,
            prix_achat=prix_achat,
        ).save()
    print(f"  [OK] {NB_REAPPROVISIONNEMENTS} réapprovisionnements créés")


def update_article_availability(articles: List[Article]) -> None:
    """Étape 19 : Mise à jour de la disponibilité des articles."""
    print("\n── Étape 19 : Disponibilité des articles")
    updated = 0
    for article in articles:
        try:
            new_dispo = article.verifier_disponibilite()
            if new_dispo != article.disponible:
                article.disponible = new_dispo
                article.save(update_fields=['disponible'])
                updated += 1
        except Exception:
            pass
    print(f"  [OK] {updated} articles mis à jour")


def generate_factures(methodes_paiement: List[MethodePaiement]) -> None:
    """Étape 20 : Factures pour les commandes VALIDEE (Facture lie uniquement CommandeHistoric)."""
    print("\n── Étape 20 : Factures")
    count = 0

    # Archiver les commandes VALIDEE pour les avoir en CommandeHistoric (requis par Facture)
    from apps.commandes.services import CommandeService
    for commande in list(Commande.objects.filter(statut='VALIDEE').select_related('restaurant')):
        CommandeService.archiver_commande(commande)

    # Factures pour CommandeHistoric validées
    for commande in CommandeHistoric.objects.filter(statut='VALIDEE').select_related('restaurant'):
        if not commande.restaurant:
            continue
        count += _create_facture(commande, commande.restaurant, methodes_paiement)

    print(f"  [OK] {count} factures créées")


def _create_facture(commande, restaurant: Restaurant, methodes_paiement: List[MethodePaiement]) -> int:
    """Crée une facture pour une commande. Retourne 1 si créée, 0 sinon."""
    rid = restaurant.id_restaurant
    numero = f"F{rid:03d}-{commande.id:06d}"

    rand = random.random()
    if rand < 0.70:
        etat = 'payee'
    elif rand < 0.90:
        etat = 'en_attente'
    else:
        etat = 'annulee'

    facture = Facture(
        numero=numero,
        date=commande.created_at.date() if commande.created_at else timezone.now().date(),
        restaurant=restaurant,
        commande=commande,
        etat=etat,
        montant_ht=Decimal('0.00'),
        montant_tva=Decimal('0.00'),
        montant_ttc=Decimal('0.00'),
    )
    facture.save()

    # Lignes de facture
    lignes = commande.lignes.all().select_related('article', 'article__taux_tva')
    for ligne in lignes:
        try:
            LigneFacture(
                facture=facture,
                produit=ligne.article,
                quantite=ligne.quantite,
                prix_unitaire_ht=ligne.article.prix,
                prix_unitaire_ttc=ligne.article.prix_ttc,
                taux_tva=ligne.article.taux_tva,
            ).save()
        except Exception:
            continue

    try:
        facture.calculer_totaux()
        facture.save()
    except Exception:
        pass

    if etat == 'payee':
        Paiement(
            facture=facture,
            methode_paiement=random.choice(methodes_paiement),
            montant=facture.montant_ttc,
        ).save()

    return 1


def generate_fournisseurs(
    les_ombres: Restaurant,
    restaurants: List[Restaurant],
) -> Tuple[List[Fournisseur], List[Fournisseur]]:
    """Étape 21 : Fournisseurs avec contact_prenom et notes."""
    print("\n── Étape 21 : Fournisseurs")
    all_fournisseurs = []
    fournisseurs_ombres = []

    fournisseurs_test = [
        {'nom': 'Distrib Alimentaire', 'contact_nom': 'Jean Martin',
         'email': 'contact@distrib-alim.fr', 'tel': '+33 1 23 45 67 89'},
        {'nom': 'Vins Sélection', 'contact_nom': 'Marie Dubois',
         'email': 'contact@vins-selection.fr', 'tel': '+33 1 23 45 67 90'},
        {'nom': 'Fromagerie Artisanale', 'contact_nom': 'Pierre Durand',
         'email': 'contact@fromagerie-art.fr', 'tel': '+33 1 23 45 67 91'},
    ]
    for fd in fournisseurs_test:
        f = Fournisseur(**safe_kwargs(Fournisseur,
            nom=fd['nom'],
            contact_nom=fd['contact_nom'],
            email=fd['email'],
            telephone=fd['tel'],
            adresse=address_gen.address(),
            ville='Paris',
            code_postal='75001',
            latitude=random_decimal(48.85, 48.87, '0.000001'),
            longitude=random_decimal(2.30, 2.35, '0.000001'),
            actif=True,
            notes=f"Fournisseur de confiance - {fd['nom']}",
        ))
        f.save()
        all_fournisseurs.append(f)
        fournisseurs_ombres.append(f)

        for jour in random.sample(['MONDAY', 'WEDNESDAY', 'FRIDAY'], random.randint(1, 3)):
            JourLivraison.objects.create(
                fournisseur=f, jour=jour,
                heure_livraison=time(random.randint(8, 12), 0, 0),
            )

    noms_fournisseurs = [
        'Fournisseur ABC', 'Grossiste Pro', 'Métro Cash', 'Système U Pro',
        'Promocash', 'Brake', 'Davigel', 'Traiteur Express',
        'Boissons & Co', 'Boucherie Premium',
    ]
    for nom in noms_fournisseurs:
        contact_nom = f"{person_gen.first_name()} {person_gen.last_name()}"
        f = Fournisseur(**safe_kwargs(Fournisseur,
            nom=nom,
            contact_nom=contact_nom,
            email=person_gen.email(domains=['fournisseur.fr']),
            telephone=person_gen.telephone(mask='+33 # ## ## ## ##'),
            adresse=address_gen.address(),
            ville=address_gen.city(),
            code_postal=address_gen.postal_code(),
            latitude=random_decimal(48.0, 49.0, '0.000001'),
            longitude=random_decimal(2.0, 3.0, '0.000001'),
            actif=random.choice([True, True, True, False]),
            notes=text_gen.sentence() if random.random() > 0.5 else '',
        ))
        f.save()
        all_fournisseurs.append(f)

        for jour in random.sample(
            ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
            random.randint(1, 3),
        ):
            JourLivraison.objects.create(
                fournisseur=f, jour=jour,
                heure_livraison=time(random.randint(8, 12), 0, 0),
            )

    print(f"  [OK] {len(all_fournisseurs)} fournisseurs créés")
    return fournisseurs_ombres, all_fournisseurs


def generate_commandes_fournisseurs(
    les_ombres: Restaurant,
    restaurants: List[Restaurant],
    fournisseurs_ombres: List[Fournisseur],
    all_fournisseurs: List[Fournisseur],
) -> None:
    """Étape 22 : Commandes fournisseurs avec notes."""
    print("\n── Étape 22 : Commandes fournisseurs")
    numeros_utilises: Set[str] = set()

    for i in range(NB_FOURNISSEURS_COMMANDES_OMBRES):
        fournisseur = random.choice(fournisseurs_ombres)
        date_commande = timezone.now().date() - timedelta(days=random.randint(0, 30))
        statut = random.choice(['SENT', 'CONFIRMED', 'DELIVERED'])
        numero = f"CMD-{les_ombres.id_restaurant:03d}-{1000 + i}"
        numeros_utilises.add(numero)

        CommandeFournisseur(**safe_kwargs(CommandeFournisseur,
            fournisseur=fournisseur,
            restaurant=les_ombres,
            numero_commande=numero,
            date_commande=date_commande,
            date_livraison_prevue=date_commande + timedelta(days=random.randint(1, 7)),
            statut=statut,
            montant_total=random_decimal(200, 1500),
            notes=f"Commande #{i + 1} pour Les Ombres" if random.random() > 0.5 else '',
        )).save()

    statuts = ['DRAFT', 'SENT', 'CONFIRMED', 'DELIVERED', 'CANCELLED']
    for _ in range(NB_FOURNISSEURS_COMMANDES_AUTRES):
        fournisseur = random.choice(all_fournisseurs)
        restaurant = random.choice(restaurants)
        date_commande = datetime_gen.date(start=2024, end=2025)

        while True:
            numero = f"CMD-{restaurant.id_restaurant:03d}-{random.randint(1000, 9999)}"
            if numero not in numeros_utilises:
                numeros_utilises.add(numero)
                break

        statut = random.choice(statuts)
        CommandeFournisseur(**safe_kwargs(CommandeFournisseur,
            fournisseur=fournisseur,
            restaurant=restaurant,
            numero_commande=numero,
            date_commande=date_commande,
            date_livraison_prevue=(
                date_commande + timedelta(days=random.randint(1, 7))
                if statut != 'DRAFT' else None
            ),
            statut=statut,
            montant_total=random_decimal(100, 2000),
            notes=text_gen.sentence() if random.random() > 0.6 else '',
        )).save()

    total = NB_FOURNISSEURS_COMMANDES_OMBRES + NB_FOURNISSEURS_COMMANDES_AUTRES
    print(f"  [OK] {total} commandes fournisseurs créées")


def generate_settings(les_ombres: Restaurant, restaurants: List[Restaurant]) -> None:
    """Étape 23 : Paramètres de notification et facturation."""
    print("\n── Étape 23 : Paramètres")
    NotificationSettings.objects.get_or_create(
        restaurant=les_ombres,
        defaults={
            'email_notifications': True, 'sms_notifications': True,
            'stock_alerts': True, 'reservation_alerts': True, 'command_alerts': True,
        }
    )
    BillingSettings.objects.get_or_create(
        restaurant=les_ombres,
        defaults={'tva_par_defaut': Decimal('20.00'), 'devise': 'EUR', 'facture_auto': True}
    )

    for restaurant in restaurants:
        if restaurant == les_ombres:
            continue
        NotificationSettings.objects.get_or_create(
            restaurant=restaurant,
            defaults={
                'email_notifications': random.choice([True, True, False]),
                'sms_notifications': random.choice([True, False, False]),
                'stock_alerts': random.choice([True, True, True, False]),
                'reservation_alerts': random.choice([True, True, False]),
                'command_alerts': random.choice([True, True, False]),
            }
        )
        BillingSettings.objects.get_or_create(
            restaurant=restaurant,
            defaults={
                'tva_par_defaut': Decimal(str(random.choice([5.50, 10.00, 20.00]))),
                'devise': 'EUR',
                'facture_auto': random.choice([True, True, False]),
            }
        )
    print(f"  [OK] Paramètres configurés pour {len(restaurants)} restaurants")


def generate_shifts(les_ombres: Restaurant, restaurants: List[Restaurant]) -> None:
    """Étape 24 : Planning (shifts sans chevauchement par employé par jour)."""
    print("\n── Étape 24 : Shifts")
    heures_par_type = {
        'MORNING': (8, 14), 'AFTERNOON': (14, 18),
        'EVENING': (18, 23), 'NIGHT': (23, 6),
    }
    type_shifts = list(heures_par_type.keys())
    jours_travailles: Set[Tuple[int, date]] = set()
    emp_cache: Dict = {}
    count = 0

    def creer_shift(employe, restaurant, week_start, jour, type_shift, notes=None) -> bool:
        h_debut, h_fin = heures_par_type[type_shift]
        date_debut = week_start + timedelta(days=jour, hours=h_debut)
        date_fin = week_start + timedelta(
            days=jour + (1 if h_fin < h_debut else 0), hours=h_fin,
        )

        cle = (employe.id, date_debut.date())
        if cle in jours_travailles:
            return False
        jours_travailles.add(cle)

        Shift(
            employe=employe, restaurant=restaurant,
            date_debut=date_debut, date_fin=date_fin,
            type_shift=type_shift, notes=notes,
        ).save()
        return True

    # Shifts Les Ombres (2 prochaines semaines)
    employes_ombres = get_employes_for_restaurant(les_ombres, emp_cache)
    if employes_ombres:
        for week_offset in range(2):
            ws = timezone.now() + timedelta(weeks=week_offset)
            ws = ws.replace(hour=0, minute=0, second=0, microsecond=0)
            for employe in employes_ombres:
                jours = random.sample(range(7), min(5, 7))
                for jour in jours:
                    if creer_shift(
                        employe, les_ombres, ws, jour,
                        random.choice(type_shifts), f"Shift {employe.prenom}",
                    ):
                        count += 1

    # Shifts autres restaurants (4 dernières semaines)
    for week_offset in range(4):
        ws = timezone.now() - timedelta(weeks=week_offset)
        ws = ws.replace(hour=0, minute=0, second=0, microsecond=0)
        for restaurant in restaurants:
            if restaurant == les_ombres:
                continue
            employes = get_employes_for_restaurant(restaurant, emp_cache)
            if not employes:
                continue
            for employe in employes:
                jours = random.sample(range(7), min(4, 7))
                for jour in jours:
                    if creer_shift(employe, restaurant, ws, jour, random.choice(type_shifts)):
                        count += 1

    print(f"  [OK] {count} shifts créés")


def generate_reports(les_ombres: Restaurant, restaurants: List[Restaurant]) -> None:
    """Étape 25 : Rapports."""
    print("\n── Étape 25 : Rapports")
    type_reports = ['SALES', 'STOCK', 'STAFF', 'FINANCIAL', 'CUSTOM']
    emp_cache: Dict = {}
    count = 0

    employes_ombres = get_employes_for_restaurant(les_ombres, emp_cache)
    users_ombres = [e.user for e in employes_ombres if e.user]
    for type_report in type_reports:
        Report(
            restaurant=les_ombres,
            type_report=type_report,
            periode_debut=timezone.now().date() - timedelta(days=30),
            periode_fin=timezone.now().date(),
            created_by=random.choice(users_ombres) if users_ombres else None,
        ).save()
        count += 1

    for _ in range(NB_REPORTS_AUTRES):
        restaurant = random.choice([r for r in restaurants if r != les_ombres])
        type_report = random.choice(type_reports)
        mois = random.randint(1, 3)
        debut = timezone.now().date() - timedelta(days=30 * mois)
        fin = debut + timedelta(days=random.randint(7, 30))

        employes = get_employes_for_restaurant(restaurant, emp_cache)
        users = [e.user for e in employes if e.user]

        Report(
            restaurant=restaurant,
            type_report=type_report,
            periode_debut=debut,
            periode_fin=fin,
            created_by=random.choice(users) if users else None,
        ).save()
        count += 1

    print(f"  [OK] {count} rapports créés")


# ─────────────────────────────────────────────────────────────────────────────
# Fonction principale
# ─────────────────────────────────────────────────────────────────────────────

def generate_fake_data():
    """
    Génère toutes les données fictives dans une transaction atomique.
    En cas d'erreur, AUCUNE donnée n'est persistée (rollback automatique).
    """
    print("\n" + "=" * 70)
    print("  GÉNÉRATION DES DONNÉES FICTIVES - HOLLY PI")
    print("=" * 70)

    # Le vidage se fait HORS transaction pour pouvoir recommencer proprement
    clear_database()

    try:
        with transaction.atomic():
            # Données de référence
            taux_tva = generate_taux_tva()
            methodes_paiement = generate_methodes_paiement()
            type_employes = generate_types_employes()

            # Restaurants
            les_ombres, restaurants = generate_restaurants(type_employes)

            # Salles
            salles_les_ombres, all_salles = generate_salles(les_ombres, restaurants)

            # Users et Employés
            root_employe, test_employe, all_employes = generate_users_and_employes(
                les_ombres, type_employes,
            )

            # Associations employés ↔ restaurants + PIN
            associate_employes_to_restaurants(
                les_ombres, restaurants, all_employes, root_employe, test_employe,
            )

            # Notes
            generate_notes(restaurants)

            # Ingrédients et Stocks
            ingredients = generate_ingredients()
            generate_stocks(restaurants, ingredients)

            # Menu (catégories, articles, liens article-ingrédient)
            categories = generate_categories()
            articles = generate_articles(restaurants, categories, taux_tva)
            generate_article_ingredients(articles, ingredients)

            # Tables
            tables_les_ombres, all_tables = generate_tables(
                les_ombres, salles_les_ombres, all_salles,
            )

            # Réservations (+ mise à jour reserved_seats)
            generate_reservations(les_ombres, salles_les_ombres, all_salles, all_tables)

            # Commandes et lignes de commande
            generate_commandes(
                les_ombres, restaurants, articles,
                tables_les_ombres, all_tables,
            )

            # Réapprovisionnements
            generate_reapprovisionnements(restaurants, ingredients)

            # Disponibilité articles
            update_article_availability(articles)

            # Factures (historiques + actives)
            generate_factures(methodes_paiement)

            # Fournisseurs
            fournisseurs_ombres, all_fournisseurs = generate_fournisseurs(
                les_ombres, restaurants,
            )
            generate_commandes_fournisseurs(
                les_ombres, restaurants, fournisseurs_ombres, all_fournisseurs,
            )

            # Settings
            generate_settings(les_ombres, restaurants)

            # Planning (shifts)
            generate_shifts(les_ombres, restaurants)

            # Reports
            generate_reports(les_ombres, restaurants)

        # ── Résumé final (hors transaction) ──
        print("\n" + "=" * 70)
        print("  [OK] GENERATION TERMINEE AVEC SUCCES")
        print("=" * 70)

        print("\n── Résumé ──")
        summary_models = [
            ('Restaurant', Restaurant),
            ('Salle', Salle),
            ('User', User),
            ('Employe', Employe),
            ('RestaurantEmploye', RestaurantEmploye),
            ('TypeEmploye', TypeEmploye),
            ('Ingredient', Ingredient),
            ('Stock', Stock),
            ('CategorieArticle', CategorieArticle),
            ('Article', Article),
            ('ArticleIngredient', ArticleIngredient),
            ('Table', Table),
            ('Reservation', Reservation),
            ('Commande', Commande),
            ('LigneCommande', LigneCommande),
            ('CommandeHistoric', CommandeHistoric),
            ('LigneCommandeHistoric', LigneCommandeHistoric),
            ('Facture', Facture),
            ('LigneFacture', LigneFacture),
            ('Paiement', Paiement),
            ('Fournisseur', Fournisseur),
            ('JourLivraison', JourLivraison),
            ('CommandeFournisseur', CommandeFournisseur),
            ('Shift', Shift),
            ('Report', Report),
            ('Note', Note),
            ('TauxTVA', TauxTVA),
            ('MethodePaiement', MethodePaiement),
            ('NotificationSettings', NotificationSettings),
            ('BillingSettings', BillingSettings),
        ]
        for name, model in summary_models:
            try:
                count = model.objects.count()
                print(f"  {name:<30} {count:>6}")
            except Exception:
                pass

        # Comptes pour connexion (auth par email + mot de passe)
        print("\n── Comptes pour connexion (email + mot de passe) ──")
        print("  Connexion possible uniquement avec EMAIL (pas le username).")
        print("  Comptes fixes :")
        print("    root@hollypi.com     / root")
        print("    test@lesombres.com   / Test1234!")
        print("  Employés générés (mot de passe commun) : Password123!")
        try:
            sample = list(
                User.objects.filter(email__icontains="hollypi.com")
                .exclude(email__in=["root@hollypi.com", "test@lesombres.com"])
                .values_list("email", flat=True)[:3]
            )
            for e in sample:
                print(f"    {e}")
        except Exception:
            pass

        return True

    except Exception as e:
        print(f"\n[ERREUR] {e}")
        import traceback
        traceback.print_exc()
        print("\n[!] Transaction annulee — aucune donnée n'a été persistée.")
        return False


if __name__ == "__main__":
    success = generate_fake_data()
    sys.exit(0 if success else 1)