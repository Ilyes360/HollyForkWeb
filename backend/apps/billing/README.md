# App Billing

## Description
Gestion de la facturation dans le système Holly PI. Création automatique de factures à partir des commandes validées, avec gestion des paiements et calcul détaillé de la TVA.

## Modèles de données

### Facture
```python
{
    "id": Integer (auto-généré),
    "numero": String (numéro unique de facture),
    "date": Date,
    "montant_ht": Decimal (montant hors taxes),
    "montant_ttc": Decimal (montant toutes taxes comprises),
    "montant_tva": Decimal (montant total de TVA),
    "restaurant": ForeignKey(Restaurant),
    "commande": ForeignKey(CommandeHistoric),
    "etat": String (en_attente, payee, annulee),
    "created_at": DateTime,
    "updated_at": DateTime
}
```

### MethodePaiement
```python
{
    "id": Integer (auto-généré),
    "nom": String (max 255 caractères, unique),
    "created_at": DateTime,
    "updated_at": DateTime
}
```

**Exemples :**
- Espèces
- Carte bancaire
- Chèque
- Ticket restaurant
- Virement

### Paiement
```python
{
    "id": Integer (auto-généré),
    "facture": ForeignKey(Facture),
    "methode_paiement": ForeignKey(MethodePaiement),
    "montant": Decimal,
    "created_at": DateTime,
    "updated_at": DateTime
}
```

### LigneFacture
```python
{
    "id": Integer (auto-généré),
    "facture": ForeignKey(Facture, related_name='lignes'),
    "produit": ForeignKey(Article),
    "quantite": Integer,
    "prix_unitaire_ht": Decimal,
    "prix_unitaire_ttc": Decimal,
    "taux_tva": ForeignKey(TauxTVA),
    "created_at": DateTime,
    "updated_at": DateTime
}
```

## États de facture

### en_attente
- Facture créée mais non payée
- Peut être modifiée
- En attente de paiement(s)

### payee
- Facture totalement payée
- Immutable
- Paiements complets enregistrés

### annulee
- Facture annulée
- Archivée
- Aucun paiement attendu

## Calcul automatique de la TVA

### Calcul par ligne
```python
def calculer_tva():
    montant_ht = prix_unitaire_ht * quantite
    montant_tva = montant_ht * (taux_tva.taux / 100)
    return montant_tva

def calculer_montant_ttc():
    montant_ht = prix_unitaire_ht * quantite
    montant_ttc = montant_ht * taux_tva.coefficient_tva
    return montant_ttc
```

### Calcul global de la facture
```python
def calculer_totaux():
    montant_ht = sum(ligne.prix_unitaire_ht * ligne.quantite for ligne in lignes)
    montant_tva = sum(ligne.calculer_tva() for ligne in lignes)
    montant_ttc = montant_ht + montant_tva
```

### TVA par taux
```python
def get_tva_par_taux():
    """
    Retourne la TVA groupée par taux
    Exemple: {20.0: 100.00, 10.0: 50.00, 5.5: 25.00}
    """
    tva_par_taux = defaultdict(Decimal)
    for ligne in lignes:
        taux = ligne.taux_tva.taux
        montant_tva = ligne.calculer_tva()
        tva_par_taux[taux] += montant_tva
    return dict(tva_par_taux)
```

## Exemple de facture

### Données
```
Article 1 : Pizza Margherita
- Prix HT : 10.00€
- TVA : 10% (restauration)
- Quantité : 2
- Total HT : 20.00€
- Total TVA : 2.00€
- Total TTC : 22.00€

Article 2 : Vin rouge
- Prix HT : 15.00€
- TVA : 20% (boisson alcoolisée)
- Quantité : 1
- Total HT : 15.00€
- Total TVA : 3.00€
- Total TTC : 18.00€

FACTURE :
---------
Total HT  : 35.00€
TVA 10%   : 2.00€
TVA 20%   : 3.00€
Total TVA : 5.00€
Total TTC : 40.00€
```

## Gestion des paiements

### Paiement unique
```python
paiement = Paiement.objects.create(
    facture=facture,
    methode_paiement=methode_cb,
    montant=40.00
)
facture.etat = 'payee'
facture.save()
```

### Paiements multiples (split payment)
```python
# Paiement 1 : CB
Paiement.objects.create(
    facture=facture,
    methode_paiement=methode_cb,
    montant=30.00
)

# Paiement 2 : Espèces
Paiement.objects.create(
    facture=facture,
    methode_paiement=methode_especes,
    montant=10.00
)

# Vérifier le total des paiements
total_paye = sum(p.montant for p in facture.paiements.all())
if total_paye >= facture.montant_ttc:
    facture.etat = 'payee'
    facture.save()
```

