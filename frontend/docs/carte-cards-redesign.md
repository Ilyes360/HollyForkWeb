# Redesign Page Ma Carte — Spécification finale

## 1. Vue d'ensemble

Refonte complète de la page Ma Carte. La page passe d'un layout générique
(4 KPIs → filtres → grille de cards uniformes) à un layout orienté service
(bandeau statut → filtres → sections catégories avec résumé → cards à deux modes).

```
┌─ Ma carte ──────────────────────────────── [+ Nouvelle recette] ─┐
│                                                                   │
│  6/8 recettes servables · 2 en rupture        [Riche] [Compact]  │
│                                                                   │
│  [Rechercher...]    [Tous ▾]                                      │
│                                                                   │
│  ENTRÉES · 2 RECETTES                     1 servable  1 en rupture│
│  ┌─────────────────────────┐  ┌──────────────────────────────────┐│
│  │ Salade de tomates    24 │  │ Tartare de saumon             0  ││
│  │ 12 € · 22.6%    ☆ #2   │  │ 18 € · 34.8%    ☆ #1            ││
│  │ ████████████████████████│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ││
│  │ 🍅 Tomates · 24p       │  │ 🍋 Citrons bio · 0p · 0 kg      ││
│  │ 🫒 Huile · 333p        │  │ 🐟 Saumon · 10p · 2 kg          ││
│  │ 🌿 Herbes · 25p        │  │  ▸ +2 ingrédients OK             ││
│  │  ▸ +1 ingrédient OK    │  │ Rupture : Citrons bio · Potager  ││
│  │ Limité par Tomates     │  └──────────────────────────────────┘│
│  └─────────────────────────┘                                      │
│                                                                   │
│  PLATS · 4 RECETTES                  2 servables  1 faible  1 rup.│
│  ┌───────────────┐ ┌───────────────┐ ┌───────────┐ ┌────────────┐│
│  │ Côtes porc 26 │ │ Risotto   25  │ │ Crev.   5 │ │ Filet    0 ││
│  │ ...           │ │ ...           │ │ ...       │ │ ...        ││
│  └───────────────┘ └───────────────┘ └───────────┘ └────────────┘│
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Bandeau statut (remplace les 4 KPIs)

Les 4 KPI cards actuelles (`CarteKpis`) sont supprimées et remplacées par
une ligne texte concise + un toggle de mode.

### Layout

```
[gauche]  6/8 recettes servables · 2 en rupture
[droite]  [Riche ◉] [Compact ○]
```

### Comportement
- "X en rupture" est cliquable → filtre la vue sur `non_realisable`
- "X en rupture" est coloré `text-destructive` ; "X servables" est `text-emerald-600`
- Si tout est servable : `"8/8 recettes servables"` sans mention de rupture
- Le toggle Riche/Compact change le mode d'affichage des cards (voir §4)

### Données
- `servableCount` = `recipePortions.filter(r => r.maxPortions > 0).length`
- `ruptureCount` = `recipePortions.filter(r => r.maxPortions === 0).length`
- `totalCount` = `recipePortions.length`

### Classes CSS
```
div.flex.items-center.justify-between
  p.text-sm.text-muted-foreground
    span.font-medium.text-emerald-600  → "{servableCount}/{totalCount} recettes servables"
    span.font-medium.text-destructive  → " · {ruptureCount} en rupture"
  div.flex.gap-1 (toggle buttons)
```

---

## 3. Headers de section catégorie

Chaque section (Entrée, Plat, Dessert, Boisson) a un header enrichi.

### Layout

```
ENTRÉES · 2 RECETTES                          1 servable  1 en rupture
─────────────────────────────────────────────────────────────────────────
```

### Structure
- **Gauche** : `"{CATÉGORIE} · {count} RECETTE{S}"` en `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
- **Droite** : compteurs par statut, chacun coloré :
  - `text-emerald-600` → `"{n} servable{s}"`
  - `text-amber-600` → `"{n} stock faible"`  (recettes avec `0 < maxPortions < seuil`)
  - `text-destructive` → `"{n} en rupture"` (recettes avec `maxPortions === 0`)
- **Séparateur** : `border-b border-border` sous le header (sauf première section)
- Le `Collapsible` reste — clic sur le header plie/déplie la section

### Seuil "stock faible" pour les recettes
On réutilise un seuil simple : une recette est "stock faible" si `maxPortions > 0 && maxPortions < 10`.
Ce seuil est cohérent avec le threshold du `PortionGauge`.

### Données par section
```ts
const servable = infos.filter(r => r.maxPortions >= 10).length
const stockFaible = infos.filter(r => r.maxPortions > 0 && r.maxPortions < 10).length
const rupture = infos.filter(r => r.maxPortions === 0).length
```

---

## 4. Cards recette — mode Riche (défaut)

### Structure de la card

