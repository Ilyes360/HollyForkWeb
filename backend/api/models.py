"""
Django models matching the HollyForkWeb ERD (Salle-centric, multi-tenant).
Uses Django's built-in User (AUTH_USER_MODEL); UserProfile extends with role, salle, MFA.
"""
import secrets
from decimal import Decimal
from django.conf import settings
from django.db import models


def generate_temp_token():
    return secrets.token_urlsafe(32)


# ─── Core (Salle, Role) ─────────────────────────────────────────────────────

class Salle(models.Model):
    """Venue / room / hall — central entity; most data is scoped by id_salle."""
    nom_salle = models.CharField(max_length=255)
    adresse_salle = models.CharField(max_length=500, blank=True)
    telephone_salle = models.CharField(max_length=50, blank=True)
    email_salle = models.EmailField(blank=True)
    description_salle = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom_salle']

    def __str__(self):
        return self.nom_salle


class Role(models.Model):
    """User role within a salle."""
    nom_role = models.CharField(max_length=100)
    description_role = models.TextField(blank=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='roles', null=True, blank=True)

    class Meta:
        ordering = ['nom_role']

    def __str__(self):
        return self.nom_role


# ─── User extension (MFA + role/salle) ───────────────────────────────────────

class UserProfile(models.Model):
    """Extended profile: role, salle, and MFA (TOTP)."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    salle = models.ForeignKey(Salle, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    totp_secret = models.CharField(max_length=32, blank=True)
    mfa_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile {self.user.email}"


class TempLoginToken(models.Model):
    """Temporary token after email+password when MFA is enabled."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True, default=generate_temp_token)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"TempLogin {self.user.email}"


# ─── Venue layout (Table, Zone_Verdure, Mur) ─────────────────────────────────

class Table(models.Model):
    """Table in a salle with position and dimensions."""
    TYPE_CHOICES = [
        ('carrée', 'Carrée'),
        ('rectangulaire', 'Rectangulaire'),
        ('ronde', 'Ronde'),
    ]
    numero_table = models.CharField(max_length=50)
    capacite_table = models.PositiveSmallIntegerField(default=2)
    type_table = models.CharField(max_length=20, choices=TYPE_CHOICES, default='carrée')
    x_position = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    y_position = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    rotation = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0'))
    width = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('60'))
    height = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('60'))
    radius = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actif = models.BooleanField(default=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='tables')

    class Meta:
        ordering = ['numero_table']
        unique_together = [['salle', 'numero_table']]

    def __str__(self):
        return f"Table {self.numero_table} ({self.salle})"


class Zone_Verdure(models.Model):
    """Greenery zone (round or line) on the map."""
    TYPE_CHOICES = [
        ('round', 'Rond'),
        ('line', 'Ligne'),
    ]
    type_verdure = models.CharField(max_length=20, choices=TYPE_CHOICES)
    points_verdure = models.JSONField(default=list)  # coordinates
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='zones_verdure')

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"Verdure {self.get_type_verdure_display()} ({self.salle})"


class Mur(models.Model):
    """Wall segment on the floor plan."""
    points_mur = models.JSONField(default=list)  # coordinates
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='murs')

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"Mur #{self.pk} ({self.salle})"


# ─── Menu & dishes ───────────────────────────────────────────────────────────

class Groupe_Menu(models.Model):
    """Menu group/category."""
    nom_groupe_menu = models.CharField(max_length=200)
    description_groupe_menu = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='groupes_menu')

    class Meta:
        ordering = ['nom_groupe_menu']

    def __str__(self):
        return self.nom_groupe_menu


class Menu(models.Model):
    """Menu (e.g. lunch, dinner)."""
    nom_menu = models.CharField(max_length=200)
    description_menu = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='menus')
    groupes = models.ManyToManyField(
        Groupe_Menu,
        through='Appartenance_Groupe_Menu',
        related_name='menus',
        blank=True
    )

    class Meta:
        ordering = ['nom_menu']

    def __str__(self):
        return self.nom_menu


class Appartenance_Groupe_Menu(models.Model):
    """Junction: Groupe_Menu <-> Menu."""
    groupe_menu = models.ForeignKey(Groupe_Menu, on_delete=models.CASCADE)
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE)

    class Meta:
        unique_together = [['groupe_menu', 'menu']]


class Plat(models.Model):
    """Dish."""
    nom_plat = models.CharField(max_length=200)
    description_plat = models.TextField(blank=True)
    prix_plat = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    actif = models.BooleanField(default=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='plats')

    class Meta:
        ordering = ['nom_plat']

    def __str__(self):
        return self.nom_plat


