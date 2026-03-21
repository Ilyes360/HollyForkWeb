# Plan d'implémentation — Cuisine / Stocks / Fournisseurs v2

## Vision produit

**Principe fondamental :** le restaurateur pense en portions, pas en kilos. L'unité universelle de l'interface est la **portion réalisable** — le pont entre stock et carte.

**3 vues, 3 questions :**
- **Ma carte** → "Qu'est-ce que je peux servir ce soir ?"
- **Mon stock** → "Qu'est-ce qu'il me reste et pour combien de plats ?"
- **Commandes** → "Qu'est-ce que j'ai commandé et qu'est-ce qui arrive ?"

**Le fournisseur** n'a pas de page dédiée — il vit partout où il est pertinent (fiche produit, fiche recette, dialog commande).

**Approche non-prescriptive :** l'app montre l'information clairement, le restaurateur décide. Pas d'alertes "commandez maintenant", pas de centre d'action. "0 portions" est un fait, pas un ordre.

**Fiches sur-mesure :** chaque type d'entité (recette, produit, fournisseur) a une fiche adaptée à la question que le restaurateur se pose quand il l'ouvre. Principe commun : montrer les connexions "flux amont / flux aval".

| Fiche | Flux amont | Flux aval |
|-------|-----------|-----------|
| Recette | Ingrédients (produit + fournisseur + stock) | — (bout de chaîne) |
| Produit | Fournisseur (contact + commander) | Recettes (portions possibles) + mini-graphe |
| Fournisseur | — (source de chaîne) | Produits fournis (stock + portions) |

---

## Architecture cible

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Sidebar                                                                │
│                                                                         │
│  ├── Ma carte        → /carte           (vue recettes en portions)     │
│  │   ├──                /carte/nouvelle                                 │
│  │   └──                /carte/:id/modifier                             │
│  │                                                                      │
│  ├── Mon stock       → /stock           (vue produits + équiv portions)│
│  │   ├──                /stock/nouveau                                  │
│  │   ├──                /stock/:id/modifier                             │
│  │   └──                /stock/configuration                            │
│  │                                                                      │
│  └── Commandes       → /commandes       (en cours + historique)        │
│                                                                         │
│  Pages supprimées :                                                     │
│  ✗ /cuisine          → renommé /carte                                  │
│  ✗ /stocks           → renommé /stock                                  │
│  ✗ /fournisseurs     → absorbé dans /stock et /commandes               │
│  ✗ /fournisseurs/:id → devient sheet fournisseur (accessible partout)  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Arbre de composants cible

```
src/components/carte/                    ← renommé depuis cuisine/
├── types.ts                             // MODIFIÉ — ajout PortionInfo
├── utils.ts                             // MODIFIÉ — getPortionsByIngredient, getLimitingIngredient
├── data.ts                              // MODIFIÉ — enrichir les recettes
├── carte-header.tsx                     // MODIFIÉ — renommé depuis cuisine-header
├── carte-category-section.tsx           // NOUVEAU — section par catégorie (Entrées, Plats, etc.)
├── recipe-card.tsx                      // MODIFIÉ — redesign centré portions
├── recipe-detail-sheet.tsx              // NOUVEAU — fiche sur-mesure recette (remplace recipe-detail)
├── recipe-ingredient-row.tsx            // NOUVEAU — ligne ingrédient avec stock + fournisseur
├── recipe-simulator.tsx                 // NOUVEAU — simulateur food cost / prix
├── ingredient-combobox.tsx              // INCHANGÉ
└── add-recipe-dialog.tsx                // INCHANGÉ (utilisé par /carte/nouvelle)

src/components/stock/                    ← renommé depuis stocks/
├── types.ts                             // MODIFIÉ — ajout PortionEquivalent
├── utils.ts                             // MODIFIÉ — getPortionEquivalents, getLimitingRecipes
├── data.ts                              // INCHANGÉ
├── stock-header.tsx                     // MODIFIÉ — renommé depuis stocks-header
├── stock-table.tsx                      // MODIFIÉ — colonne "Équiv. portions" + redesign
├── product-detail-sheet.tsx             // NOUVEAU — fiche sur-mesure produit (remplace product-detail)
├── product-flow-graph.tsx               // NOUVEAU — mini-graphe fournisseur→produit→recettes
├── product-card.tsx                     // MODIFIÉ — redesign avec portions
├── storage-zones.tsx                    // INCHANGÉ
├── add-product-dialog.tsx               // INCHANGÉ
└── product-icons.ts                     // INCHANGÉ

src/components/commandes/                ← NOUVEAU dossier
├── types.ts                             // EXTRAIT depuis fournisseurs/types.ts
├── commandes-header.tsx                 // NOUVEAU
├── pending-orders.tsx                   // NOUVEAU — commandes en cours avec actions
├── order-history-table.tsx              // NOUVEAU — historique filtrable
├── order-dialog.tsx                     // MODIFIÉ — repris de fournisseurs/, amélioré
├── receive-order-dialog.tsx             // NOUVEAU — réception avec ajustement quantités
└── order-summary-bar.tsx                // NOUVEAU — total mois + fournisseurs actifs

src/components/shared/
├── supplier-popover.tsx                 // NOUVEAU — popover fournisseur (contact + commander)
├── supplier-sheet.tsx                   // NOUVEAU — fiche sur-mesure fournisseur (full sheet)
└── portion-gauge.tsx                    // NOUVEAU — jauge portions réutilisable

src/hooks/
├── use-portion-calculator.ts            // NOUVEAU — calcul portions central
└── use-table-sort.ts                    // INCHANGÉ

src/stores/
├── inventory-store.ts                   // MODIFIÉ — ajout selectors portions
└── recipe-store.ts                      // INCHANGÉ

src/pages/
├── carte.tsx                            // NOUVEAU — remplace cuisine.tsx
├── carte-recipe.tsx                     // MODIFIÉ — renommé depuis cuisine-recipe.tsx
├── stock.tsx                            // NOUVEAU — remplace stocks.tsx
├── stock-product.tsx                    // MODIFIÉ — renommé depuis stocks-product.tsx
├── stock-configuration.tsx              // MODIFIÉ — renommé depuis stocks/configuration.tsx
└── commandes.tsx                        // NOUVEAU — remplace fournisseurs.tsx
```

---

## PHASE 1 — Fondations : types, utils et hooks de calcul de portions (~2-3 jours)

### 1.1 Nouveau type PortionInfo

**Fichier : `src/components/carte/types.ts`**

Ajouts au fichier existant :

```ts
// === AJOUTS ===

// Résultat du calcul de portions pour un ingrédient d'une recette
interface IngredientPortionInfo {
  productId: string
  productName: string
  quantityPerPortion: number      // quantité nécessaire par portion
  unit: ProductUnit
  currentStock: number            // stock actuel du produit
  maxPortions: number             // combien de portions ce stock permet
  isLimiting: boolean             // true si c'est l'ingrédient qui limite
  supplierId: string
  supplierName: string
}

// Résultat du calcul de portions pour une recette complète
interface RecipePortionInfo {
  recipeId: string
  totalPortions: number           // = min(maxPortions) de tous les ingrédients
  limitingIngredient: IngredientPortionInfo | null  // l'ingrédient qui plafonne
  ingredients: IngredientPortionInfo[]
  materialCost: number
  foodCostPercent: number
  grossMargin: number
}
```

Les types existants (`Recipe`, `RecipeIngredient`, `RecipeCategory`, etc.) restent **inchangés**.

---

### 1.2 Nouveau type PortionEquivalent

**Fichier : `src/components/stock/types.ts`**

Ajouts au fichier existant :

```ts
// === AJOUTS ===

// Pour un produit donné, combien de portions de chaque recette son stock permet
interface PortionEquivalent {
  recipeId: string
  recipeName: string
  recipeCategory: RecipeCategory
  quantityPerPortion: number      // combien de ce produit par portion de la recette
  unit: ProductUnit
  maxPortions: number             // stock actuel / quantityPerPortion
  isLimitingForRecipe: boolean    // ce produit est-il le facteur limitant de cette recette ?
}

// Résultat complet pour un produit
interface ProductPortionSummary {
  productId: string
  equivalents: PortionEquivalent[]
  // La recette pour laquelle ce produit est le plus "critique"
  // (celle où il est limitant ET qui a le moins de portions)
  mostCriticalRecipe: PortionEquivalent | null
}
```