## Workflow de facturation

### 1. Création de la facture
```python
# Automatique après validation d'une commande
commande.statut = 'VALIDEE'
commande.save()
# → Commande archivée dans CommandeHistoric

facture = Facture.objects.create(
    numero=generer_numero_facture(),
    date=date.today(),
    restaurant=restaurant,
    commande=commande_historic,
    etat='en_attente'
)
```

### 2. Création des lignes
```python
for ligne_commande in commande_historic.lignes.all():
    LigneFacture.objects.create(
        facture=facture,
        produit=ligne_commande.article,
        quantite=ligne_commande.quantite,
        prix_unitaire_ht=ligne_commande.prix_unitaire / taux_tva.coefficient_tva,
        prix_unitaire_ttc=ligne_commande.prix_unitaire,
        taux_tva=ligne_commande.article.taux_tva
    )
```

### 3. Calcul des totaux
```python
facture.calculer_totaux()
facture.save()
```

### 4. Enregistrement des paiements
```python
paiement = Paiement.objects.create(
    facture=facture,
    methode_paiement=methode_paiement,
    montant=montant_paye
)
```

### 5. Mise à jour de l'état
```python
total_paye = facture.paiements.aggregate(Sum('montant'))['montant__sum']
if total_paye >= facture.montant_ttc:
    facture.etat = 'payee'
    facture.save()
```

## Indexes et performances

### Facture
- `(restaurant, date)` - factures par restaurant et date
- `(restaurant, etat)` - factures par restaurant et état
- `(date, etat)` - analyses temporelles
- `(numero, restaurant)` - recherche de factures

### Paiement
- `(facture, created_at)` - historique des paiements
- `(methode_paiement, created_at)` - statistiques par méthode

### LigneFacture
- `(facture, produit)` - détails de facture
- `(produit, taux_tva)` - calculs de TVA

## Numérotation des factures

### Format recommandé
```
FA-{ANNEE}-{RESTAURANT_ID}-{SEQUENCE}
```

Exemples :
- FA-2025-001-00001
- FA-2025-001-00002
- FA-2025-002-00001

### Implémentation
```python
def generer_numero_facture(restaurant_id):
    annee = date.today().year
    last_facture = Facture.objects.filter(
        restaurant_id=restaurant_id,
        numero__startswith=f'FA-{annee}-{restaurant_id:03d}'
    ).order_by('-numero').first()
    
    if last_facture:
        last_seq = int(last_facture.numero.split('-')[-1])
        seq = last_seq + 1
    else:
        seq = 1
    
    return f'FA-{annee}-{restaurant_id:03d}-{seq:05d}'
```

## Règles comptables

### TVA en restauration (France)
- **TVA 10%** : Consommation sur place (sauf alcool)
- **TVA 20%** : Boissons alcoolisées
- **TVA 5.5%** : Produits alimentaires à emporter

### Conservation
Les factures doivent être conservées **10 ans** selon la législation française.

### Mentions obligatoires
- Numéro unique
- Date d'émission
- Identification du vendeur (SIRET)
- Détail des produits/services
- Montants HT, TVA et TTC par taux
- Mode(s) de paiement

## Exports et rapports

### Livre des recettes
```python
def livre_recettes(restaurant_id, date_debut, date_fin):
    return Facture.objects.filter(
        restaurant_id=restaurant_id,
        date__range=(date_debut, date_fin),
        etat='payee'
    ).order_by('date', 'numero')
```

### Déclaration de TVA
```python
def declaration_tva(restaurant_id, mois, annee):
    factures = Facture.objects.filter(
        restaurant_id=restaurant_id,
        date__year=annee,
        date__month=mois,
        etat='payee'
    )
    
    tva_collectee = {}
    for facture in factures:
        tva_par_taux = facture.get_tva_par_taux()
        for taux, montant in tva_par_taux.items():
            tva_collectee[taux] = tva_collectee.get(taux, 0) + montant
    
    return tva_collectee
```

## Notes importantes

1. **Lien avec CommandeHistoric** : Seules les commandes archivées peuvent générer une facture
2. **Immutabilité** : Les factures payées ne doivent pas être modifiées
3. **Paiements multiples** : Une facture peut avoir plusieurs paiements
4. **TVA différenciée** : Chaque ligne peut avoir un taux de TVA différent
5. **Calculs automatiques** : Les totaux sont recalculés automatiquement à chaque modification des lignes