class Appartenance_Menu_Plat(models.Model):
    """Junction: Menu <-> Plat."""
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='lien_plats')
    plat = models.ForeignKey(Plat, on_delete=models.CASCADE, related_name='lien_menus')

    class Meta:
        unique_together = [['menu', 'plat']]


class Formule(models.Model):
    """Set meal / formula."""
    nom_formule = models.CharField(max_length=200)
    description_formule = models.TextField(blank=True)
    prix_formule = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    actif = models.BooleanField(default=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='formules')
    menus = models.ManyToManyField(
        Menu,
        through='Appartenance_Formule_Menu',
        related_name='formules',
        blank=True
    )

    class Meta:
        ordering = ['nom_formule']

    def __str__(self):
        return self.nom_formule


class Appartenance_Formule_Menu(models.Model):
    """Junction: Formule <-> Menu."""
    formule = models.ForeignKey(Formule, on_delete=models.CASCADE)
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE)

    class Meta:
        unique_together = [['formule', 'menu']]


# ─── Ingredients (stock for kitchen) ────────────────────────────────────────────

class Ingredient(models.Model):
    """Kitchen ingredient with stock (e.g. flour, oil). Scoped by salle."""
    nom_ingredient = models.CharField(max_length=200)
    unite = models.CharField(max_length=50, default='kg', help_text='kg, L, pièce, etc.')
    stock_actuel = models.DecimalField(max_digits=12, decimal_places=3, default=Decimal('0'))
    seuil_alerte = models.DecimalField(
        max_digits=12, decimal_places=3, null=True, blank=True,
        help_text='Alert when stock_actuel falls below this',
    )
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='ingredients')

    class Meta:
        ordering = ['nom_ingredient']
        unique_together = [['salle', 'nom_ingredient']]

    def __str__(self):
        return f"{self.nom_ingredient} ({self.unite})"


class IngredientMovement(models.Model):
    """Stock in/out for an ingredient. Updates Ingredient.stock_actuel on create."""
    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name='movements',
    )
    quantity_delta = models.DecimalField(max_digits=12, decimal_places=3)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ingredient_movements',
    )
    notes = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            new_stock = self.ingredient.stock_actuel + self.quantity_delta
            self.ingredient.stock_actuel = max(Decimal('0'), new_stock)
            self.ingredient.save(update_fields=['stock_actuel'])

    def __str__(self):
        return f"{self.ingredient} {self.quantity_delta:+}"


class Fournisseur(models.Model):
    """Supplier (fournisseur) for restocking ingredients. Scoped by salle."""
    nom = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    telephone = models.CharField(max_length=50, blank=True)
    adresse = models.CharField(max_length=500, blank=True)
    actif = models.BooleanField(default=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='fournisseurs')

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return self.nom


class CommandeFournisseur(models.Model):
    """Supplier order for restocking ingredients (stock)."""
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('envoyee', 'Envoyée'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
    ]
    fournisseur = models.ForeignKey(
        Fournisseur,
        on_delete=models.CASCADE,
        related_name='commandes',
    )
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='commandes_fournisseur')
    date_commande = models.DateField(auto_now_add=True)
    date_livraison_prevue = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    notes = models.TextField(blank=True)
    livraison_effectuee = models.BooleanField(
        default=False,
        help_text='True once stock movements have been created for this order',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Commande {self.fournisseur} — {self.date_commande}"

    def appliquer_livraison(self, user=None):
        """Create IngredientMovement for each line and mark as delivered. Idempotent."""
        if self.livraison_effectuee:
            return
        for ligne in self.lignes.all().select_related('ingredient'):
            IngredientMovement.objects.create(
                ingredient=ligne.ingredient,
                quantity_delta=ligne.quantite,
                user=user,
                notes=f"Livraison commande fournisseur #{self.id}",
            )
        self.livraison_effectuee = True
        self.statut = 'livree'
        self.save(update_fields=['livraison_effectuee', 'statut', 'updated_at'])


class LigneCommandeFournisseur(models.Model):
    """Line of a supplier order: ingredient + quantity (and optional unit price)."""
    commande = models.ForeignKey(
        CommandeFournisseur,
        on_delete=models.CASCADE,
        related_name='lignes',
    )
    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name='lignes_commande_fournisseur',
    )
    quantite = models.DecimalField(max_digits=12, decimal_places=3)
    prix_unitaire = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text='Prix unitaire optionnel',
    )

    class Meta:
        ordering = ['id']
        unique_together = [['commande', 'ingredient']]

    def __str__(self):
        return f"{self.commande} — {self.ingredient} x {self.quantite}"


# ─── Products ────────────────────────────────────────────────────────────────