Les types existants (`Product`, `ProductStatus`, etc.) restent **inchangés**.

---

### 1.3 Hook central de calcul de portions

**Nouveau fichier : `src/hooks/use-portion-calculator.ts`**

Ce hook est le cœur de la nouvelle architecture. Il croise recettes et produits pour produire toutes les données de portions.

```ts
interface UsePortionCalculatorReturn {
  // Par recette
  getRecipePortions: (recipeId: string) => RecipePortionInfo | null
  getAllRecipePortions: () => RecipePortionInfo[]

  // Par produit
  getProductPortions: (productId: string) => ProductPortionSummary
  getAllProductPortions: () => ProductPortionSummary[]

  // Agrégats
  totalActiveRecipes: number
  totalFeasibleRecipes: number        // portions > 0
  totalConstrainedRecipes: number     // portions > 0 mais < seuil (ex: < 10)
  totalUnfeasibleRecipes: number      // portions === 0
  averageFoodCost: number
}

function usePortionCalculator(): UsePortionCalculatorReturn
```

**Implémentation :**

```ts
function usePortionCalculator(): UsePortionCalculatorReturn {
  const { products, suppliers } = useInventoryStore()
  const { recipes } = useRecipeStore()

  // Mémoïsé car utilisé par les deux vues (carte et stock)
  const recipePortionsMap = useMemo(() => {
    const map = new Map<string, RecipePortionInfo>()

    for (const recipe of recipes) {
      if (!recipe.isActive) continue

      const ingredients: IngredientPortionInfo[] = recipe.ingredients.map(ing => {
        const product = products.find(p => p.id === ing.productId)
        const supplier = product
          ? suppliers.find(s => s.id === product.supplierId)
          : null

        const maxPortions = product && ing.quantity > 0
          ? Math.floor(product.quantity / ing.quantity)
          : 0

        return {
          productId: ing.productId,
          productName: product?.name ?? "Produit inconnu",
          quantityPerPortion: ing.quantity,
          unit: ing.unit,
          currentStock: product?.quantity ?? 0,
          maxPortions,
          isLimiting: false,  // sera calculé après
          supplierId: product?.supplierId ?? "",
          supplierName: supplier?.name ?? "—",
        }
      })

      // Trouver le minimum de portions (= l'ingrédient limitant)
      const totalPortions = ingredients.length > 0
        ? Math.min(...ingredients.map(i => i.maxPortions))
        : 0

      // Marquer le(s) ingrédient(s) limitant(s)
      for (const ing of ingredients) {
        ing.isLimiting = ing.maxPortions === totalPortions && totalPortions < 50
        // seuil 50 = on ne marque pas de limitant si tout est largement en stock
      }

      const limitingIngredient = ingredients.find(i => i.isLimiting) ?? null

      const materialCost = ingredients.reduce((sum, ing) => {
        const product = products.find(p => p.id === ing.productId)
        return sum + ing.quantityPerPortion * (product?.unitPrice ?? 0)
      }, 0)

      map.set(recipe.id, {
        recipeId: recipe.id,
        totalPortions,
        limitingIngredient,
        ingredients,
        materialCost,
        foodCostPercent: recipe.sellingPrice > 0
          ? (materialCost / recipe.sellingPrice) * 100
          : 0,
        grossMargin: recipe.sellingPrice - materialCost,
      })
    }

    return map
  }, [recipes, products, suppliers])

  const productPortionsMap = useMemo(() => {
    const map = new Map<string, ProductPortionSummary>()

    for (const product of products) {
      const equivalents: PortionEquivalent[] = []

      for (const recipe of recipes) {
        if (!recipe.isActive) continue
        const ing = recipe.ingredients.find(i => i.productId === product.id)
        if (!ing || ing.quantity <= 0) continue

        const maxPortions = Math.floor(product.quantity / ing.quantity)
        const recipeInfo = recipePortionsMap.get(recipe.id)

        equivalents.push({
          recipeId: recipe.id,
          recipeName: recipe.name,
          recipeCategory: recipe.category,
          quantityPerPortion: ing.quantity,
          unit: ing.unit,
          maxPortions,
          isLimitingForRecipe: recipeInfo?.limitingIngredient?.productId === product.id,
        })
      }

      // Trier : les recettes où ce produit est limitant en premier, puis par portions croissantes
      equivalents.sort((a, b) => {
        if (a.isLimitingForRecipe !== b.isLimitingForRecipe) {
          return a.isLimitingForRecipe ? -1 : 1
        }
        return a.maxPortions - b.maxPortions
      })

      const mostCritical = equivalents.find(e => e.isLimitingForRecipe) ?? null

      map.set(product.id, {
        productId: product.id,
        equivalents,
        mostCriticalRecipe: mostCritical,
      })
    }

    return map
  }, [products, recipes, recipePortionsMap])

  // ... getters et agrégats retournés
}
```

**Performance :** Les deux `useMemo` dépendent de `[recipes, products, suppliers]`. Ils ne recalculent que quand le store change. Les vues `carte` et `stock` consomment le même hook — pas de double calcul.

**Tests unitaires :** voir Phase 5.

---

### 1.4 Extension des utilitaires existants

**Fichier : `src/components/carte/utils.ts`** — ajouts (les fonctions existantes restent inchangées)

```ts
// === AJOUTS ===

// Ingrédient limitant pour affichage sur la carte recette
export function getLimitingIngredientName(
  recipePortionInfo: RecipePortionInfo
): string | null {
  if (!recipePortionInfo.limitingIngredient) return null
  if (recipePortionInfo.totalPortions >= 50) return null  // pas utile si stock confortable
  return recipePortionInfo.limitingIngredient.productName
}

// Couleur de la jauge portions
export function getPortionGaugeColor(portions: number): string {
  if (portions === 0) return "bg-destructive"           // rouge
  if (portions < 5) return "bg-destructive/80"           // rouge atténué
  if (portions < 15) return "bg-amber-500"               // ambre
  return "bg-emerald-500"                                 // vert
}

// Ratio pour la jauge (portions / référence service)
export function getPortionGaugePercent(
  portions: number,
  referencePortions: number = 30  // portions moyennes par service pour une recette
): number {
  return Math.min(100, Math.round((portions / referencePortions) * 100))
}
```

**Fichier : `src/components/stock/utils.ts`** — ajouts

```ts
// === AJOUTS ===

// Formater les équivalents portions pour affichage compact dans la table
export function formatPortionEquivalents(
  equivalents: PortionEquivalent[],
  maxDisplay: number = 3
): { displayed: string[]; remaining: number } {
  const displayed = equivalents
    .slice(0, maxDisplay)
    .map(eq => `${eq.maxPortions}× ${eq.recipeName}`)
  const remaining = Math.max(0, equivalents.length - maxDisplay)
  return { displayed, remaining }
}

// Identifier le produit le plus critique (facteur limitant du plus grand nombre de recettes)
export function getMostImpactfulProducts(
  productPortions: ProductPortionSummary[],
  products: Product[],
  limit: number = 5
): Array<{ product: Product; impactedRecipes: number; totalPortionsLost: number }> {
  return productPortions
    .map(pp => {
      const product = products.find(p => p.id === pp.productId)
      if (!product) return null
      const limitingCount = pp.equivalents.filter(e => e.isLimitingForRecipe).length
      return {
        product,
        impactedRecipes: limitingCount,
        totalPortionsLost: pp.equivalents
          .filter(e => e.isLimitingForRecipe && e.maxPortions === 0)
          .length,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b!.impactedRecipes - a!.impactedRecipes)
    .slice(0, limit) as any
}
```

---

### 1.5 Composant réutilisable PortionGauge

**Nouveau fichier : `src/components/shared/portion-gauge.tsx`**

Jauge visuelle des portions, utilisée partout (cartes recettes, table stock, fiches détail).

```ts
interface PortionGaugeProps {
  portions: number
  maxReference?: number              // défaut 30 (portions par service)
  size?: "sm" | "md" | "lg"         // sm = 4px, md = 6px, lg = 8px de hauteur
  showLabel?: boolean                // afficher "12 portions" à côté
  className?: string
}
```

