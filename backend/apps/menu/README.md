# App Menu

## Description
Gestion des articles (plats, boissons), catégories et composition des articles dans le système Holly PI.

## Modèles de données

### CategorieArticle
```python
{
    "id": Integer (auto-généré),
    "nom": String (max 50 caractères),
    "ordre_affichage": Integer (défaut: 0),
    "description": String (optionnel),
    "restaurant": ForeignKey(Restaurant)
}
```

### Article
```python
{
    "id": Integer (auto-généré),
    "nom": String (max 100 caractères),
    "categorie": ForeignKey(CategorieArticle),
    "prix": Decimal (HT, max 10 chiffres, 2 décimales),
    "description": String (optionnel),
    "disponible": Boolean (défaut: True),
    "taux_tva": ForeignKey(TauxTVA)
}
```

### ArticleIngredient
```python
{
    "id": Integer (auto-généré),
    "article": ForeignKey(Article),
    "ingredient": ForeignKey(Ingredient),
    "quantite_necessaire": Decimal (max 10 chiffres, 2 décimales)
}
```

## Fonctionnalités

### Catégories
- **ordre_affichage** : Permet d'ordonner l'affichage des catégories dans le menu
- **unique_together** : (nom, restaurant) - Un nom de catégorie est unique par restaurant

### Articles
- **Prix HT** : Le prix est stocké hors taxes
- **Prix TTC** : Calculé automatiquement via la propriété `prix_ttc` avec le taux de TVA
- **Disponibilité** : Vérifiée automatiquement selon les stocks d'ingrédients
- **Indexation** : Optimisée pour les recherches par catégorie, disponibilité et prix

### Composition des articles
- Un article peut contenir plusieurs ingrédients
- Chaque relation stocke la quantité nécessaire d'ingrédient
- Contrainte unique : un ingrédient ne peut apparaître qu'une fois par article

## Règles métier

### Disponibilité automatique
La méthode `verifier_disponibilite()` vérifie :
- Si tous les ingrédients sont en stock
- Si les quantités en stock sont suffisantes (> seuil_alerte)

### Calcul du prix TTC
```python
prix_ttc = prix * taux_tva.coefficient_tva
```

Exemple : 
- Prix HT : 10.00€
- TVA 20% (coefficient 1.20)
- Prix TTC : 12.00€

## Structure de la base

### Indexes
Optimisations pour :
- Recherche par catégorie et disponibilité
- Filtrage des articles disponibles
- Calculs de TVA
- Recherche par nom

### Relations
- CategorieArticle → Restaurant (CASCADE)
- Article → CategorieArticle (PROTECT)
- Article → TauxTVA (PROTECT)
- ArticleIngredient → Article (CASCADE)
- ArticleIngredient → Ingredient (CASCADE)

## Notes importantes

1. **Gestion des stocks** : La disponibilité est liée aux stocks d'ingrédients
2. **TVA** : Le taux par défaut est 20% (taux normal)
3. **Suppression** : Les catégories et taux TVA sont protégés contre la suppression si utilisés
4. **Ordering** : Les articles sont automatiquement ordonnés par catégorie puis par nom