```
┌─────────────────────────────────────────────────────────┐
│  Salade de tomates fraîches                          24 │  ← L1 : nom + portions
│  12,00 € · 22.6%    ☆ #2                       portions│  ← L2 : prix + FC% + rang
│  ██████████████████████████████████████████████████████ │  ← L3 : barre de progression
│                                                         │
│  🍅 Tomates                    🫒 Huile d'olive         │  ← L4-5 : chips ingrédients
│     24 port. · 12 kg              333 port. · 5 L       │     (mode détaillé si alerte,
│  🌿 Herbes fraîches                                     │      mode compact si OK)
│     25 port. · 0.5 kg                                   │
│   ▸ +1 ingrédient OK                                    │  ← L6 : collapsible OK
│                                                         │
│  Limité par Tomates                                     │  ← L7 : ligne faisabilité
└─────────────────────────────────────────────────────────┘
```

### L1 — Nom + portions

| Élément | Style |
|---------|-------|
| Nom | `text-sm font-semibold leading-snug` , tronqué si déborde |
| Portions (nombre) | `text-xl font-bold tabular-nums` aligné à droite |
| Portions (label) | `text-[10px] text-muted-foreground` sous le nombre |
| Couleur portions | `text-emerald-600` si ≥10, `text-amber-600` si 1-9, `text-destructive` si 0 |

### L2 — Prix + Food Cost + rang popularité

```
12,00 €  ·  22.6%    ☆ #2
```