**Rendu :**
```
████████░░░░░░  12 portions
```

- La largeur remplie = `min(100%, portions / maxReference * 100)`
- La couleur suit `getPortionGaugeColor(portions)`
- `showLabel` ajoute le texte "{n} portions" ou "{n} port." en `sm`
- Transition CSS sur width pour animation fluide au changement de stock

---

## PHASE 2 — Vue "Ma carte" (~4-5 jours)

### 2.1 Page carte.tsx (remplace cuisine.tsx)

**Nouveau fichier : `src/pages/carte.tsx`**

La page n'a plus de KPIs en haut, plus de toggle grille/liste, plus de filtres de faisabilité. C'est un menu de restaurant : les recettes organisées par catégorie.

```ts
interface CartePageState {
  selectedRecipeId: string | null
  search: string
  serviceFilter: "midi" | "soir" | "tous"   // optionnel, pour restaurants avec cartes différentes midi/soir
}
```

**Structure JSX :**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CarteHeader                                                            │
│  Ma carte                              🔍 Rechercher    [+ Recette ⚙] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CarteCategorySection category="entree"                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                          │
│  │ RecipeCard  │ │ RecipeCard  │ │ RecipeCard  │                          │
│  └────────────┘ └────────────┘ └────────────┘                          │
│                                                                         │
│  CarteCategorySection category="plat"                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ RecipeCard  │ │ RecipeCard  │ │ RecipeCard  │ │ RecipeCard  │          │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │
│                                                                         │
│  CarteCategorySection category="dessert"                                │
│  ...                                                                    │
│                                                                         │
│  CarteCategorySection category="boisson"                                │
│  ...                                                                    │
│                                                                         │
│  RecipeDetailSheet (sheet droite, conditionnel)                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Logique :**
- Seules les recettes `isActive === true` apparaissent (les inactives sont accessibles via un toggle discret dans le header : "Voir les recettes désactivées")
- Les catégories vides ne s'affichent pas
- Le search filtre en temps réel sur le nom de la recette
- Clic sur une carte → ouvre `RecipeDetailSheet` en sheet à droite
- Les données viennent de `usePortionCalculator()` + `useRecipeStore()`
- Animation Framer Motion : stagger sur les cartes, `AnimatePresence` sur les sections

**Comparaison avec cuisine.tsx actuel :**
- Supprimé : `CuisineKpis` (4 KPI cards en haut)
- Supprimé : `CuisineFilters` (tabs catégorie + dropdown faisabilité + toggle grille/liste)
- Supprimé : `RecipesTable` (vue liste/tableau)
- Supprimé : `RecipesGrid` (composant grid wrapper)
- Ajouté : `CarteCategorySection` (sections par catégorie avec titre)
- Modifié : `RecipeCard` (redesign centré portions)
- Modifié : `RecipeDetailSheet` (fiche sur-mesure avec ingrédients enrichis + simulateur)

---

### 2.2 Composant CarteCategorySection

**Nouveau fichier : `src/components/carte/carte-category-section.tsx`**

```ts
interface CarteCategorySectionProps {
  category: RecipeCategory
  recipes: Recipe[]
  recipePortions: Map<string, RecipePortionInfo>
  onSelectRecipe: (id: string) => void
  selectedRecipeId: string | null
}
```

**Structure :**
```
ENTRÉES (3)                                          [Tout déplier ▾]
┌────────────┐ ┌────────────┐ ┌────────────┐
│ RecipeCard  │ │ RecipeCard  │ │ RecipeCard  │
└────────────┘ └────────────┘ └────────────┘
```

- Titre = `CATEGORY_LABELS[category]` + count entre parenthèses
- Grid responsive : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Les recettes sont triées par portions décroissantes (les plus réalisables en premier) puis alphabétiquement
- La section est collapsible (utile sur mobile) — état ouvert par défaut

---

### 2.3 Composant RecipeCard (redesign)

**Fichier : `src/components/carte/recipe-card.tsx`** — réécriture

```ts
interface RecipeCardProps {
  recipe: Recipe
  portionInfo: RecipePortionInfo
  isSelected: boolean
  onClick: () => void
}
```

**Wireframe de la carte redesignée :**

```
┌──────────────────────────┐
│  🥩  Tartare de bœuf     │  ← icône + nom
│                           │
│       0 portions          │  ← GROS CHIFFRE, info principale
│  ░░░░░░░░░░░░░░░░░░░░░░  │  ← PortionGauge
│  ↳ filet bœuf             │  ← ingrédient limitant (si contraint)
│                           │
│  €28        FC 19%        │  ← prix + food cost (secondaire)
│  Marge €22.68             │  ← marge brute
└──────────────────────────┘
```

**Détails :**
- Le nombre de portions est en `text-2xl font-bold` — c'est la donnée primaire
- La couleur du chiffre suit `getPortionGaugeColor`
- L'ingrédient limitant s'affiche seulement si `portions < 50` — texte `text-xs text-muted-foreground` avec `↳` comme préfixe
- Le food cost utilise `getFoodCostColor` existant
- Carte sélectionnée : `ring-2 ring-primary`
- Carte à 0 portions : opacité réduite `opacity-60` + le chiffre "0" est en `text-destructive`
- Hover : `shadow-md` + `translate-y-[-1px]`

---

### 2.4 Composant RecipeDetailSheet (fiche sur-mesure recette)

**Nouveau fichier : `src/components/carte/recipe-detail-sheet.tsx`**

Remplace l'ancien `recipe-detail.tsx` avec une fiche orientée "ma création, ma marge" et les connexions flux amont.

```ts
interface RecipeDetailSheetProps {
  recipe: Recipe
  portionInfo: RecipePortionInfo
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDuplicate: () => void
  onToggleActive: () => void
  onDelete: () => void
  onOrderProduct: (productId: string, supplierId: string) => void
}
```

**Structure JSX complète :**

```
┌─────────────────────────────────────────────────────────┐
│  Sheet (côté droit, largeur 480px)                      │
│                                                          │
│  ┌─ HEADER ────────────────────────────────────────────┐│
│  │  🥩 Tartare de bœuf                                 ││
│  │  Plat · Actif                                        ││
│  │                                                      ││
│  │  0 portions réalisables                              ││
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ ÉCONOMIE ──────────────────────────────────────────┐│
│  │  Prix de vente    €28.00                             ││
│  │  Coût matière     €5.32                              ││
│  │  Marge brute      €22.68                             ││
│  │  Food cost        19%                                ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ INGRÉDIENTS (flux amont) ──────────────────────────┐│
│  │                                                      ││
│  │  RecipeIngredientRow pour chaque ingrédient :        ││
│  │                                                      ││
│  │  ★ Filet bœuf         200g/port.                     ││
│  │     Stock: 0 kg        0 portions                    ││
│  │     Boucherie Moderne  [Commander →]                 ││
│  │                                                      ││
│  │  Échalotes              30g/port.                     ││
│  │     Stock: 3 kg         100 portions                 ││
│  │     Potager Local                                    ││
│  │                                                      ││
│  │  Câpres                 10g/port.                     ││
│  │     Stock: 0.5 kg       50 portions                  ││
│  │     Épicerie Fine                                    ││
│  │                                                      ││
│  │  ★ = ingrédient limitant                             ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ SIMULATEUR (RecipeSimulator) ──────────────────────┐│
│  │                                                      ││
│  │  Simuler un changement de prix :                     ││
│  │                                                      ││
│  │  Prix vente    Marge      Food cost                  ││
│  │  €28 (actuel)  €22.68     19%                        ││
│  │  €30           €24.68     18%       [Appliquer]      ││
│  │  €32           €26.68     17%       [Appliquer]      ││
│  │                                                      ││
│  │  Impact hausse fournisseur :                         ││
│  │  Si bœuf → €45/kg :  FC 21% (+2pts)                 ││
│  │  Si bœuf → €48/kg :  FC 23% (+4pts)                 ││
│  │                                                      ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ ALLERGÈNES ────────────────────────────────────────┐│
│  │  Gluten · Œuf · Moutarde                            ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ NOTES ─────────────────────────────────────────────┐│
│  │  "Servir avec salade et frites maison"              ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  [Modifier] [Désactiver] [Dupliquer] [Supprimer]        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 2.5 Composant RecipeIngredientRow

**Nouveau fichier : `src/components/carte/recipe-ingredient-row.tsx`**

```ts
interface RecipeIngredientRowProps {
  ingredient: IngredientPortionInfo
  onOrderProduct: (productId: string, supplierId: string) => void
  onClickSupplier: (supplierId: string) => void
}
```

**Rendu :**

```
★ Filet bœuf                    200g/portion
   Stock: 0 kg     ░░░░░░░░░░   0 portions
   Boucherie Moderne             [Commander →]
