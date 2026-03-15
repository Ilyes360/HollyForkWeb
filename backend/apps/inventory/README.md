# App Inventory

## Description
Gestion des ingrédients, stocks et réapprovisionnements dans le système Holly PI. Utilise la méthode du Coût Moyen Pondéré (CMP) pour la valorisation des stocks.

## Modèles de données

### Ingredient
```python
{
    "id": Integer (auto-généré),
    "nom": String (max 100 caractères),
    "unite": String (max 50 caractères) (ex: "kg", "L", "unité"),
    "prix_unitaire": Decimal (max 10 chiffres, 2 décimales, optionnel)
}
```

### Stock
```python
{
    "id": Integer (auto-généré),
    "restaurant": ForeignKey(Restaurant),
    "ingredient": ForeignKey(Ingredient),
    "quantite_en_stock": Decimal (défaut: 0),
    "seuil_alerte": Decimal (défaut: 0),
    "cout_moyen_pondere": Decimal (max 10 chiffres, 4 décimales)
}
```

### Reapprovisionnement
```python
{
    "id": Integer (auto-généré),
    "restaurant": ForeignKey(Restaurant),
    "ingredient": ForeignKey(Ingredient),
    "quantite_ajoutee": Decimal (max 10 chiffres, 2 décimales),
    "date_ajout": DateTime (auto-généré),
    "prix_achat": Decimal (prix total du lot, max 10 chiffres, 2 décimales)
}
```

## Gestion du Coût Moyen Pondéré (CMP)

### Principe
Le CMP est recalculé automatiquement à chaque réapprovisionnement :

```
Nouveau CMP = (Valeur stock actuel + Valeur nouvel achat) / Quantité totale
```

### Exemple
Stock initial :
- 100 kg à 5€/kg = 500€

Réapprovisionnement :
- 50 kg à 6€/kg = 300€

Nouveau CMP :
```
CMP = (500€ + 300€) / (100kg + 50kg) = 800€ / 150kg = 5.33€/kg
```

### Méthode : `mettre_a_jour_cout_moyen_pondere()`
```python
def mettre_a_jour_cout_moyen_pondere(quantite_ajoutee, prix_achat_total_lot):
    prix_achat_unitaire = prix_achat_total_lot / quantite_ajoutee
    ancienne_valeur_stock = quantite_en_stock * cout_moyen_pondere
    valeur_ajout = quantite_ajoutee * prix_achat_unitaire
    nouvelle_quantite_totale = quantite_en_stock + quantite_ajoutee
    
    cout_moyen_pondere = (ancienne_valeur_stock + valeur_ajout) / nouvelle_quantite_totale
```

## Gestion des alertes de stock

### Méthode : `est_en_rupture()`
```python
def est_en_rupture():
    return quantite_en_stock <= seuil_alerte
```

Retourne `True` si le stock est en dessous ou égal au seuil d'alerte.

## Cache des stocks

### Optimisation des performances
La classe `Stock` utilise Redis pour mettre en cache les données fréquemment consultées.

### Méthode : `get_stocks_cache(restaurant_id, ingredient_ids=None)`
```python
# Récupère les stocks avec cache (TTL: 5 minutes)
stocks = Stock.get_stocks_cache(restaurant_id=1, ingredient_ids=[1, 2, 3])
```

### Invalidation du cache
Le cache est automatiquement invalidé lors de :
- Sauvegarde d'un stock
- Réapprovisionnement
- Modification de quantité

## Workflow de réapprovisionnement

1. **Création d'un Reapprovisionnement** :
   ```python
   reappro = Reapprovisionnement(
       restaurant=restaurant,
       ingredient=ingredient,
       quantite_ajoutee=50,
       prix_achat=300  # Prix total du lot
   )
   reappro.save()
   ```

2. **Actions automatiques lors du save()** :
   - Récupération ou création du stock
   - Mise à jour du CMP
   - Ajout de la quantité au stock
   - Invalidation du cache

## Indexes et optimisations

### Stock
- Index composite : `(restaurant, ingredient)` - unique_together
- Index composite : `(restaurant, quantite_en_stock, seuil_alerte)` - pour les alertes
- Index composite : `(ingredient, cout_moyen_pondere)` - pour les calculs CMV
- Index composite : `(restaurant, ingredient, quantite_en_stock)` - pour les requêtes optimisées

### Reapprovisionnement
- Index simple : `restaurant`
- Index simple : `ingredient`
- Tri par défaut : `date_ajout` DESC

## Intégration avec les commandes

Lorsqu'une commande est créée :
1. Les ingrédients nécessaires sont déduits du stock
2. Le CMV (Coût des Marchandises Vendues) est calculé avec le CMP actuel
3. Le stock est mis à jour
4. Le cache est invalidé

## Règles métier

### Contraintes
- Un stock est unique par couple (restaurant, ingredient)
- Le CMP ne peut être négatif
- La quantité en stock ne peut être négative (à gérer dans les views)

### Unités
Les unités des ingrédients doivent être cohérentes :
- Poids : "kg", "g"
- Volume : "L", "cL", "mL"
- Quantité : "unité", "pièce"

## Notes importantes

1. **CMP vs FIFO/LIFO** : Le CMP simplifie la gestion et correspond aux normes comptables françaises
2. **Cache Redis** : Nécessite Redis configuré (voir settings.py - cache 'stocks')
3. **Performance** : Les méthodes de cache permettent de gérer des milliers d'ingrédients efficacement
4. **Atomicité** : Les opérations de stock sont atomiques pour éviter les incohérences