| Élément | Style |
|---------|-------|
| Prix | `text-xs text-muted-foreground` |
| Séparateur | `" · "` |
| FC % | `text-xs font-medium` + couleur food cost (`text-emerald-600` < 25%, `text-amber-600` 25-35%, `text-destructive` > 35%) |
| Rang | `text-xs text-muted-foreground/60` , affiché uniquement si top 3. Le rang est basé sur le nombre de portions (plus de portions = plat le plus demandable = #1). Si pas top 3, rien. |

### L3 — Barre de progression

| Propriété | Valeur |
|-----------|--------|
| Hauteur | `h-1.5` (6px) |
| Fond | `bg-secondary` |
| Remplissage | `rounded-full`, couleur selon portions (emerald/amber/destructive) |
| Proportion | `getPortionGaugePercent(maxPortions)` (existant) |
| Animation | `transition-[width] duration-700 ease-out` |
| Coins | `rounded-full` sur conteneur et remplissage |

### L4-L5 — Chips ingrédients

Deux modes d'affichage selon le statut de l'ingrédient :

#### Mode détaillé (ingrédients en alerte : `portionsAllowed === 0` ou `portionsAllowed < 5`)

Toujours visible, jamais collapsé.

```
┌───────────────────────────────┐
│  🍋 Citrons bio               │
│     0 port. · 0 kg dispo      │
└───────────────────────────────┘
```

| Élément | Style |
|---------|-------|
| Conteneur | `rounded-lg p-2` |
| Fond | `bg-destructive/10` si rupture, `bg-amber-500/10` si stock faible |
| Icône | icône du produit via `getProductIcon(product.icon)`, `size-4`, dans un `size-6 rounded-md` avec fond coloré léger |
| Nom | `text-xs font-medium` |
| Sous-ligne | `text-[10px] text-muted-foreground` → `"{portionsAllowed} port. · {quantity} {unit} dispo"` |
| Layout | grille 2 colonnes `grid-cols-2 gap-2` |

#### Mode compact (ingrédients OK : `portionsAllowed >= 5`)

Affichés en chips inline, collapsibles.

```
🍅 Tomates · 24p    🫒 Huile · 333p    +1
```

| Élément | Style |
|---------|-------|
| Chip | `inline-flex items-center gap-1 rounded-md bg-muted/80 px-2 py-0.5` |
| Icône | icône produit `size-3.5 text-muted-foreground` |
| Texte | `text-[10px] text-muted-foreground` → `"{nom abrégé} · {portionsAllowed}p"` |
| Nom abrégé | premiers 10 caractères + "." si plus long |
| Overflow | si > 2 chips OK visibles : `"+{n}"` en chip avec même style |

#### Collapsible "+N ingrédients OK"

```
▸ +2 ingrédients OK
```

- Affiché si des ingrédients OK sont masqués (au-delà de 2 affichés)
- `text-[10px] text-muted-foreground cursor-pointer hover:text-foreground`
- Clic → déplie tous les chips OK restants
- Chevron `▸` tourne en `▾` quand ouvert
- Utiliser un `useState` local dans la card

#### Pas de chips du tout
Si la recette n'a aucun ingrédient en alerte ET que le mode est "Riche",
on affiche quand même les 2 premiers chips OK + "+N" collapsible.
Ça donne une identité visuelle à chaque card via les icônes d'ingrédient.

### L7 — Ligne de faisabilité (conditionnelle)

Affichée uniquement si la recette a un problème.

| Statut | Texte | Style |
|--------|-------|-------|
| Rupture | `"Rupture : {produit} · {fournisseur}"` | `text-xs text-destructive` |
| Stock faible | `"Limité par {produit} · {fournisseur}"` | `text-xs text-amber-600` |
| OK | rien — la ligne est absente | — |

Le fournisseur est récupéré via `suppliers.find(s => s.id === limitingProduct.supplierId)`.

### Fond conditionnel de la card

| Statut recette | Fond | Bordure |
|----------------|------|---------|
| Rupture (0 portions) | `bg-destructive/5` | `border-destructive/20` |
| Stock faible (<10 portions) | `bg-amber-50 dark:bg-amber-500/5` | `border-amber-200 dark:border-amber-500/20` |
| OK | `bg-card` (défaut) | `border-border` (défaut) |

### Interaction

| Event | Comportement |
|-------|-------------|
| Hover | `shadow-md -translate-y-0.5 transition-all duration-200` |
| Cursor | `cursor-pointer` |
| Clic card | ouvre la modale détail recette (existant) |
| Clic chip ingrédient | `e.stopPropagation()` + ouvre la fiche produit en modale (bonus, peut être V2) |
| Mount | `motion.div` avec stagger delay par card (existant) |

---

## 5. Cards recette — mode Compact

Toggle accessible via le bouton "Compact" du bandeau.
Les chips ingrédients et la ligne de faisabilité sont masquées.
La card ne montre que L1 + L2 + L3.

```
┌─────────────────────────────────────────┐
│  Salade de tomates fraîches          24 │
│  12,00 € · 22.6%                       │
│  ██████████████████████████████████████ │
└─────────────────────────────────────────┘
```

Le fond conditionnel et la couleur des portions restent — les cards à problème
sont toujours identifiables visuellement même sans les détails.

---

## 6. Rang de popularité

Le rang est dérivé du nombre de portions réalisables, trié descendant,
parmi les recettes actives uniquement.

```ts
const ranked = recipePortions
  .filter(r => r.isActive)
  .sort((a, b) => b.maxPortions - a.maxPortions)

// ranked[0] = #1, ranked[1] = #2, ranked[2] = #3
const rankMap = new Map<string, number>()
ranked.slice(0, 3).forEach((r, i) => rankMap.set(r.recipeId, i + 1))
```

Affiché avec `☆ #1` / `☆ #2` / `☆ #3` en `text-xs text-muted-foreground/60`.
Si maxPortions === 0, pas de rang (même si c'est une recette populaire —
un best-seller en rupture n'a pas de rang, ce qui renforce la tension).

---

## 7. Props modifiées

### `CarteRecipeCard`

```ts
interface CarteRecipeCardProps {
  recipe: Recipe
  portionInfo: RecipePortionInfo
  products: Product[]              // NOUVEAU — pour les chips ingrédients
  suppliers: SupplierFull[]        // NOUVEAU — pour le fournisseur sur la ligne de faisabilité
  rank: number | null              // NOUVEAU — rang popularité (1, 2, 3 ou null)
  mode: "rich" | "compact"        // NOUVEAU — mode d'affichage
  onClick: (recipeId: string) => void
  index?: number
}
```

### `CategorySection`

```ts
interface CategorySectionProps {
  category: RecipeCategory
  portionInfos: RecipePortionInfo[]
  recipes: Recipe[]
  products: Product[]              // NOUVEAU
  suppliers: SupplierFull[]        // NOUVEAU
  rankMap: Map<string, number>     // NOUVEAU
  mode: "rich" | "compact"        // NOUVEAU
  onSelectRecipe: (recipeId: string) => void
}
```

---

## 8. Ce qu'on supprime

| Élément | Raison |
|---------|--------|
| `CarteKpis` (composant) | Remplacé par le bandeau statut |
| Badge catégorie sur chaque card | Redondant avec le header de section |
| Icône recette en haut de card | Les icônes d'ingrédient donnent maintenant l'identité |
| "portions" en texte grand centré | Remplacé par nombre en haut à droite |
| Import de `PortionGauge` dans la card | Remplacé par la barre custom |

---

## 9. Ce qu'on ne fait PAS

- Pas de jauge circulaire
- Pas de kanban / regroupement par faisabilité
- Pas d'interprétation textuelle ("Vous devriez commander...")
- Pas de tendance (+3/-5) — pas de données historiques
- Pas de drag & drop
- Pas de popover au hover sur ingrédient (V2 — nécessite ProductDetailModal en mode embedded)
- Pas d'icône avec remplissage partiel (illisible à 16px — on utilise le fond coloré du chip)

---

## 10. Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/carte/carte-recipe-card.tsx` | **Refonte complète** |
| `src/components/carte/category-section.tsx` | **Modifier** — header enrichi, nouvelles props |
| `src/components/carte/carte-kpis.tsx` | **Supprimer** (ou garder le fichier vide) |
| `src/pages/carte.tsx` | **Modifier** — retirer KPIs, ajouter bandeau + toggle mode, passer products/suppliers/rankMap |
| `src/components/carte/carte-filters.tsx` | Pas de changement |
| `src/components/carte/recipe-detail-modal.tsx` | Pas de changement |