```

- `★` apparaît si `isLimiting === true`
- Le nom du fournisseur est cliquable → ouvre `SupplierPopover`
- Le bouton "Commander" ouvre le `OrderDialog` pré-rempli avec ce produit et ce fournisseur
- Couleur de fond conditionnelle : `bg-destructive/5` si 0 portions, `bg-amber-50` si < 5 portions

---

### 2.6 Composant RecipeSimulator

**Nouveau fichier : `src/components/carte/recipe-simulator.tsx`**

```ts
interface RecipeSimulatorProps {
  recipe: Recipe
  portionInfo: RecipePortionInfo
  onApplyPrice: (newPrice: number) => void
}
```

**Logique :**
1. **Simulation prix de vente :** génère 2 lignes avec prix +€2 et +€4 par rapport au prix actuel. Chaque ligne montre la nouvelle marge et le nouveau food cost. Bouton "Appliquer" → met à jour le `sellingPrice` via `recipeStore.updateRecipe`.

2. **Simulation hausse fournisseur :** pour l'ingrédient limitant (ou le plus cher), simule +10% et +20% sur son `unitPrice`. Montre l'impact sur le food cost. Purement informatif, pas d'action.

3. **Le simulateur est collapsible** (`Collapsible` de shadcn) — fermé par défaut sur mobile, ouvert sur desktop.

---

### 2.7 Mise à jour du routing

**Fichier : `src/router.tsx`**

Modifications :
```ts
// Remplacer :
{ path: "cuisine", element: <CuisinePage /> }
{ path: "cuisine/nouvelle", element: <CuisineRecipePage /> }
{ path: "cuisine/:id/modifier", element: <CuisineRecipePage /> }
{ path: "stocks", element: <StocksPage /> }
{ path: "stocks/nouveau", element: <StocksProductPage /> }
{ path: "stocks/:id/modifier", element: <StocksProductPage /> }
{ path: "stocks/configuration", element: <StocksConfigurationPage /> }
{ path: "fournisseurs", element: <FournisseursPage /> }
{ path: "fournisseurs/:id", element: <FournisseurDetailPage /> }

// Par :
{ path: "carte", element: <CartePage /> }
{ path: "carte/nouvelle", element: <CarteRecipePage /> }
{ path: "carte/:id/modifier", element: <CarteRecipePage /> }
{ path: "stock", element: <StockPage /> }
{ path: "stock/nouveau", element: <StockProductPage /> }
{ path: "stock/:id/modifier", element: <StockProductPage /> }
{ path: "stock/configuration", element: <StockConfigurationPage /> }
{ path: "commandes", element: <CommandesPage /> }

// Redirections pour backward compat (optionnel) :
{ path: "cuisine", element: <Navigate to="/carte" replace /> }
{ path: "cuisine/*", element: <Navigate to="/carte" replace /> }
{ path: "stocks", element: <Navigate to="/stock" replace /> }
{ path: "stocks/*", element: <Navigate to="/stock" replace /> }
{ path: "fournisseurs", element: <Navigate to="/commandes" replace /> }
{ path: "fournisseurs/*", element: <Navigate to="/commandes" replace /> }
```

**Mise à jour sidebar :** dans le composant sidebar (à localiser dans le layout), remplacer les items de navigation :
- "Cuisine" → "Ma carte" avec icône `ChefHat` ou équivalent
- "Stocks" → "Mon stock" avec icône `Package`
- "Fournisseurs" → "Commandes" avec icône `ShoppingCart` ou `Truck`

---

## PHASE 3 — Vue "Mon stock" (~4-5 jours)

### 3.1 Page stock.tsx (remplace stocks.tsx)

**Nouveau fichier : `src/pages/stock.tsx`**

La page n'a plus de KPIs en haut. C'est une liste de produits avec la colonne "Équivalent portions" comme information clé.

```ts
interface StockPageState {
  selectedProductId: string | null
  search: string
  categoryFilter: string             // "toutes" | catégorie
  zoneFilter: string                 // "toutes" | zone
  sortBy: "stock" | "portions" | "expiration" | "name" | "value"
  sortOrder: "asc" | "desc"
}
```

**Structure JSX :**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  StockHeader                                                            │
│  Mon stock                      🔍 Rechercher    [Catégorie ▾] [Zone ▾]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Tri: [Stock ▾] [Par portions ▾] [Expiration ▾] [Valeur ▾]            │
│                                                                         │
│  StockTable                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Produit      Stock    Équiv. portions          Fourn.    Expire  │  │
│  │──────────────────────────────────────────────────────────────────│  │
│  │ Filet bœuf   0 kg     0× tartare, 0× tourn.   Bouch.M.   —     │  │
│  │              ░░░░░░░  0× carpaccio                               │  │
│  │                                                                  │  │
│  │ Crevettes    1 kg     4× ceviche, 5× sal.crev  Océan F.  28/03 │  │
│  │              ██░░░░░  ↳ limitant pour ceviche                    │  │
│  │                                                                  │  │
│  │ Saumon       2 kg     8× pavé, 4× ceviche      Océan F.  25/03 │  │
│  │              ██░░░░░                                             │  │
│  │ ...                                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ProductDetailSheet (sheet droite, conditionnel)                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Comparaison avec stocks.tsx actuel :**
- Supprimé : `StocksKpis` (4 KPI cards)
- Supprimé : `StorageZones` (cards de zones de stockage en haut)
- Modifié : `StockTable` — nouvelle colonne "Équiv. portions" + suppression colonnes "Rotation" et "Valeur" (déplacées dans la fiche détail)
- Modifié : `ProductDetailSheet` — fiche sur-mesure avec flux amont/aval + mini-graphe
- Le filtre zone reste en dropdown dans le header (plus compact que les cards actuelles)

---

### 3.2 Composant StockTable (redesign)

**Fichier : `src/components/stock/stock-table.tsx`** — réécriture

**Colonnes :**

| Colonne | Largeur | Contenu |
|---------|---------|---------|
| Produit | 200px | Icône + nom + catégorie badge |
| Stock | 140px | Quantité + unité + jauge mini + statut badge |
| Équiv. portions | flex | `formatPortionEquivalents()` — max 3 recettes affichées, "+N" si plus. Highlight `↳ limitant` en gras |
| Fournisseur | 140px | Nom fournisseur, cliquable → `SupplierPopover` |
| Expire | 100px | Date, rouge si < 3 jours, ambre si < 7 jours |

**Tri spécial "Par portions" :**
- Trie par le **minimum** de portions parmi tous les équivalents du produit
- Les produits qui sont facteur limitant d'au moins une recette remontent en premier
- Ceci met en évidence les produits qui bloquent la carte

**Tri "Stock" :**
- Trie par `getStockPercentage(product)` — donc par rapport au min/max, pas par quantité absolue

**Tri "Expiration" :**
- Les produits sans date d'expiration vont en fin de liste

**Ligne cliquable :** clic sur une ligne → ouvre `ProductDetailSheet`

**Actions par ligne (dropdown menu) :**
- "Commander" → ouvre `OrderDialog` pré-rempli
- "Voir fournisseur" → ouvre `SupplierSheet`
- "Modifier" → navigate vers `/stock/:id/modifier`
- "Supprimer" → dialog de confirmation

---

### 3.3 Composant ProductDetailSheet (fiche sur-mesure produit)

**Nouveau fichier : `src/components/stock/product-detail-sheet.tsx`**

Remplace l'ancien `product-detail.tsx`. Fiche orientée "ma ressource, mon stock" avec flux amont (fournisseur) et flux aval (recettes).

```ts
interface ProductDetailSheetProps {
  product: Product
  portionSummary: ProductPortionSummary
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onOrderProduct: () => void
  onClickSupplier: (supplierId: string) => void
  onClickRecipe: (recipeId: string) => void
}
```

**Structure JSX complète :**

```
┌─────────────────────────────────────────────────────────┐
│  Sheet (côté droit, largeur 480px)                      │
│                                                          │
│  ┌─ HEADER ────────────────────────────────────────────┐│
│  │  🐟 Saumon frais                                    ││
│  │  Poissons · Chambre froide A                         ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ MINI-GRAPHE (ProductFlowGraph) ────────────────────┐│
│  │                                                      ││
│  │  [Océan Frais] ──→ [🐟 Saumon 2kg] ──→ [Pavé 8p]  ││
│  │                                    └──→ [Ceviche 13p]││
│  │                                                      ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ STOCK ─────────────────────────────────────────────┐│
│  │  ████░░░░░░░░░░░░░░  2 / 10 kg                     ││
│  │  Min: 3 kg   Max: 10 kg    Statut: Stock faible     ││
│  │  Prix: €35/kg   Valeur: €70                         ││
│  │  Rotation: 4.2 jours   Expire: 25/03                ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ FLUX AMONT — FOURNISSEUR ──────────────────────────┐│
│  │  Océan Frais                                         ││
│  │  📞 01 23 45 67 89   ✉️ contact@oceanfrais.fr        ││
│  │  Livraison: ~2 jours                                 ││
│  │  Dépensé ce mois: €2 800                             ││
│  │  [Commander ce produit →]                            ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ FLUX AVAL — RECETTES UTILISANT CE PRODUIT ─────────┐│
│  │                                                      ││
│  │  Pavé saumon    250g/port.   → 8 portions           ││
│  │  ↳ limitant pour cette recette                       ││
│  │                                                      ││
│  │  Ceviche        150g/port.   → 13 portions          ││
│  │                                                      ││
│  │  (Clic sur une recette → ouvre RecipeDetailSheet)    ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ HISTORIQUE COMMANDES ──────────────────────────────┐│
│  │  12/03  5kg  €175  Océan Frais  ✅ livré            ││
│  │  28/02  8kg  €280  Océan Frais  ✅ livré            ││
│  │  15/02  5kg  €175  Océan Frais  ✅ livré            ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  [Modifier]  [Commander]  [Supprimer]                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 3.4 Composant ProductFlowGraph (mini-graphe)

