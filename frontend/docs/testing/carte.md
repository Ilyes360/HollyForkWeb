# Carte/Menu — Detail couverture

> Sous-features : 6a (Editeur), 6b (Operationnelle)

## 6a. Carte Editeur (Standard)

### Hooks

| Hook | C1 | Tests | Fichier test |
|------|:--:|-------|-------------|
| useArticles() | ❌ | — | — |
| useArticle() | ❌ | — | — |
| useCreateArticle() | ❌ | — | — |
| useCategories() | ❌ | — | — |
| useCreateCategory() | ❌ | — | — |
| useUpdateCategory() | ❌ | — | — |
| useArticleIngredients() | ❌ | — | Partage avec Stocks |
| useAddArticleIngredient() | ❌ | — | — |
| useDeleteArticleIngredient() | ❌ | — | — |

### Utils (components/carte/utils.ts)

| Fonction | Teste | Tests | Fichier test |
|----------|:-----:|-------|-------------|
| getMaterialCost() | ❌ | — | pure function |
| getFoodCostPercent() | ❌ | — | pure function |
| getGrossMargin() | ❌ | — | pure function |
| getFoodCostColor() | ❌ | — | pure function |
| getMissingIngredients() | ❌ | — | pure function |
| isFeasible() | ❌ | — | pure function |
| getMaxPortions() | ❌ | — | pure function |
| getRecipesImpactedByAlerts() | ❌ | — | pure function |
| getLimitingIngredientName() | ❌ | — | pure function |
| getPortionGaugeColor() | ❌ | — | pure function |
| getPortionGaugePercent() | ❌ | — | pure function |

### Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| AddRecipeDialog | ❌ | ❌ | Formulaire creation recette |
| RecipeDetailModal | ❌ | ❌ | Modale detail |
| CarteRecipeCard | ❌ | ❌ | Card recette |
| CategorySection | ❌ | ❌ | Section par categorie |
| CarteFilters | ❌ | ❌ | Filtres |
| CarteHeader | ❌ | ❌ | Header + actions |
| CarteKpis | ❌ | ❌ | KPIs lecture seule |
| CarteProductSidebar | ❌ | ❌ | Sidebar produit |
| IngredientCombobox | ❌ | ❌ | Combobox recherche |

---

## 6b. Carte Operationnelle (Standard)

### Composants

| Composant | C2 | C4 a11y | Notes |
|-----------|:--:|:-------:|-------|
| OperationalToolbar | ❌ | ❌ | Toolbar POS |
| OperationalProductPanel | ❌ | ❌ | Panel produit |
| OperationalBreadcrumb | ❌ | ❌ | Navigation |
| CarteOperationalProvider | ❌ | ❌ | Context provider |

## Tests existants (hors feature)

| Fichier test | Type | Tests |
|-------------|------|-------|
| copy/carte-copy.test.ts | Copy | Textes UI carte |