class Categorie_Produit(models.Model):
    """Product category."""
    nom_categorie_produit = models.CharField(max_length=200)
    description_categorie_produit = models.TextField(blank=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='categories_produit')

    class Meta:
        ordering = ['nom_categorie_produit']

    def __str__(self):
        return self.nom_categorie_produit


class Produit(models.Model):
    """Product (e.g. beverages, retail)."""
    nom_produit = models.CharField(max_length=200)
    description_produit = models.TextField(blank=True)
    prix_unitaire_produit = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    actif = models.BooleanField(default=True)
    stock_produit = models.PositiveIntegerField(default=0)
    categorie = models.ForeignKey(
        Categorie_Produit,
        on_delete=models.CASCADE,
        related_name='produits'
    )
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='produits')

    class Meta:
        ordering = ['nom_produit']

    def __str__(self):
        return self.nom_produit


class StockMovement(models.Model):
    """Stock adjustment (in/out) for a product. Updates Produit.stock_produit on save."""
    produit = models.ForeignKey(
        Produit,
        on_delete=models.CASCADE,
        related_name='stock_movements',
    )
    quantity_delta = models.IntegerField()  # positive = in, negative = out
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_movements',
    )
    notes = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.produit.stock_produit = max(0, self.produit.stock_produit + self.quantity_delta)
            self.produit.save(update_fields=['stock_produit'])

    def __str__(self):
        return f"{self.produit} {self.quantity_delta:+d}"


# ─── Client & reservations ───────────────────────────────────────────────────

class Client(models.Model):
    """Client/Customer."""
    nom_client = models.CharField(max_length=200)
    prenom_client = models.CharField(max_length=200)
    email_client = models.EmailField(blank=True)
    telephone_client = models.CharField(max_length=50, blank=True)
    adresse_client = models.CharField(max_length=500, blank=True)
    code_postal_client = models.CharField(max_length=20, blank=True)
    ville_client = models.CharField(max_length=100, blank=True)
    pays_client = models.CharField(max_length=100, blank=True)
    date_naissance_client = models.DateField(null=True, blank=True)
    actif = models.BooleanField(default=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='clients')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom_client', 'prenom_client']

    def __str__(self):
        return f"{self.prenom_client} {self.nom_client}"


class Reservation(models.Model):
    """Restaurant reservation (ERD)."""
    STATUT_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('cancelled', 'Annulée'),
        ('arrived', 'Arrivée'),
    ]
    CANAL_CHOICES = [
        ('site', 'Site'),
        ('telephone', 'Téléphone'),
        ('thefork', 'TheFork'),
        ('autre', 'Autre'),
    ]
    date_reservation = models.DateField()
    heure_reservation = models.TimeField()
    nombre_personnes = models.PositiveSmallIntegerField(default=2)
    statut_reservation = models.CharField(max_length=20, choices=STATUT_CHOICES, default='pending')
    canal = models.CharField(max_length=30, choices=CANAL_CHOICES, blank=True)
    notes_reservation = models.TextField(blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='reservations')
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='reservations')
    tables = models.ManyToManyField(
        Table,
        through='Detail_Reservation_Table',
        related_name='reservations',
        blank=True
    )

    class Meta:
        ordering = ['date_reservation', 'heure_reservation']

    def __str__(self):
        return f"{self.client} — {self.date_reservation} {self.heure_reservation}"


class Detail_Reservation_Table(models.Model):
    """Junction: Reservation <-> Table."""
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='lien_tables')
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='lien_reservations')

    class Meta:
        unique_together = [['reservation', 'table']]


# ─── Orders & billing ────────────────────────────────────────────────────────