**Nouveau fichier : `src/components/stock/product-flow-graph.tsx`**

Le mini-graphe visualise les connexions fournisseur → produit → recettes pour répondre à la question "effet cascade" sans navigation séquentielle.

```ts
interface ProductFlowGraphProps {
  product: Product
  supplier: SupplierFull
  portionSummary: ProductPortionSummary
  onClickSupplier: (supplierId: string) => void
  onClickRecipe: (recipeId: string) => void
}
```

**Rendu visuel (pas un vrai graphe SVG — un layout HTML/CSS flex) :**

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ Océan Frais │───────→│ 🐟 Saumon   │───────→│ Pavé saumon │
│ (fourniss.) │         │    2 kg      │    ┌──→│   8 port.   │
└─────────────┘         │  🟡 faible   │    │   └─────────────┘
                         └──────┬──────┘    │
                                │           │   ┌─────────────┐
                                └───────────┴──→│ Ceviche     │
                                                │   13 port.  │
                                                └─────────────┘
```

**Implémentation :**
- **Pas de librairie de graphe** (type D3, react-flow, etc.) — c'est du HTML/CSS pur
- Layout en 3 colonnes flex : `[fournisseur]` → `[produit]` → `[recettes]`
- Les flèches sont des `div` avec `border` et `::after` pseudo-elements pour les pointes, OU des SVG `<line>` simples dans un `<svg>` positionné en absolute entre les colonnes
- Les nœuds sont des `div` avec `rounded-lg border p-3`
- Couleur des nœuds recettes : `bg-destructive/10` si 0 portions, `bg-amber-50` si < 5, `bg-muted` sinon
- Le nœud fournisseur est cliquable → `onClickSupplier`
- Les nœuds recettes sont cliquables → `onClickRecipe`
- Si plus de 4 recettes, afficher les 3 premières + un nœud "+N autres" expansible

**Contraintes de taille :**
- Hauteur fixe : ~120px (3 recettes max visibles)
- Largeur : 100% de la sheet (480px environ)
- Sur mobile/petit écran : le graphe se linéarise verticalement

**Pourquoi HTML/CSS et pas une lib graphe :**
- Le graphe est toujours le même shape : 1 source → 1 nœud central → N destinations
- Pas besoin de drag, zoom, ou layout dynamique
- Performance : aucune dépendance externe, rendu instantané
- Accessible : les nœuds sont des `button` avec `aria-label`

---

### 3.5 Composant SupplierPopover

**Nouveau fichier : `src/components/shared/supplier-popover.tsx`**

Popover léger qui apparaît au clic sur un nom de fournisseur (dans la table stock, dans les ingrédients d'une recette, etc.).

```ts
interface SupplierPopoverProps {
  supplier: SupplierFull
  productCount: number
  monthlySpend: number
  lastOrderDate: string | null
  children: React.ReactNode          // le trigger (nom du fournisseur)
  onOrder: () => void
  onViewFull: () => void             // ouvre SupplierSheet
}
```

**Rendu :**
```
┌────────────────────────────────┐
│  Océan Frais                   │
│  📞 01 23 45 67 89             │
│  ✉️ contact@oceanfrais.fr      │
│  Livraison: ~2 jours           │
│                                │
│  3 produits · €2 800 ce mois  │
│  Dernière cmd: 12/03           │
│                                │
│  [Commander →]  [Voir fiche →] │
└────────────────────────────────┘
```

- Utilise `Popover` de shadcn
- "Commander" → ouvre `OrderDialog` pré-rempli fournisseur
- "Voir fiche" → ouvre `SupplierSheet` (la sheet complète)

---

### 3.6 Composant SupplierSheet (fiche sur-mesure fournisseur)

**Nouveau fichier : `src/components/shared/supplier-sheet.tsx`**

Remplace l'ancienne page `/fournisseurs/:id`. C'est un Sheet (pas une page) accessible depuis n'importe où.

```ts
interface SupplierSheetProps {
  supplier: SupplierFull
  isOpen: boolean
  onClose: () => void
  onOrder: () => void
  onEdit: () => void
  onDelete: () => void
}
```

**Structure JSX :**

```
┌─────────────────────────────────────────────────────────┐
│  Sheet (côté droit, largeur 480px)                      │
│                                                          │
│  ┌─ HEADER ────────────────────────────────────────────┐│
│  │  🚛 Océan Frais                                     ││
│  │  Poissons                                            ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ CONTACT ───────────────────────────────────────────┐│
│  │  📞 01 23 45 67 89                                   ││
│  │  ✉️ contact@oceanfrais.fr                             ││
│  │  12 rue du Port, Marseille                           ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ PERFORMANCE ───────────────────────────────────────┐│
│  │  Fiabilité livraison: ~2 jours                       ││
│  │  Ce mois: €2 800 (22% de mes achats)                ││
│  │  Mois dernier: €2 400                                ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ FLUX AVAL — PRODUITS FOURNIS ──────────────────────┐│
│  │                                                      ││
│  │  Produit       Stock     État       Équiv. portions  ││
│  │  Saumon        2 kg      🟡 bas     8× pavé, 13× cev││
│  │  Crevettes     1 kg      🟡 bas     4× cev, 5× sal  ││
│  │                                                      ││
│  │  [Commander chez ce fournisseur →]                   ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ DERNIÈRES COMMANDES ───────────────────────────────┐│
│  │  20/03  Saumon+Crevettes  €280  ⏳ en cours         ││
│  │  12/03  Saumon            €175  ✅ livré             ││
│  │  28/02  Saumon+Crevettes  €280  ✅ livré             ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ NOTES ─────────────────────────────────────────────┐│
│  │  "Livraison tous les matins avant 7h"               ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  [Modifier]  [Commander]  [Supprimer]                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Données :** utilise `useInventoryStore` pour `products`, `orders`, et les utils existantes (`getSupplierProducts`, `getSupplierOrders`, `getSupplierMonthlySpend`). Utilise `usePortionCalculator` pour les équivalents portions.

