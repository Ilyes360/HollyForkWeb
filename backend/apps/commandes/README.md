# App Commandes

## Description
Gestion des commandes en cours et de l'historique des commandes dans le système Holly PI. Inclut le calcul automatique du Coût des Marchandises Vendues (CMV).

## Modèles de données

### Commande (En cours)
```python
{
    "id": Integer (auto-généré),
    "nb_articles": Integer (défaut: 0),
    "montant": Decimal (max 10 chiffres, 2 décimales),
    "created_at": DateTime,
    "created_by": ForeignKey(Employe),
    "restaurant": ForeignKey(Restaurant),
    "statut": String (EN_COURS, VALIDEE, ANNULEE),
    "statut_cuisine": String (PENDING, IN_PROGRESS, READY, SERVED, CANCELLED),
    "priorite": String (LOW, NORMAL, HIGH, URGENT),
    "table": ForeignKey(Table, optionnel),
    "cout_total_marchandises_vendues": Decimal (CMV total)
}
```

### LigneCommande
```python
{
    "id": Integer (auto-généré),
    "commande": ForeignKey(Commande),
    "article": ForeignKey(Article),
    "quantite": Integer (défaut: 1),
    "prix_unitaire": Decimal (prix au moment de la commande),
    "cout_marchandise_vendue": Decimal (CMV pour cette ligne),
    "en_attente_service": Boolean (true si l'article est mis en attente de service, ex: dessert commandé à l'entrée)
}
```

### CommandeHistoric (Archivage)
```python
{
    "id": Integer (auto-généré, même ID que la commande originale),
    "nb_articles": Integer,
    "montant": Decimal,
    "created_at": DateTime (date de création originale),
    "created_by": ForeignKey(Employe, PROTECT),
    "restaurant": ForeignKey(Restaurant, PROTECT),
    "statut": String (VALIDEE ou ANNULEE),
    "table": ForeignKey(Table),
    "cout_total_marchandises_vendues": Decimal,
    "archived_at": DateTime (date d'archivage)
}
```

### LigneCommandeHistoric
```python
{
    "id": Integer (auto-généré),
    "commande": ForeignKey(CommandeHistoric),
    "article": ForeignKey(Article, PROTECT),
    "quantite": Integer,
    "prix_unitaire": Decimal,
    "cout_marchandise_vendue": Decimal
}
```

## Statuts de commande

### Statut général (statut)
#### EN_COURS
- Commande en cours de préparation
- Peut être modifiée (ajout/suppression de lignes)
- Stock déduit au fur et à mesure de l'ajout des lignes

#### VALIDEE
- Commande terminée et validée
- Archivée automatiquement dans `CommandeHistoric`
- Supprimée de la table `Commande`
- Stock définitivement déduit

#### ANNULEE
- Commande annulée
- Stock restauré automatiquement
- Archivée dans `CommandeHistoric`
- CMV mis à 0

### Statut cuisine (statut_cuisine)
#### PENDING
- Commande en attente en cuisine
- Par défaut lors de la création

#### IN_PROGRESS
- Commande en cours de préparation en cuisine

#### READY
- Commande prête à être servie

#### SERVED
- Commande servie au client

#### CANCELLED
- Commande annulée en cuisine

### Priorité (priorite)
#### LOW
- Priorité basse

#### NORMAL
- Priorité normale (par défaut)

#### HIGH
- Priorité haute

#### URGENT
- Priorité urgente

## Gestion automatique des stocks

### Ajout d'une ligne de commande
```python
# Lors du save() de LigneCommande
for article_ingredient in article.ingredients.all():
    stock.quantite_en_stock -= (article_ingredient.quantite_necessaire * ligne.quantite)
    stock.save()
```

### Annulation d'une commande
```python
# Lors de l'appel à commande.annuler()
for ligne in commande.lignes.all():
    for article_ingredient in ligne.article.ingredients.all():
        stock.quantite_en_stock += (article_ingredient.quantite_necessaire * ligne.quantite)
        stock.save()
```