class Commande(models.Model):
    """Order."""
    STATUT_CHOICES = [
        ('open', 'En cours'),
        ('paid', 'Payée'),
        ('cancelled', 'Annulée'),
    ]
    date_commande = models.DateTimeField(auto_now_add=True)
    statut_commande = models.CharField(max_length=20, choices=STATUT_CHOICES, default='open')
    total_commande = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    notes_commande = models.TextField(blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='commandes'
    )
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='commandes')
    table = models.ForeignKey(
        Table,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commandes'
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commandes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_commande']

    def __str__(self):
        return f"Commande #{self.pk} ({self.date_commande})"

    def recalculer_total_commande(self):
        """Recalcule total_commande à partir de la somme des total_ligne des lignes."""
        from django.db.models import Sum
        result = self.lignes.aggregate(Sum('total_ligne'))
        self.total_commande = result['total_ligne__sum'] or Decimal('0')
        self.save(update_fields=['total_commande', 'updated_at'])


class Ligne_Commande(models.Model):
    """Order line (plat, produit, or formule)."""
    TYPE_ELEMENT_CHOICES = [
        ('plat', 'Plat'),
        ('produit', 'Produit'),
        ('formule', 'Formule'),
    ]
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes')
    plat = models.ForeignKey(
        Plat,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lignes_commande'
    )
    produit = models.ForeignKey(
        Produit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lignes_commande'
    )
    formule = models.ForeignKey(
        Formule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lignes_commande'
    )
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    total_ligne = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    notes_ligne = models.TextField(blank=True)
    type_element = models.CharField(max_length=20, choices=TYPE_ELEMENT_CHOICES)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"Ligne {self.pk} (x{self.quantite})"


class Facture(models.Model):
    """Invoice (one per Commande)."""
    STATUT_CHOICES = [
        ('paid', 'Payée'),
        ('unpaid', 'Impayée'),
        ('overdue', 'En retard'),
    ]
    commande = models.OneToOneField(
        Commande,
        on_delete=models.CASCADE,
        related_name='facture'
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='factures'
    )
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='factures')
    date_facture = models.DateField(auto_now_add=True)
    montant_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    statut_facture = models.CharField(max_length=20, choices=STATUT_CHOICES, default='unpaid')
    tva = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    remise = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    notes_facture = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_facture']

    def __str__(self):
        return f"Facture #{self.pk} ({self.montant_total})"

    def montant_paye(self):
        """Somme des paiements terminés (statut_paiement='completed')."""
        from django.db.models import Sum
        result = self.paiements.filter(statut_paiement='completed').aggregate(Sum('montant_paiement'))
        return result['montant_paiement__sum'] or Decimal('0')

    def recalculer_montant_total(self):
        """Recalcule montant_total à partir de la somme des total_ligne de la commande."""
        from django.db.models import Sum
        result = self.commande.lignes.aggregate(Sum('total_ligne'))
        self.montant_total = result['total_ligne__sum'] or Decimal('0')
        self.save(update_fields=['montant_total', 'updated_at'])

    def recalculer_statut(self):
        """Met à jour statut_facture selon la somme des paiements terminés ; met commande en paid si facture payée."""
        paye = self.montant_paye()
        if paye >= self.montant_total:
            self.statut_facture = 'paid'
            if self.commande.statut_commande != 'cancelled':
                self.commande.statut_commande = 'paid'
                self.commande.save(update_fields=['statut_commande', 'updated_at'])
        else:
            self.statut_facture = 'unpaid'
        self.save(update_fields=['statut_facture', 'updated_at'])


class Paiement(models.Model):
    """Payment against an invoice."""
    MODE_CHOICES = [
        ('cash', 'Espèces'),
        ('card', 'Carte'),
        ('online', 'En ligne'),
        ('other', 'Autre'),
    ]
    STATUT_CHOICES = [
        ('completed', 'Terminé'),
        ('failed', 'Échoué'),
        ('pending', 'En attente'),
    ]
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='paiements')
    montant_paiement = models.DecimalField(max_digits=12, decimal_places=2)
    date_paiement = models.DateTimeField(auto_now_add=True)
    mode_paiement = models.CharField(max_length=20, choices=MODE_CHOICES)
    reference_paiement = models.CharField(max_length=200, blank=True)
    statut_paiement = models.CharField(max_length=20, choices=STATUT_CHOICES, default='completed')

    class Meta:
        ordering = ['-date_paiement']

    def __str__(self):
        return f"Paiement {self.montant_paiement} ({self.mode_paiement})"


# ─── Input/expense (Apport) ──────────────────────────────────────────────────

class Type_Apport(models.Model):
    """Input/expense type."""
    nom_type_apport = models.CharField(max_length=200)
    description_type_apport = models.TextField(blank=True)

    class Meta:
        ordering = ['nom_type_apport']

    def __str__(self):
        return self.nom_type_apport


class Apport(models.Model):
    """Input/expense record per salle."""
    type_apport = models.ForeignKey(Type_Apport, on_delete=models.CASCADE, related_name='apports')
    valeur_apport = models.DecimalField(max_digits=12, decimal_places=2)
    date_apport = models.DateField()
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='apports')

    class Meta:
        ordering = ['-date_apport']

    def __str__(self):
        return f"{self.type_apport} — {self.valeur_apport}"


# ─── Notifications & activity log ────────────────────────────────────────────

class Type_Notification(models.Model):
    """Notification type."""
    nom_type_notification = models.CharField(max_length=200)
    description_type_notification = models.TextField(blank=True)

    class Meta:
        ordering = ['nom_type_notification']

    def __str__(self):
        return self.nom_type_notification