**Sections "Produits fournis" :** les produits sont affichés avec leur stock, statut, et les recettes qu'ils alimentent en portions. Les produits en rupture ou stock faible sont en premier.

---

## PHASE 4 — Vue "Commandes" + Order Dialog unifié (~3-4 jours)

### 4.1 Page commandes.tsx (remplace fournisseurs.tsx)

**Nouveau fichier : `src/pages/commandes.tsx`**

La page regroupe : commandes en cours, historique, et le point d'entrée pour passer commande.

```ts
interface CommandesPageState {
  selectedTab: "en_cours" | "historique"
  supplierFilter: string             // "tous" | supplierId
  search: string
}
```

**Structure JSX :**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CommandesHeader                                                        │
│  Commandes                                       [+ Passer commande]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  OrderSummaryBar                                                        │
│  3 en cours · €760 en attente · 5 fournisseurs actifs · €12 450 ce mois│
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [En cours (3)] [Historique]                      [Fournisseur ▾]      │
│                                                                         │
│  ┌─ Tab "En cours" ────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  PendingOrders                                                   │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  Océan Frais                      Commandé 20/03        │   │   │
│  │  │  5kg saumon · 3kg crevettes       Livr. prévue: 22/03  │   │   │
│  │  │  €280                                                    │   │   │
│  │  │                                                          │   │   │
│  │  │  Détail:                                                 │   │   │
│  │  │  • Saumon frais    5 kg × €35/kg = €175                 │   │   │
│  │  │  • Crevettes roses 3 kg × €35/kg = €105                 │   │   │
│  │  │                                                          │   │   │
│  │  │  [Réceptionner]  [Annuler]                              │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  Boucherie Moderne                Commandé 21/03        │   │   │
│  │  │  10kg filet bœuf                  Livr. prévue: 22/03  │   │   │
│  │  │  €420                                                    │   │   │
│  │  │  [Réceptionner]  [Annuler]                              │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Tab "Historique" ──────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  OrderHistoryTable                               [Ce mois ▾]   │   │
│  │                                                                  │   │
│  │  Date     Fournisseur      Produits              Total  Statut  │   │
│  │  18/03    Potager Local    Tomates, oignons      €85   ✅      │   │
│  │  15/03    Boucherie Mod.   Filet bœuf, côtes     €485  ✅      │   │
│  │  12/03    Océan Frais      Saumon, crevettes     €280  ✅      │   │
│  │  05/03    Potager Local    Citrons, herbes       €44   ❌      │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Comparaison avec fournisseurs.tsx actuel :**
- Supprimé : `FournisseursKpis` → remplacé par `OrderSummaryBar` (1 ligne, pas 4 cards)
- Supprimé : `SuppliersTab` (grille de cartes fournisseurs) → les fournisseurs ne sont plus une vue, mais un filtre
- Modifié : `OrdersTab` → splitté en `PendingOrders` (cards) + `OrderHistoryTable`
- Supprimé : page détail fournisseur `/fournisseurs/:id` → remplacé par `SupplierSheet` accessible partout
- L'ajout de fournisseur se fait depuis les paramètres ou depuis le dialog de commande ("+ Nouveau fournisseur")

---

### 4.2 Composant PendingOrders

**Nouveau fichier : `src/components/commandes/pending-orders.tsx`**

```ts
interface PendingOrdersProps {
  orders: Order[]                     // filtrées status === "pending"
  products: Product[]
  suppliers: SupplierFull[]
  onReceive: (orderId: string) => void
  onCancel: (orderId: string) => void
  onClickSupplier: (supplierId: string) => void
}
```

- Chaque commande est une card avec le détail des items
- Les items affichent : nom produit, quantité, prix unitaire, sous-total
- **"Réceptionner"** → ouvre `ReceiveOrderDialog` (voir 4.4)
- **"Annuler"** → dialog de confirmation puis `cancelOrder(orderId)`
- Nom du fournisseur cliquable → `SupplierSheet`
- Si aucune commande en cours : message vide "Aucune commande en attente"
- Triées par date de livraison prévue (la plus proche en premier)

---

### 4.3 Composant OrderHistoryTable

**Nouveau fichier : `src/components/commandes/order-history-table.tsx`**

```ts
interface OrderHistoryTableProps {
  orders: Order[]                     // filtrées status !== "pending"
  products: Product[]
  suppliers: SupplierFull[]
  onClickSupplier: (supplierId: string) => void
}
```