### Suppression d'une ligne
Le stock est restauré automatiquement lors de la suppression d'une ligne de commande.

## Calcul du CMV (Coût des Marchandises Vendues)

### CMV d'une ligne de commande
```python
def calculer_cmv_ligne(stocks_cache=None):
    cmv_total = 0
    for article_ingredient in article.ingredients.all():
        cout_ingredient = stock.cout_moyen_pondere
        cmv_ingredient = article_ingredient.quantite_necessaire * cout_ingredient
        cmv_total += cmv_ingredient
    
    return cmv_total * quantite
```

### CMV de la commande
```python
def calculer_montant_et_cmv():
    montant_total = sum(ligne.prix_unitaire * ligne.quantite for ligne in lignes)
    cmv_total = sum(ligne.cout_marchandise_vendue for ligne in lignes)
    nb_articles = sum(ligne.quantite for ligne in lignes)
```

### Exemple
Article : Pizza Margherita (Prix : 12€)
- Farine : 0.3 kg × 2€/kg = 0.60€
- Tomate : 0.2 kg × 3€/kg = 0.60€
- Fromage : 0.15 kg × 10€/kg = 1.50€

**CMV de la pizza = 2.70€**  
**Marge = 12€ - 2.70€ = 9.30€ (77.5%)**

## Gestion des tables

### Association table-commande
- Une commande peut être associée à une table
- La table passe automatiquement à `is_occupied = True`
- Lors de la validation/annulation, la table est libérée

### Changement de table
Si la table change :
- Ancienne table libérée (`is_occupied = False`)
- Nouvelle table occupée (`is_occupied = True`)

### Déplacement d'une ligne vers une table sans commande

- L'endpoint `POST /api/lignes-commandes/{id}/deplacer/` accepte un body `{"table_id": <id>}`.
- Si la table cible n'a **aucune commande EN_COURS**, le système :
  - crée automatiquement une nouvelle `Commande` EN_COURS sur cette table (même restaurant, même employé `created_by` que la commande source de la ligne),
  - déplace la ligne vers cette nouvelle commande,
  - retourne les informations à jour de la ligne (incluant le lien vers la nouvelle commande).

## Archivage automatique

### Déclenchement
Lorsqu'une commande passe au statut `VALIDEE` ou `ANNULEE` :
1. Création d'une copie dans `CommandeHistoric`
2. Copie de toutes les lignes dans `LigneCommandeHistoric`
3. Suppression de la commande originale

### Protection des données
- `on_delete=PROTECT` pour les ForeignKeys dans l'historique
- Empêche la suppression accidentelle d'employés ou restaurants liés à l'historique

## Manager personnalisé : CommandeManager

### Méthodes d'optimisation

#### `get_optimized_queryset()`
Précharge toutes les relations nécessaires pour éviter les requêtes N+1.

#### `with_stock_data(restaurant_id)`
Inclut les données de stock dans le queryset pour les calculs de CMV.

#### `by_restaurant(restaurant_id, statut, limit_days)`
Récupère les commandes d'un restaurant avec filtres.

#### `en_cours_par_restaurant(restaurant_id)`
Raccourci pour récupérer uniquement les commandes en cours.

#### `bulk_calculate_totals(commande_ids)`
Calcule les totaux pour plusieurs commandes en lot (optimisé).

### Exemple d'utilisation
```python
# Récupérer les commandes en cours avec optimisation
commandes = Commande.objects.en_cours_par_restaurant(restaurant_id=1)

# Récupérer les commandes des 7 derniers jours
commandes = Commande.objects.by_restaurant(
    restaurant_id=1,
    statut='VALIDEE',
    limit_days=7
)

# Recalculer les totaux en lot
Commande.objects.bulk_calculate_totals([1, 2, 3, 4, 5])
```

## Indexes et performances