class Notification(models.Model):
    """Notification (per user/salle)."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='notifications')
    type_notification = models.ForeignKey(
        Type_Notification,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message_notification = models.TextField()
    date_notification = models.DateTimeField(auto_now_add=True)
    lue = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_notification']

    def __str__(self):
        return f"{self.type_notification} — {self.message_notification[:50]}"


class Type_Log_Activite(models.Model):
    """Activity log type."""
    nom_type_log_activite = models.CharField(max_length=200)
    description_type_log_activite = models.TextField(blank=True)

    class Meta:
        ordering = ['nom_type_log_activite']

    def __str__(self):
        return self.nom_type_log_activite


class Log_Activite(models.Model):
    """Activity log entry."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs_activite'
    )
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='logs_activite')
    type_log = models.ForeignKey(
        Type_Log_Activite,
        on_delete=models.CASCADE,
        related_name='logs'
    )
    message_log = models.TextField()
    date_log = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-date_log']

    def __str__(self):
        return f"{self.type_log} — {self.date_log}"


# ─── Saved room map (editor JSON) ────────────────────────────────────────────

class RoomMap(models.Model):
    """Saved floor plan (tables, walls, greenery as JSON) — optional link to Salle."""
    name = models.CharField(max_length=200)
    elements = models.JSONField(default=list)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='room_maps'
    )
    salle = models.ForeignKey(
        Salle,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='room_maps'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


# ─── Planning (employees + shifts per day, for Planning page) ─────────────────

class Employee(models.Model):
    """Employee for planning (name, role, weekly hours, color). Optional salle for multi-tenant."""
    nom = models.CharField(max_length=200)
    role = models.CharField(max_length=100)
    initiales = models.CharField(max_length=10, blank=True)
    heures_semaine = models.PositiveSmallIntegerField(null=True, blank=True)
    color = models.CharField(max_length=20, default='#e3f2fd')
    salle = models.ForeignKey(
        Salle,
        on_delete=models.CASCADE,
        related_name='employees',
        null=True,
        blank=True
    )

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return f"{self.nom} ({self.role})"


class PlanningShift(models.Model):
    """One shift slot: employee + date + type (Midi/Soir) + start/end time."""
    TYPE_CHOICES = [
        ('Midi', 'Midi'),
        ('Soir', 'Soir'),
        ('Journée', 'Journée'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shifts')
    date = models.DateField()
    type_shift = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Midi')
    heure_debut = models.CharField(max_length=10)  # e.g. '11:00'
    heure_fin = models.CharField(max_length=10)   # e.g. '15:00'

    class Meta:
        ordering = ['date', 'heure_debut']
        unique_together = [['employee', 'date', 'type_shift']]

    def __str__(self):
        return f"{self.employee.nom} — {self.date} {self.type_shift} {self.heure_debut}-{self.heure_fin}"


class PlanningCapacity(models.Model):
    """Required staff count per salle, day of week (0=Mon..6=Sun), and shift type (Midi/Soir)."""
    TYPE_CHOICES = [
        ('Midi', 'Midi'),
        ('Soir', 'Soir'),
    ]
    salle = models.ForeignKey(
        Salle,
        on_delete=models.CASCADE,
        related_name='planning_capacities',
    )
    day_of_week = models.PositiveSmallIntegerField()  # 0=Monday .. 6=Sunday
    type_shift = models.CharField(max_length=20, choices=TYPE_CHOICES)
    required_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['salle', 'day_of_week', 'type_shift']
        unique_together = [['salle', 'day_of_week', 'type_shift']]

    def __str__(self):
        return f"{self.salle} jour {self.day_of_week} {self.type_shift}: {self.required_count}"


# ─── Legacy / dashboard-only (not in ERD; keep for current UI) ───────────────

class SupplierOrder(models.Model):
    """Supplier product/order line for dashboard widget."""
    produit = models.CharField(max_length=200)
    fournisseur = models.CharField(max_length=200)
    prix = models.CharField(max_length=50)
    variation = models.CharField(max_length=20, default='0%')
    variation_type = models.CharField(max_length=20, default='neutral')
    stock = models.CharField(max_length=50)
    stock_type = models.CharField(max_length=20, default='medium')
    derniere_cmd = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ['produit']

    def __str__(self):
        return f"{self.produit} — {self.fournisseur}"


class TeamShift(models.Model):
    """Team planning shift for planning UI."""
    time = models.CharField(max_length=10)
    role = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='unassigned')

    class Meta:
        ordering = ['time', 'role']

    def __str__(self):
        return f"{self.time} {self.role} — {self.name}"