- Table avec colonnes : Date, Fournisseur, Produits (résumé), Total, Statut
- Ligne expandable (comme l'actuel `OrdersTab`) pour voir le détail des items
- Filtre période : "Ce mois" / "Mois dernier" / "3 derniers mois" / "Tout"
- Statut : ✅ livré, ❌ annulé avec badge coloré
- Triée par date décroissante

---

### 4.4 Composant ReceiveOrderDialog

**Nouveau fichier : `src/components/commandes/receive-order-dialog.tsx`**

Amélioration par rapport à l'actuel `markOrderDelivered` qui accepte silencieusement. Ce dialog permet d'ajuster les quantités réellement reçues.

```ts
interface ReceiveOrderDialogProps {
  order: Order
  products: Product[]
  isOpen: boolean
  onClose: () => void
  onConfirm: (receivedItems: Array<{ productId: string; receivedQuantity: number }>) => void
}
```

**Structure :**

```
┌─────────────────────────────────────────────────────────┐
│  Réceptionner la commande                               │
│  Océan Frais — 20/03                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Produit          Commandé    Reçu                       │
│  Saumon frais     5 kg        [5    ] kg    ✅          │
│  Crevettes roses  3 kg        [2.5  ] kg    ⚠️ partiel  │
│                                                          │
│  Note : si quantité reçue ≠ commandée, la différence    │
│  est signalée mais la commande est marquée livrée.      │
│                                                          │
│                     [Annuler]  [Confirmer réception]     │
└─────────────────────────────────────────────────────────┘
```

**Logique :**
- Chaque ligne est pré-remplie avec la quantité commandée
- Le restaurateur peut ajuster (livraison partielle, erreur fournisseur)
- **"Confirmer réception"** → pour chaque item : `updateProduct(id, { quantity: current + receivedQuantity })` + crée l'entrée `orderHistory`
- Met à jour le statut commande via `markOrderDelivered`
- Si réception partielle (au moins un item avec reçu < commandé), ajouter une note automatique sur la commande

**Impact store** : nécessite une modification de `markOrderDelivered` dans `inventory-store.ts` pour accepter des quantités custom (voir 4.6).

---

### 4.5 Composant OrderDialog (unifié)

**Fichier : `src/components/commandes/order-dialog.tsx`** — repris de `fournisseurs/order-dialog.tsx`, amélioré

C'est le **même dialog** appelé depuis 3 endroits :
1. Depuis "Ma carte" → pré-rempli avec le produit et le fournisseur de l'ingrédient
2. Depuis "Mon stock" → pré-rempli avec le produit et son fournisseur
3. Depuis "Commandes" → vide, le restaurateur choisit tout

```ts
interface OrderDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (order: Omit<Order, "id" | "status" | "deliveredDate">) => void
  // Pré-remplissage optionnel
  prefillSupplierId?: string
  prefillProductId?: string
}
```

**Améliorations par rapport à l'actuel :**
1. **Affichage du stock actuel** à côté de chaque produit : "Saumon frais — Stock: 2 kg (min: 3 kg)" → le restaurateur voit instantanément pourquoi il commande
2. **Suggestion de quantité** : si `stock < minStock`, pré-remplir avec `maxStock - stock` comme quantité suggérée (modifiable)
3. **Équivalent portions** : sous la quantité, afficher "= +X portions de Pavé saumon" pour que le restaurateur sache ce que sa commande lui apporte en termes de carte
4. **Section "Ajouter un fournisseur"** en bas du dropdown fournisseur → ouvre un sous-formulaire inline (nom, catégorie, téléphone minimum)

---

### 4.6 Modification du store inventory

**Fichier : `src/stores/inventory-store.ts`** — modifications

```ts
// Modifier markOrderDelivered pour accepter des quantités custom
markOrderDelivered: (orderId: string, receivedQuantities?: Record<string, number>) => void

// Implémentation modifiée :
markOrderDelivered: (orderId, receivedQuantities) =>
  set((state) => {
    const today = toLocalDateString(new Date())
    const order = state.orders.find((o) => o.id === orderId)
    if (!order || order.status !== "pending") return state

    const updatedOrders = state.orders.map((o) =>
      o.id === orderId
        ? { ...o, status: "delivered" as const, deliveredDate: today }
        : o
    )

    const updatedProducts = state.products.map((p) => {
      const orderItem = order.items.find((item) => item.productId === p.id)
      if (!orderItem) return p

      // Utiliser la quantité reçue si fournie, sinon la quantité commandée
      const receivedQty = receivedQuantities?.[p.id] ?? orderItem.quantity

      const supplier = state.suppliers.find((s) => s.id === order.supplierId)
      const historyEntry = {
        id: `oh-${Date.now()}-${p.id}`,
        date: today,
        quantity: receivedQty,
        supplier: supplier?.name ?? "—",
        unitPrice: orderItem.unitPrice,
      }

      return {
        ...p,
        quantity: p.quantity + receivedQty,
        lastOrderDate: today,
        orderHistory: [historyEntry, ...p.orderHistory],
      }
    })

    return { orders: updatedOrders, products: updatedProducts }
  }),
```

**Backward compatible :** si `receivedQuantities` n'est pas fourni, le comportement est identique à l'actuel.

---

### 4.7 Composant OrderSummaryBar

**Nouveau fichier : `src/components/commandes/order-summary-bar.tsx`**

Barre résumé compacte en haut de la page Commandes.

```ts
interface OrderSummaryBarProps {
  pendingCount: number
  pendingTotal: number
  activeSuppliers: number
  monthlySpend: number
}
```

**Rendu :** une seule ligne flex, pas des cards séparées :
```
3 en cours · €760 en attente · 5 fournisseurs · €12 450 ce mois
```

Utilise les utils existantes : `getPendingOrderCount`, `getTotalMonthlySpend`, etc.

---

## PHASE 5 — Suppression des anciens fichiers et migration (~1-2 jours)

### 5.1 Fichiers à supprimer

```
src/components/cuisine/                   → renommé en src/components/carte/
├── cuisine-header.tsx                    ✗ remplacé par carte-header.tsx
├── cuisine-filters.tsx                   ✗ supprimé (plus de filtres complexes)
├── cuisine-kpis.tsx                      ✗ supprimé (plus de KPIs)
├── recipe-card.tsx                       ✗ réécrit dans carte/
├── recipe-detail.tsx                     ✗ remplacé par recipe-detail-sheet.tsx
├── recipes-grid.tsx                      ✗ supprimé (remplacé par CarteCategorySection)
└── recipes-table.tsx                     ✗ supprimé (plus de vue tableau)

src/components/stocks/                    → renommé en src/components/stock/
├── stocks-header.tsx                     ✗ remplacé par stock-header.tsx
├── stocks-kpis.tsx                       ✗ supprimé (plus de KPIs)
├── stocks-table.tsx                      ✗ réécrit dans stock/stock-table.tsx
├── product-detail.tsx                    ✗ remplacé par product-detail-sheet.tsx
└── storage-zones.tsx                     ✗ supprimé de la vue principale (reste dans config)

src/components/fournisseurs/              → éclaté entre commandes/ et shared/
├── fournisseurs-header.tsx               ✗ supprimé
├── fournisseurs-kpis.tsx                 ✗ remplacé par order-summary-bar.tsx
├── suppliers-tab.tsx                     ✗ supprimé (plus de vue fournisseurs)
├── orders-tab.tsx                        ✗ splitté en pending-orders + order-history-table
├── products-tab.tsx                      ✗ supprimé
├── supplier-detail.tsx                   ✗ remplacé par shared/supplier-sheet.tsx
├── add-supplier-dialog.tsx               ✗ déplacé dans shared/ ou commandes/
└── order-dialog.tsx                      ✗ déplacé dans commandes/order-dialog.tsx

src/pages/
├── cuisine.tsx                           ✗ remplacé par carte.tsx
├── cuisine-recipe.tsx                    ✗ renommé carte-recipe.tsx
├── stocks.tsx                            ✗ remplacé par stock.tsx
├── stocks-product.tsx                    ✗ renommé stock-product.tsx
├── stocks/configuration.tsx              ✗ renommé stock-configuration.tsx
├── fournisseurs.tsx                      ✗ remplacé par commandes.tsx
└── fournisseur-detail.tsx                ✗ supprimé (remplacé par SupplierSheet)
```

### 5.2 Fichiers conservés tels quels

```
src/components/carte/
├── types.ts                              ○ modifié (ajout PortionInfo)
├── utils.ts                              ○ modifié (ajouts)
├── data.ts                               ○ conservé
├── ingredient-combobox.tsx               ● inchangé
└── add-recipe-dialog.tsx                 ● inchangé

src/components/stock/
├── types.ts                              ○ modifié (ajout PortionEquivalent)
├── utils.ts                              ○ modifié (ajouts)
├── data.ts                               ● inchangé
├── add-product-dialog.tsx                ● inchangé
└── product-icons.ts                      ● inchangé

src/components/fournisseurs/
├── types.ts                              ○ déplacé dans commandes/types.ts
├── utils.ts                              ○ déplacé dans commandes/ ou shared/
└── data.ts                               ● inchangé (réexporté depuis commandes/)

src/stores/
├── inventory-store.ts                    ○ modifié (markOrderDelivered)
└── recipe-store.ts                       ● inchangé
```

### 5.3 Mise à jour des imports

Tous les fichiers qui importent depuis les anciens chemins doivent être mis à jour :
- `@/components/cuisine/` → `@/components/carte/`
- `@/components/stocks/` → `@/components/stock/`
- `@/components/fournisseurs/` → `@/components/commandes/` ou `@/components/shared/`

Utiliser un search-and-replace global avec vérification.

---

## PHASE 6 — Tests (~2-3 jours)

### 6.1 Tests du hook usePortionCalculator

**Nouveau fichier : `src/__tests__/use-portion-calculator.test.ts`**

Cas de test :

```
Calcul de portions par recette :
- Recette avec tous ingrédients en stock → portions = min(stock/qty pour chaque ingrédient)
- Recette avec un ingrédient en rupture → portions = 0, limitingIngredient correct
- Recette avec ingrédient inconnu (productId invalide) → portions = 0
- Recette sans ingrédients → portions = 0
- Recette inactive → exclue de getAllRecipePortions()

Calcul de portions par produit :
- Produit utilisé dans 3 recettes → 3 PortionEquivalent
- Produit non utilisé dans aucune recette → equivalents = []
- Produit limitant pour une recette → isLimitingForRecipe = true
- Produit pas limitant (autre produit limite avant) → isLimitingForRecipe = false

Agrégats :
- totalFeasibleRecipes = nombre de recettes actives avec portions > 0
- totalUnfeasibleRecipes = nombre de recettes actives avec portions === 0
- averageFoodCost = moyenne pondérée des food costs des recettes actives

Edge cases :
- Produit avec quantité 0 et minStock 0 → rupture
- Ingrédient avec quantity 0 dans la recette → division par 0 gérée (portions = 0)
- Prix de vente 0 → food cost = 0 (pas Infinity)
```

### 6.2 Tests des utilitaires

**Fichier : `src/__tests__/carte-utils.test.ts`**

```
getLimitingIngredientName :
- Retourne null si portions >= 50
- Retourne le nom du produit limitant si portions < 50
- Retourne null si pas d'ingrédient limitant

getPortionGaugeColor :
- 0 → bg-destructive
- 3 → bg-destructive/80
- 10 → bg-amber-500
- 20 → bg-emerald-500

formatPortionEquivalents :
- 2 équivalents, maxDisplay 3 → affiche les 2, remaining = 0
- 5 équivalents, maxDisplay 3 → affiche 3, remaining = 2
- 0 équivalents → displayed = [], remaining = 0
```

### 6.3 Tests du ReceiveOrderDialog (logique)

```
- Quantités pré-remplies = quantités commandées
- Réception complète → stock incrémenté correctement
- Réception partielle → stock incrémenté de la quantité reçue, pas commandée
- Quantité reçue = 0 pour un item → stock non modifié pour ce produit
- Commande non-pending → rejetée
```

---

## PHASE 7 — Polish, responsive et accessibilité (~2-3 jours)

### 7.1 Animations

- **Page "Ma carte"** : cartes recettes apparaissent en stagger (`delay: index * 30ms`, `opacity 0→1`, `y: 8→0`)
- **Sheets** : slide-in depuis la droite (`x: 100%→0`, `duration: 200ms`)
- **PortionGauge** : `transition-[width] duration-500 ease-out` quand les portions changent
- **Mini-graphe** : les nœuds apparaissent en séquence gauche→droite (`delay: column * 100ms`)
- **Cartes commande** : expand/collapse animé pour le détail des items

### 7.2 Responsive

| Breakpoint | Ma carte | Mon stock | Commandes |
|---|---|---|---|
| `>= 1280px` | Grid 4 colonnes + sheet 480px | Table complète + sheet 480px | Cards + table + sheet |
| `1024-1279px` | Grid 3 colonnes + sheet overlay | Table (masquer col Expire) + sheet overlay | Cards + table |
| `768-1023px` | Grid 2 colonnes + sheet fullscreen | Table (masquer col Fournisseur, Expire) + sheet fullscreen | Cards empilées + table simplifiée |
| `< 768px` | Grid 1 colonne + sheet fullscreen | Liste simplifiée (nom + stock + portions) + sheet fullscreen | Cards empilées seules |

**Sheet sur mobile :** la sheet passe en plein écran (`side="bottom"` ou fullscreen) avec un header sticky et un bouton retour.

**Mini-graphe sur mobile :** se linéarise verticalement (fournisseur en haut → produit au milieu → recettes en bas).

### 7.3 Accessibilité

- Toutes les cartes recettes : `role="article"` avec `aria-label` incluant le nom et le nombre de portions
- PortionGauge : `role="meter"` avec `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax`
- Mini-graphe : `role="img"` avec `aria-label` décrivant les connexions textuellement
- Nœuds du graphe : `role="link"` cliquables avec `aria-label` descriptif
- Toutes les actions : accessibles au clavier (Tab + Enter)
- Contrastes WCAG AA sur toutes les couleurs de statut

### 7.4 États vides

- **Ma carte, aucune recette active :** "Aucune recette active. [+ Créer une recette] ou [Voir les recettes désactivées]"
- **Mon stock, aucun produit :** "Aucun produit en stock. [+ Ajouter un produit]"
- **Commandes, aucune en cours :** "Aucune commande en attente de livraison."
- **Commandes, aucun historique :** "Pas encore de commande passée."
- **Fiche produit, aucune recette :** section "Flux aval" masquée (pas de section vide)
- **Fiche recette, aucun ingrédient :** "Aucun ingrédient défini. [Modifier la recette]"

---

## Arbre de fichiers final

```
src/components/carte/                    ← renommé depuis cuisine/
├── types.ts                             // MODIFIÉ — ajout PortionInfo types
├── utils.ts                             // MODIFIÉ — ajout getLimitingIngredientName, getPortionGaugeColor
├── data.ts                              // INCHANGÉ
├── carte-header.tsx                     // MODIFIÉ — renommé, simplifié
├── carte-category-section.tsx           // NOUVEAU — section par catégorie
├── recipe-card.tsx                      // RÉÉCRIT — redesign centré portions
├── recipe-detail-sheet.tsx              // NOUVEAU — fiche sur-mesure recette
├── recipe-ingredient-row.tsx            // NOUVEAU — ligne ingrédient enrichie
├── recipe-simulator.tsx                 // NOUVEAU — simulateur prix/marge
├── ingredient-combobox.tsx              // INCHANGÉ
└── add-recipe-dialog.tsx                // INCHANGÉ

src/components/stock/                    ← renommé depuis stocks/
├── types.ts                             // MODIFIÉ — ajout PortionEquivalent types
├── utils.ts                             // MODIFIÉ — ajout formatPortionEquivalents
├── data.ts                              // INCHANGÉ
├── stock-header.tsx                     // MODIFIÉ — renommé, simplifié
├── stock-table.tsx                      // RÉÉCRIT — colonne Équiv. portions
├── product-detail-sheet.tsx             // NOUVEAU — fiche sur-mesure produit
├── product-flow-graph.tsx               // NOUVEAU — mini-graphe fournisseur→produit→recettes
├── product-card.tsx                     // MODIFIÉ — redesign avec portions
├── storage-zones.tsx                    // INCHANGÉ (utilisé dans /stock/configuration)
├── add-product-dialog.tsx               // INCHANGÉ
└── product-icons.ts                     // INCHANGÉ

src/components/commandes/                ← NOUVEAU
├── types.ts                             // EXTRAIT — Order, OrderItem, OrderStatus
├── commandes-header.tsx                 // NOUVEAU
├── pending-orders.tsx                   // NOUVEAU — commandes en cours
├── order-history-table.tsx              // NOUVEAU — historique
├── order-dialog.tsx                     // MODIFIÉ — repris, amélioré (stock + portions)
├── receive-order-dialog.tsx             // NOUVEAU — réception avec ajustement
└── order-summary-bar.tsx                // NOUVEAU — barre résumé compacte

src/components/shared/
├── supplier-popover.tsx                 // NOUVEAU — popover fournisseur léger
├── supplier-sheet.tsx                   // NOUVEAU — fiche sur-mesure fournisseur
└── portion-gauge.tsx                    // NOUVEAU — jauge portions réutilisable

src/hooks/
├── use-portion-calculator.ts            // NOUVEAU — calcul portions central
└── use-table-sort.ts                    // INCHANGÉ

src/stores/
├── inventory-store.ts                   // MODIFIÉ — markOrderDelivered avec quantités custom
└── recipe-store.ts                      // INCHANGÉ

src/pages/
├── carte.tsx                            // NOUVEAU — remplace cuisine.tsx
├── carte-recipe.tsx                     // RENOMMÉ — depuis cuisine-recipe.tsx
├── stock.tsx                            // NOUVEAU — remplace stocks.tsx
├── stock-product.tsx                    // RENOMMÉ — depuis stocks-product.tsx
├── stock-configuration.tsx              // RENOMMÉ — depuis stocks/configuration.tsx
└── commandes.tsx                        // NOUVEAU — remplace fournisseurs.tsx

src/__tests__/
├── use-portion-calculator.test.ts       // NOUVEAU
├── carte-utils.test.ts                  // NOUVEAU
└── receive-order.test.ts                // NOUVEAU
```

**Bilan : 18 fichiers nouveaux, 12 fichiers modifiés/réécrits, 15 fichiers supprimés, 3 fichiers de tests.**

---

## Résumé des phases

| Phase | Contenu | Durée estimée |
|---|---|---|
| Phase 1 | Types, utils, hook usePortionCalculator, PortionGauge | 2-3 jours |
| Phase 2 | Vue "Ma carte" : page, cards, detail sheet, simulateur | 4-5 jours |
| Phase 3 | Vue "Mon stock" : page, table, detail sheet, mini-graphe, popover/sheet fournisseur | 4-5 jours |
| Phase 4 | Vue "Commandes" : page, pending, historique, order dialog unifié, receive dialog | 3-4 jours |
| Phase 5 | Suppression anciens fichiers, migration imports, routing | 1-2 jours |
| Phase 6 | Tests unitaires (hook, utils, logique réception) | 2-3 jours |
| Phase 7 | Animations, responsive, accessibilité, états vides | 2-3 jours |
| **Total** | | **18-25 jours** |

---

## Note sur la source de données

Comme pour les réservations, tout est en mock local (Zustand + localStorage). La structure est conçue pour être branchée sur une API :
- `useRecipeStore()` et `useInventoryStore()` → remplaçables par `useQuery()` (React Query)
- `usePortionCalculator()` → restera un hook frontend (calcul côté client) même avec une API, car le calcul croisé recettes × stock est trop fréquent pour être un appel serveur
- Les types (`Recipe`, `Product`, `Order`, `SupplierFull`) sont des interfaces → le backend peut les retourner tels quels