### Indexes composites (Commande)
- `(restaurant, created_at)` - liste chronologique par restaurant
- `(restaurant, statut)` - filtrage par statut
- `(created_by, created_at)` - commandes par employé
- `(restaurant, statut, created_at)` - requêtes combinées
- `(statut, created_at)` - statistiques globales

### Indexes composites (LigneCommande)
- `(commande, article)` - détails de commande
- `(article, prix_unitaire)` - analyse des ventes
- `(commande, quantite)` - calculs de totaux
- `(article, quantite, prix_unitaire)` - analyses avancées
- `(commande, cout_marchandise_vendue)` - calculs CMV
- `(commande, en_attente_service)` - filtrage rapide des lignes en attente

## Mise en attente d'un article (logique dessert / plus tard)

- Lors de la création d'une `LigneCommande`, il est possible d'indiquer que l'article est **commandé mais à servir plus tard** (par exemple un dessert demandé au moment de l'entrée) en passant `en_attente_service=true`.
- Côté service/cuisine ou UI, il suffit ensuite :
  - soit de filtrer les lignes avec `en_attente_service=false` pour n'afficher que les articles à préparer/servir maintenant,
  - soit de faire un `PATCH` sur la ligne concernée pour mettre `en_attente_service=false` lorsque le client demande finalement l'article.

## Workflow complet

### 1. Création d'une commande
```python
commande = Commande.objects.create(
    restaurant=restaurant,
    created_by=employe,
    table=table,
    statut='EN_COURS'
)
```

### 2. Ajout d'articles
```python
ligne = LigneCommande.objects.create(
    commande=commande,
    article=article,
    quantite=2
)
# Prix et CMV calculés automatiquement
# Stock déduit automatiquement
# Totaux de la commande mis à jour
```

### 3. Validation de la commande
```python
commande.statut = 'VALIDEE'
commande.save()
# Archivage automatique dans CommandeHistoric
# Table libérée automatiquement
```

### 4. Ou annulation
```python
commande.annuler()
# Stock restauré
# CMV mis à 0
# Statut = 'ANNULEE'
# Archivage automatique
```

## Règles métier

### Prix figé
Le prix unitaire est enregistré au moment de l'ajout de la ligne, même si le prix de l'article change par la suite.

### CMV figé
Le CMV est calculé et figé au moment de l'ajout de la ligne, basé sur le CMP actuel des stocks.

### Intégrité référentielle
- Restaurant associé automatiquement si table spécifiée
- Date de création définie automatiquement si non fournie

## Endpoints Cuisine

### GET /api/commandes/kitchen/orders/
Récupère les commandes pour la cuisine avec filtres.

**Paramètres de requête:**
- `restaurant_id` (requis) - ID du restaurant
- `service` (optionnel) - 'midi' ou 'soir'
- `date` (optionnel) - Format YYYY-MM-DD
- `statut_cuisine` (optionnel) - PENDING, IN_PROGRESS, READY, SERVED, CANCELLED
- `priorite` (optionnel) - LOW, NORMAL, HIGH, URGENT

**Exemple:**
```bash
GET /api/commandes/kitchen/orders/?restaurant_id=1&service=soir&date=2025-01-20&statut_cuisine=PENDING
```

### PATCH /api/commandes/{id}/kitchen/update-status/
Met à jour le statut cuisine et/ou la priorité d'une commande.

**Body (JSON):**
```json
{
    "statut_cuisine": "IN_PROGRESS",
    "priorite": "HIGH"
}
```

### POST /api/commandes/{id}/kitchen/print/
Simule l'impression d'un ticket de commande pour la cuisine.

## Notes importantes

1. **Performance** : Utilisez toujours les méthodes du Manager pour éviter les requêtes N+1
2. **Cache** : Les calculs de CMV utilisent le cache Redis des stocks
3. **Atomicité** : Les opérations de modification de stock sont atomiques
4. **Historique** : L'historique est immuable et protégé contre les suppressions
5. **Tables** : La gestion de l'occupation des tables est automatique
6. **Cuisine** : Les champs `statut_cuisine` et `priorite` sont indexés pour des requêtes rapides
