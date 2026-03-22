# Plan — Refonte complète page Mon Stock

## Contexte

La page Mon Stock actuelle est un CRUD générique (header → 5 cards zones → tableau 9 colonnes → modale détail). La refonte crée le **miroir inversé** de Ma Carte : chaque card produit montre ses recettes avec portions, exactement comme chaque card recette de Ma Carte montre ses ingrédients avec stock. Même design system, même qualité visuelle, direction opposée dans la chaîne.

**Deux vues avec toggle :** Par zone (défaut) / Par urgence.
**Configuration inline :** side panel pour zones, plus de page `/stocks/configuration` séparée.
**Mode inventaire rapide :** édition inline des quantités zone par zone.

---

## Fichiers touchés

| # | Fichier | Action |
|---|---------|--------|
| 1 | `src/components/stock/stock-product-card.tsx` | **Refonte complète** — nouvelle card miroir de carte-recipe-card |
| 2 | `src/components/stock/stock-zone-section.tsx` | **Nouveau** — section collapsible par zone (miroir de category-section) |
| 3 | `src/components/stock/stock-urgency-section.tsx` | **Nouveau** — section par urgence (À commander / À surveiller / Stock OK) |
| 4 | `src/components/stock/stock-filters.tsx` | **Nouveau** — barre de filtres (recherche + catégorie + fournisseur) |
| 5 | `src/components/stock/stock-header.tsx` | **Refonte** — résumé + toggle vue + bouton ajouter |
| 6 | `src/components/stock/zone-manager-panel.tsx` | **Nouveau** — side panel CRUD zones |
| 7 | `src/components/stock/stock-inventory-banner.tsx` | **Nouveau** — bannière mode inventaire |
| 8 | `src/pages/stocks.tsx` | **Refonte complète** — orchestration des deux vues |
| 9 | `src/components/stock/types.ts` | **Enrichir** — nouveaux types pour les vues |
| 10 | `src/components/stock/utils.ts` | **Enrichir** — nouvelles fonctions utilitaires |
| 11 | `src/lib/copy/stock.ts` | **Enrichir** — textes pour nouvelles sections |
| 12 | `src/router.tsx` | **Modifier** — supprimer route `/stocks/configuration` |
| 13 | `src/components/layout/sidebar/nav-main.tsx` | **Modifier** — supprimer lien Configuration dans nav |

---

## Étape 1 — Types enrichis (`stock/types.ts`)

### Nouveaux types à ajouter

```ts
/** Vue active sur la page stock */
export type StockViewMode = "zone" | "urgency"

/** Catégorie d'urgence pour la vue "Par urgence" */
export type UrgencyCategory = "a_commander" | "a_surveiller" | "stock_ok"

/** Labels pour les sections urgence */
export const URGENCY_LABELS: Record<UrgencyCategory, string> = {
  a_commander: "À commander",
  a_surveiller: "À surveiller",
  stock_ok: "Stock OK",
}

/** Couleurs des sections urgence */
export const URGENCY_COLORS: Record<UrgencyCategory, { text: string; dot: string }> = {
  a_commander: { text: "#A32D2D", dot: "#E24B4A" },
  a_surveiller: { text: "#BA7517", dot: "#EF9F27" },
  stock_ok: { text: "#639922", dot: "#97C459" },
}

/** Options de filtre statut pour la barre de filtres */
export const STOCK_VIEW_OPTIONS = [
  { value: "zone", label: "Par zone" },
  { value: "urgency", label: "Par urgence" },
] as const
```

### Types existants inchangés
`Product`, `ProductStatus`, `ProductUnit`, `ProductPortionSummary`, `PortionEquivalent`, `STATUS_CONFIG`, `UNIT_LABELS`, `ZONE_LABELS`, `CATEGORY_LABELS` — tous gardés tels quels.

---

## Étape 2 — Utilitaires enrichis (`stock/utils.ts`)

### Nouvelles fonctions à ajouter

```ts
/**
 * Calcule la catégorie d'urgence d'un produit.
 * - "a_commander" : rupture (qty = 0) OU qty < minStock
 * - "a_surveiller" : stock faible (qty > 0 mais < minStock × 1.5)
 *                    OU expiration dans les 3 prochains jours même si stock OK
 * - "stock_ok" : tout le reste
 */
export function getUrgencyCategory(product: Product): UrgencyCategory {
  const status = getProductStatus(product)
  if (status === "rupture" || status === "stock_faible") return "a_commander"

  // Expiration dans 3 jours
  const daysUntilExp = getDaysUntilExpiration(product)
  if (daysUntilExp <= 3) return "a_surveiller"

  // Stock entre minStock et minStock × 1.5 (proche de faible)
  if (product.quantity < product.minStock * 1.5) return "a_surveiller"

  return "stock_ok"
}

/**
 * Calcule le nombre de jours avant expiration.
 */
export function getDaysUntilExpiration(product: Product): number {
  const exp = new Date(product.expirationDate)
  const now = new Date()
  return Math.ceil((exp.getTime() - now.getTime()) / 86400000)
}

/**
 * Calcule la "santé" d'une zone : le pire statut parmi ses produits.
 * Retourne "ok" | "warning" | "danger".
 */
export function getZoneHealth(
  products: Product[]
): "ok" | "warning" | "danger" {
  const hasRupture = products.some((p) => getProductStatus(p) === "rupture")
  if (hasRupture) return "danger"
  const hasFaible = products.some((p) => getProductStatus(p) === "stock_faible")
  if (hasFaible) return "warning"
  return "ok"
}

/**
 * Calcule le pourcentage de remplissage global d'une zone.
 */
export function getZoneFillPercent(products: Product[]): number {
  if (products.length === 0) return 0
  const total = products.reduce(
    (sum, p) => sum + (p.maxStock > 0 ? p.quantity / p.maxStock : 1),
    0
  )
  return Math.round((total / products.length) * 100)
}

/**
 * Trie les produits par urgence : ruptures → stock faible → OK.
 * À statut égal, le produit dans le plus de recettes remonte en premier.
 */
export function sortProductsByUrgency(
  products: Product[],
  portionSummaries: Map<string, ProductPortionSummary>
): Product[] {
  const statusPriority: Record<ProductStatus, number> = {
    rupture: 0,
    stock_faible: 1,
    stock_ok: 2,
    surstock: 3,
  }
  return [...products].sort((a, b) => {
    const sa = statusPriority[getProductStatus(a)]
    const sb = statusPriority[getProductStatus(b)]
    if (sa !== sb) return sa - sb
    const ra = portionSummaries.get(a.id)?.portionEquivalents.length ?? 0
    const rb = portionSummaries.get(b.id)?.portionEquivalents.length ?? 0
    if (ra !== rb) return rb - ra // plus de recettes → plus haut
    return a.name.localeCompare(b.name, "fr")
  })
}

/**
 * Calcule la valeur totale du stock.
 */
export function getTotalStockValue(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)
}
```

### Fonctions existantes conservées
`getProductStatus`, `getStockPercentage`, `getProductValue`, `getSupplierName`, `formatCurrency`, `getCategoryLabel`, `getZoneLabel`, `formatPortionEquivalents` — toutes inchangées.

---

## Étape 3 — Copy enrichi (`lib/copy/stock.ts`)

### Ajouts

```ts
export const STOCK_SECTION_LABELS = {
  a_commander: "À commander",
  a_surveiller: "À surveiller",
  stock_ok: "Stock OK",
} as const

export function getStockSummaryText(
  totalProducts: number,
  totalValue: number,
): string {
  return `${totalProducts} produit${totalProducts > 1 ? "s" : ""} · Valeur stock : ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totalValue)}`
}
```

Conserver `getStockStatusInsight` et `getStockEmptyState` existants.

---

## Étape 4 — StockHeader refait (`stock/stock-header.tsx`)

### Supprimé
Tout le contenu actuel (juste titre + bouton).

### Nouveau contenu

```tsx
interface StockHeaderProps {
  totalProducts: number
  totalValue: number
  ruptureCount: number
  faibleCount: number
  okCount: number
  viewMode: StockViewMode
  onViewModeChange: (mode: StockViewMode) => void
  onAddProduct: () => void
  onOpenZoneManager: () => void
}
```

**Layout :**

```
┌──────────────────────────────────────────────────────────────────────┐
│  Mon stock                                                           │
│  28 produits · Valeur stock : 1 204 €                                │
│  ● 2 ruptures  ● 4 stock faible  ● 22 OK            [⚙] [+ Produit]│
│                                                                      │
│  [Par zone ▪] [Par urgence]   [Rechercher...] [Catégorie▾] [Fourn▾] │
└──────────────────────────────────────────────────────────────────────┘
```

**Implémentation détaillée :**

```tsx
export function StockHeader({
  totalProducts, totalValue,
  ruptureCount, faibleCount, okCount,
  viewMode, onViewModeChange,
  onAddProduct, onOpenZoneManager,
}: StockHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Ligne 1 : titre + actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="font-display text-lg font-semibold tracking-tight">
            {PAGE_META.stocks.title}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {getStockSummaryText(totalProducts, totalValue)}
          </p>
        </div>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onOpenZoneManager}
          aria-label="Gérer les zones de stockage"
        >
          <HugeiconsIcon icon={Settings02Icon} className="size-4" strokeWidth={2} />
        </button>
        <Button onClick={onAddProduct}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Nouveau produit
        </Button>
      </div>

      {/* Ligne 2 : compteurs colorés */}
      <div className="flex items-center gap-4 text-xs">
        {ruptureCount > 0 && (
          <span className="flex items-center gap-1.5 font-medium" style={{ color: "#A32D2D" }}>
            <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "#E24B4A" }} />
            {ruptureCount} rupture{ruptureCount > 1 ? "s" : ""}
          </span>
        )}
        {faibleCount > 0 && (
          <span className="flex items-center gap-1.5 font-medium" style={{ color: "#BA7517" }}>
            <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "#EF9F27" }} />
            {faibleCount} stock faible
          </span>
        )}
        <span className="flex items-center gap-1.5 font-medium" style={{ color: "#639922" }}>
          <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "#97C459" }} />
          {okCount} OK
        </span>
      </div>

      {/* Ligne 3 : toggle vue */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "zone"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onViewModeChange("zone")}
          >
            Par zone
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              viewMode === "urgency"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onViewModeChange("urgency")}
          >
            Par urgence
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Imports :**
`PAGE_META` de `@/lib/copy/pages`, `Button` de `ui/button`, `HugeiconsIcon` + `Settings02Icon` + `Add01Icon` de hugeicons, `cn` de `@/lib/utils`, `getStockSummaryText` de `@/lib/copy/stock`, `StockViewMode` de `./types`.

---

## Étape 5 — StockFilters (`stock/stock-filters.tsx`)

### Nouveau composant

```tsx
interface StockFiltersProps {
  search: string
  categoryFilter: string
  supplierFilter: string
  onSearchChange: (value: string) => void
  onCategoryFilterChange: (value: string) => void
  onSupplierFilterChange: (value: string) => void
  categories: { value: string; label: string }[]
  suppliers: { value: string; label: string }[]
}
```

**Layout :** flex row, gap 3, items center.

```tsx
export function StockFilters({
  search, categoryFilter, supplierFilter,
  onSearchChange, onCategoryFilterChange, onSupplierFilterChange,
  categories, suppliers,
}: StockFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <InputGroup className="w-64 bg-background">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-[170px] hidden sm:flex">
          <SelectValue>
            {categories.find((o) => o.value === categoryFilter)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {categories.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
        <SelectTrigger className="w-[170px] hidden sm:flex">
          <SelectValue>
            {suppliers.find((o) => o.value === supplierFilter)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {suppliers.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

**Imports :** `InputGroup/InputGroupAddon/InputGroupInput` de `ui/input-group`, `Select/SelectTrigger/SelectValue/SelectContent/SelectItem` de `ui/select`, `HugeiconsIcon` + `Search01Icon`.

---

## Étape 6 — StockProductCard refaite (`stock/stock-product-card.tsx`)

### Supprimé
Tout le contenu actuel.

### Nouvelle interface

```ts
interface StockProductCardProps {
  product: Product
  supplier: SupplierFull | null
  portionSummary: ProductPortionSummary | null
  recipePortions: RecipePortionInfo[]
  onClick: (product: Product) => void
  onSelectRecipe: (recipeId: string) => void
  onOrder: (product: Product) => void
  /** Mode inventaire : affiche un input au lieu du stock */
  inventoryMode?: boolean
  inventoryValue?: number
  onInventoryChange?: (productId: string, value: number) => void
  index?: number
}
```

### Structure visuelle de la card

```
┌─────────────────────────────────────────────────────┐
│  [IngredientIcon 28px]  Filet de bœuf          0   │
│                         Metro · ~2j livr.      /10  │
│                                                 kg  │
│  ████████████░░░░░░░░░░░░░░░░░░░░  (barre 5px)     │
│                                                     │
│  ● Tartare saumon · 0p  ● Filet poivre · 0p        │  ← chips recettes
│  ● Carpaccio · 0p                                   │
│                                                     │
│  Rupture                            Commander →     │
└─────────────────────────────────────────────────────┘
```

### Implémentation complète

```tsx
export function StockProductCard({
  product, supplier, portionSummary, recipePortions,
  onClick, onSelectRecipe, onOrder,
  inventoryMode = false, inventoryValue, onInventoryChange,
  index = 0,
}: StockProductCardProps) {
  const status = getProductStatus(product)
  const isRupture = status === "rupture"
  const isFaible = status === "stock_faible"
  const hasProblems = isRupture || isFaible

  const stockPercent = getStockPercentage(product)
  const daysUntilExp = getDaysUntilExpiration(product)

  // ── Couleurs conditionnelles (miroir de carte-recipe-card) ──

  const barFillColor = isRupture ? "#E24B4A" : isFaible ? "#EF9F27" : "#97C459"
  const barTrackColor = isRupture
    ? "rgba(226,75,74,0.12)"
    : isFaible ? "rgba(239,159,39,0.12)" : "rgba(0,0,0,0.08)"
  const stockTextColor = isRupture ? "#A32D2D" : isFaible ? "#BA7517" : "#639922"

  const cardStyle: React.CSSProperties = {
    padding: "12px 14px",
    maxWidth: 420,
    ...(isRupture && {
      backgroundColor: "rgba(226,75,74,0.04)",
      borderColor: "rgba(226,75,74,0.15)",
    }),
    ...(isFaible && {
      backgroundColor: "rgba(239,159,39,0.04)",
      borderColor: "rgba(239,159,39,0.15)",
    }),
  }

  // ── Chips recettes ──
  // Pour les produits à problème : chaque recette individuellement
  // Pour les produits OK : chip résumé "N recettes · Xp"
  const equivalents = portionSummary?.portionEquivalents ?? []
  const sortedEquivalents = [...equivalents].sort(
    (a, b) => a.portionsEnabled - b.portionsEnabled
  )

  // ── Expiration info ──
  const expirationBadge = daysUntilExp <= 1
    ? { text: "Exp. demain !", color: "#A32D2D", bg: "rgba(226,75,74,0.10)" }
    : daysUntilExp <= 3
      ? { text: `Exp. ${daysUntilExp}j`, color: "#A32D2D", bg: "rgba(226,75,74,0.10)" }
      : daysUntilExp <= 7
        ? { text: `Exp. ${daysUntilExp}j`, color: "#BA7517", bg: "rgba(239,159,39,0.10)" }
        : null

  const handleCardClick = () => {
    if (!inventoryMode) onClick(product)
  }

  const handleRecipeChipClick = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation()
    onSelectRecipe(recipeId)
  }

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOrder(product)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{
        duration: 0.25,
        delay: index * 0.03,
        ease: [0.25, 0.1, 0.25, 1],
        layout: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
      }}
    >
      <Card
        role="article"
        aria-label={`${product.name} — ${product.quantity} ${UNIT_LABELS[product.unit]}`}
        className={cn(
          "overflow-visible rounded-xl transition-all duration-200",
          !inventoryMode && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
        )}
        style={cardStyle}
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === "Enter") handleCardClick() }}
      >
        {/* ── L1 : Header — Icône + Nom + Stock ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <IngredientIcon product={product} size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] leading-[1.3] font-medium truncate">
                {product.name}
              </h3>
              <p className="mt-px text-[11px] text-muted-foreground truncate">
                {supplier?.name ?? "—"}
                {supplier?.averageDeliveryDays != null && (
                  <> · ~{supplier.averageDeliveryDays}j livr.</>
                )}
                {equivalents.length > 0 && (
                  <> · {equivalents.length} recette{equivalents.length > 1 ? "s" : ""}</>
                )}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            {inventoryMode ? (
              <input
                type="number"
                className="w-16 rounded-md border border-border bg-background px-2 py-1 text-right text-lg font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
                value={inventoryValue ?? product.quantity}
                onChange={(e) => onInventoryChange?.(product.id, Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                min={0}
                step={0.1}
              />
            ) : (
              <>
                <span
                  className="text-[22px] leading-none font-medium tabular-nums"
                  style={{ color: stockTextColor }}
                >
                  {product.quantity}
                </span>
                <p className="mt-px text-[9px] text-muted-foreground">
                  / {product.maxStock} {UNIT_LABELS[product.unit]}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── L2 : Barre de stock ── */}
        <div
          className="mt-2 h-[5px] w-full overflow-hidden rounded-full"
          style={{ backgroundColor: barTrackColor }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${Math.min(stockPercent, 100)}%`,
              backgroundColor: barFillColor,
            }}
          />
        </div>

        {/* ── L3 : Chips recettes (miroir des chips ingrédients de Ma Carte) ── */}
        {equivalents.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {hasProblems ? (
              /* Produit à problème : chaque recette individuellement */
              sortedEquivalents.map((eq) => {
                const chipColor = eq.portionsEnabled === 0
                  ? { dot: "#E24B4A", bg: isRupture ? "rgba(226,75,74,0.10)" : "rgba(239,159,39,0.10)" }
                  : eq.portionsEnabled < 5
                    ? { dot: "#EF9F27", bg: "rgba(239,159,39,0.08)" }
                    : { dot: "#97C459", bg: undefined }
                return (
                  <button
                    key={eq.recipeId}
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] transition-shadow hover:ring-1 hover:ring-border cursor-pointer",
                      chipColor.bg ? "" : "bg-secondary"
                    )}
                    style={chipColor.bg ? { backgroundColor: chipColor.bg } : undefined}
                    onClick={(e) => handleRecipeChipClick(e, eq.recipeId)}
                  >
                    <span
                      className="inline-block size-[5px] shrink-0 rounded-full"
                      style={{ backgroundColor: chipColor.dot }}
                    />
                    <span className="text-muted-foreground truncate max-w-[100px]">
                      {eq.recipeName}
                    </span>
                    <span className="text-muted-foreground">· {eq.portionsEnabled}p</span>
                  </button>
                )
              })
            ) : (
              /* Produit OK : chip résumé */
              <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-0.5 text-[10px]">
                <span
                  className="inline-block size-[5px] shrink-0 rounded-full"
                  style={{ backgroundColor: "#97C459" }}
                />
                <span className="text-muted-foreground">
                  {equivalents.length} recette{equivalents.length > 1 ? "s" : ""} · {portionSummary?.totalPortionsEnabled ?? 0}p
                </span>
              </span>
            )}
          </div>
        )}

        {/* ── L4 : Footer — Badge + Action ── */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Badge rupture */}
            {isRupture && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: "rgba(226,75,74,0.12)", color: "#A32D2D" }}
              >
                Rupture
              </span>
            )}
            {/* Badge faible */}
            {isFaible && !isRupture && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: "rgba(239,159,39,0.10)", color: "#BA7517" }}
              >
                Stock faible
              </span>
            )}
            {/* Badge expiration */}
            {expirationBadge && !isRupture && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: expirationBadge.bg, color: expirationBadge.color }}
              >
                {expirationBadge.text}
              </span>
            )}
            {/* Valeur pour produits OK */}
            {!hasProblems && !expirationBadge && (
              <span className="text-[11px] text-muted-foreground">
                {formatCurrency(product.quantity * product.unitPrice)}
              </span>
            )}
          </div>

          {/* CTA Commander pour produits à problème */}
          {hasProblems && !inventoryMode && (
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-medium cursor-pointer transition-colors hover:opacity-80"
              style={{ color: "#E07850" }}
              onClick={handleOrderClick}
            >
              Commander
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" strokeWidth={2} />
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
```

**Imports :**
- `motion` de `motion/react`
- `HugeiconsIcon` + `ArrowRight01Icon` de hugeicons
- `Card` de `ui/card`
- `IngredientIcon` de `@/components/carte/ingredient-icon`
- `Product`, `UNIT_LABELS` de `./types`
- `ProductPortionSummary`, `PortionEquivalent` de `./types`
- `RecipePortionInfo` de `@/components/carte/types`
- `SupplierFull` de `@/components/commandes/types`
- `getProductStatus`, `getStockPercentage`, `formatCurrency`, `getDaysUntilExpiration` de `./utils`
- `cn` de `@/lib/utils`

---

## Étape 7 — StockZoneSection (`stock/stock-zone-section.tsx`)

### Nouveau composant — miroir de `carte/category-section.tsx`

```ts
interface StockZoneSectionProps {
  zone: StorageZoneConfig
  products: Product[]
  suppliers: SupplierFull[]
  portionSummaries: Map<string, ProductPortionSummary>
  recipePortions: RecipePortionInfo[]
  /** Auto-collapse si tout OK */
  defaultCollapsed?: boolean
  onSelectProduct: (product: Product) => void
  onSelectRecipe: (recipeId: string) => void
  onOrder: (product: Product) => void
  /** Mode inventaire */
  inventoryMode?: boolean
  inventoryValues?: Map<string, number>
  onInventoryChange?: (productId: string, value: number) => void
}
```

**Implémentation :**

```tsx
export function StockZoneSection({
  zone, products, suppliers, portionSummaries, recipePortions,
  defaultCollapsed = false,
  onSelectProduct, onSelectRecipe, onOrder,
  inventoryMode = false, inventoryValues, onInventoryChange,
}: StockZoneSectionProps) {
  if (products.length === 0) return null

  const health = getZoneHealth(products)
  const fillPercent = getZoneFillPercent(products)

  const ruptureCount = products.filter((p) => getProductStatus(p) === "rupture").length
  const faibleCount = products.filter((p) => getProductStatus(p) === "stock_faible").length
  const alertCount = ruptureCount + faibleCount

  const sorted = sortProductsByUrgency(products, portionSummaries)

  // Couleurs santé zone
  const healthColors = {
    danger: { bar: "#E24B4A", text: "#A32D2D" },
    warning: { bar: "#EF9F27", text: "#BA7517" },
    ok: { bar: "#97C459", text: "#639922" },
  }
  const colors = healthColors[health]

  return (
    <Collapsible defaultOpen={!defaultCollapsed}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between border-b border-border pb-3 pt-2 text-left",
          defaultCollapsed && "opacity-60 hover:opacity-100 transition-opacity"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Icône zone */}
          <div className="flex size-6 items-center justify-center rounded-md bg-muted">
            <HugeiconsIcon
              icon={ZONE_ICON_MAP[zone.id] ?? DEFAULT_ZONE_ICON}
              className="size-3.5 text-muted-foreground"
              strokeWidth={2}
            />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {zone.label} · {products.length} produit{products.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Compteurs colorés */}
          {ruptureCount > 0 && (
            <span className="text-xs font-medium" style={{ color: "#A32D2D" }}>
              {ruptureCount} rupture{ruptureCount > 1 ? "s" : ""}
            </span>
          )}
          {faibleCount > 0 && (
            <span className="text-xs font-medium" style={{ color: "#BA7517" }}>
              {faibleCount} stock faible
            </span>
          )}
          {alertCount === 0 && (
            <span className="text-xs font-medium" style={{ color: "#639922" }}>
              Tout OK
            </span>
          )}

          {/* Mini barre santé 60px */}
          <div
            className="h-1 w-[60px] overflow-hidden rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${fillPercent}%`,
                backgroundColor: colors.bar,
              }}
            />
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          layout
          className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 rounded-lg transition-colors duration-500"
        >
          <AnimatePresence mode="popLayout">
            {sorted.map((product, i) => {
              const sup = suppliers.find((s) => s.id === product.supplierId) ?? null
              return (
                <StockProductCard
                  key={product.id}
                  product={product}
                  supplier={sup}
                  portionSummary={portionSummaries.get(product.id) ?? null}
                  recipePortions={recipePortions}
                  onClick={onSelectProduct}
                  onSelectRecipe={onSelectRecipe}
                  onOrder={onOrder}
                  inventoryMode={inventoryMode}
                  inventoryValue={inventoryValues?.get(product.id)}
                  onInventoryChange={onInventoryChange}
                  index={i}
                />
              )
            })}
          </AnimatePresence>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

**Imports :** `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` de `ui/collapsible`, `AnimatePresence`, `motion` de `motion/react`, icônes zone (`ThermometerColdIcon`, `ContainerIcon`, `Cabinet01Icon`, `DrinkIcon`), `StockProductCard`, utilitaires stock.

**Constantes icônes zone :** réutiliser le `ZONE_ICON_MAP` existant dans `storage-zones.tsx`, l'extraire dans `utils.ts` ou le dupliquer.

---

## Étape 8 — StockUrgencySection (`stock/stock-urgency-section.tsx`)

### Nouveau composant — sections "À commander" / "À surveiller" / "Stock OK"

```ts
interface StockUrgencySectionProps {
  urgency: UrgencyCategory
  products: Product[]
  suppliers: SupplierFull[]
  portionSummaries: Map<string, ProductPortionSummary>
  recipePortions: RecipePortionInfo[]
  /** Stock OK est collapsé par défaut */
  defaultCollapsed?: boolean
  onSelectProduct: (product: Product) => void
  onSelectRecipe: (recipeId: string) => void
  onOrder: (product: Product) => void
}
```

**Implémentation :**

```tsx
export function StockUrgencySection({
  urgency, products, suppliers, portionSummaries, recipePortions,
  defaultCollapsed = false,
  onSelectProduct, onSelectRecipe, onOrder,
}: StockUrgencySectionProps) {
  if (products.length === 0) return null

  const colors = URGENCY_COLORS[urgency]
  const sorted = sortProductsByUrgency(products, portionSummaries)

  return (
    <Collapsible defaultOpen={!defaultCollapsed}>
      <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-border pb-3 pt-2 text-left">
        <span className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: colors.dot }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {URGENCY_LABELS[urgency]} · {products.length} produit{products.length > 1 ? "s" : ""}
          </span>
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          layout
          className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 rounded-lg"
        >
          <AnimatePresence mode="popLayout">
            {sorted.map((product, i) => {
              const sup = suppliers.find((s) => s.id === product.supplierId) ?? null
              return (
                <StockProductCard
                  key={product.id}
                  product={product}
                  supplier={sup}
                  portionSummary={portionSummaries.get(product.id) ?? null}
                  recipePortions={recipePortions}
                  onClick={onSelectProduct}
                  onSelectRecipe={onSelectRecipe}
                  onOrder={onOrder}
                  index={i}
                />
              )
            })}
          </AnimatePresence>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

---

## Étape 9 — ZoneManagerPanel (`stock/zone-manager-panel.tsx`)

### Nouveau composant — side panel pour gérer les zones

Side panel qui s'ouvre à droite, utilise `Sheet` de `ui/sheet`.

```ts
interface ZoneManagerPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Contenu du panel :**
- Header "Zones de stockage" + bouton fermer
- Liste des zones existantes, chaque zone = une row avec :
  - Nom éditable inline (double-clic → input, Enter → save)
  - Compteur produits ("N produits")
  - Bouton supprimer (icône poubelle) → confirmation si `productCount > 0`
- Bouton "+ Ajouter une zone" en bas (inline : apparaît un input, Enter → crée)
- Séparateur
- Lien "Gérer les catégories → Paramètres" en texte discret, navigate vers `/settings`

**Implémentation :**

```tsx
export function ZoneManagerPanel({ open, onOpenChange }: ZoneManagerPanelProps) {
  const navigate = useNavigate()
  const {
    storageZones, products,
    addStorageZone, updateStorageZone, deleteStorageZone,
  } = useInventoryStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [newZoneName, setNewZoneName] = useState("")
  const [showNewInput, setShowNewInput] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StorageZoneConfig | null>(null)

  const zoneProductCount = (zoneId: string) =>
    products.filter((p) => p.storageZone === zoneId).length

  const handleStartEdit = (zone: StorageZoneConfig) => {
    setEditingId(zone.id)
    setEditValue(zone.label)
  }

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      updateStorageZone(editingId, { label: editValue.trim() })
    }
    setEditingId(null)
  }

  const handleAddZone = () => {
    if (!newZoneName.trim()) return
    const id = newZoneName.trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
    addStorageZone({ id, label: newZoneName.trim() })
    setNewZoneName("")
    setShowNewInput(false)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteStorageZone(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[380px] sm:max-w-[380px]">
          <SheetHeader>
            <SheetTitle>Zones de stockage</SheetTitle>
            <SheetDescription>
              Gérez vos zones de stockage. Les produits sont organisés par zone.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-1">
            {storageZones.map((zone) => {
              const count = zoneProductCount(zone.id)
              const isEditing = editingId === zone.id

              return (
                <div
                  key={zone.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <HugeiconsIcon
                      icon={ZONE_ICON_MAP[zone.id] ?? DEFAULT_ZONE_ICON}
                      className="size-3.5 text-muted-foreground"
                      strokeWidth={2}
                    />
                  </div>

                  {isEditing ? (
                    <input
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditingId(null) }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm font-medium cursor-pointer"
                      onDoubleClick={() => handleStartEdit(zone)}
                    >
                      {zone.label}
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {count} produit{count > 1 ? "s" : ""}
                  </span>

                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={() => setDeleteTarget(zone)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
                  </button>
                </div>
              )
            })}

            {/* Ajouter une zone */}
            {showNewInput ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nom de la zone..."
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddZone()
                    if (e.key === "Escape") { setShowNewInput(false); setNewZoneName("") }
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddZone} disabled={!newZoneName.trim()}>
                  Ajouter
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer"
                onClick={() => setShowNewInput(true)}
              >
                <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
                Ajouter une zone
              </button>
            )}
          </div>

          {/* Lien catégories */}
          <div className="mt-6 border-t pt-4">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={() => { onOpenChange(false); navigate("/settings") }}
            >
              Gérer les catégories → Paramètres
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      {deleteTarget && (
        <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer « {deleteTarget.label} »</DialogTitle>
              <DialogDescription>
                {zoneProductCount(deleteTarget.id) > 0
                  ? `Cette zone contient ${zoneProductCount(deleteTarget.id)} produit${zoneProductCount(deleteTarget.id) > 1 ? "s" : ""}. Les produits seront déplacés vers « Non assigné ».`
                  : "Êtes-vous sûr de vouloir supprimer cette zone ?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>Supprimer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
```

**Imports :** `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` de `ui/sheet`, `Dialog/*` de `ui/dialog`, `Button`, `HugeiconsIcon` + `Delete02Icon` + `Add01Icon` + `Settings02Icon`, `useInventoryStore`, `useNavigate`.

---

## Étape 10 — Bannière mode inventaire (`stock/stock-inventory-banner.tsx`)

### Nouveau composant

```ts
interface StockInventoryBannerProps {
  changedCount: number
  onSave: () => void
  onCancel: () => void
}
```

```tsx
export function StockInventoryBanner({ changedCount, onSave, onCancel }: StockInventoryBannerProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <div>
          <p className="text-sm font-medium">Mode inventaire actif</p>
          <p className="text-xs text-muted-foreground">
            Modifiez les quantités directement sur les cards.
            {changedCount > 0 && (
              <> <span className="font-medium text-primary">{changedCount} modification{changedCount > 1 ? "s" : ""}</span></>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button size="sm" onClick={onSave} disabled={changedCount === 0}>
          Sauvegarder l'inventaire
        </Button>
      </div>
    </div>
  )
}
```

---

## Étape 11 — Page stocks.tsx refaite

### Supprimé
Tout le contenu actuel.

### Nouveau contenu complet

```tsx
export default function StocksPage() {
  usePageTitle("Mon stock")
  const navigate = useNavigate()

  // ── Stores ──
  const { products, suppliers, orders, storageZones, categories, updateProduct } = useInventoryStore()
  const recipes = useRecipeStore((s) => s.recipes)
  const deleteProduct = useInventoryStore((s) => s.deleteProduct)
  const addOrder = useInventoryStore((s) => s.addOrder)

  // ── Portions ──
  const { recipePortions, productPortionSummaries } = usePortionCalculator(recipes, products, suppliers)
  const portionMap = useMemo(
    () => new Map(productPortionSummaries.map((s) => [s.productId, s])),
    [productPortionSummaries]
  )

  // ── State ──
  const [viewMode, setViewMode] = useState<StockViewMode>("zone")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("toutes")
  const [supplierFilter, setSupplierFilter] = useState("tous")

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [zoneManagerOpen, setZoneManagerOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderSupplierId, setOrderSupplierId] = useState<string | null>(null)
  const [preSelectedProductId, setPreSelectedProductId] = useState<string | undefined>(undefined)
  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false)
  const [supplierSheetId, setSupplierSheetId] = useState<string | null>(null)

  // RecipeDetailModal state (for recipe chip clicks)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false)

  // Inventory mode
  const [inventoryMode, setInventoryMode] = useState(false)
  const [inventoryValues, setInventoryValues] = useState<Map<string, number>>(new Map())

  // ── Computed ──
  const currentProduct = selectedProduct
    ? products.find((p) => p.id === selectedProduct.id) ?? null
    : null
  const currentSupplier = currentProduct
    ? suppliers.find((s) => s.id === currentProduct.supplierId) ?? null
    : null
  const currentPortionSummary = currentProduct
    ? portionMap.get(currentProduct.id) ?? null
    : null
  const supplierSheetSupplier = supplierSheetId
    ? suppliers.find((s) => s.id === supplierSheetId) ?? null
    : null

  // Recipe for chip click
  const selectedRecipe = selectedRecipeId
    ? recipes.find((r) => r.id === selectedRecipeId) ?? null
    : null
  const selectedRecipePortionInfo = selectedRecipeId
    ? recipePortions.find((p) => p.recipeId === selectedRecipeId) ?? null
    : null

  // ── Filtering ──
  const filtered = useMemo(() => {
    let result = products
    if (categoryFilter !== "toutes") {
      result = result.filter((p) => p.category === categoryFilter)
    }
    if (supplierFilter !== "tous") {
      result = result.filter((p) => p.supplierId === supplierFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }
    return result
  }, [products, categoryFilter, supplierFilter, search])

  // ── Compteurs ──
  const ruptureCount = products.filter((p) => getProductStatus(p) === "rupture").length
  const faibleCount = products.filter((p) => getProductStatus(p) === "stock_faible").length
  const okCount = products.length - ruptureCount - faibleCount
  const totalValue = getTotalStockValue(products)

  // ── Filter options ──
  const categoryOptions = useMemo(() => [
    { value: "toutes", label: "Toutes catégories" },
    ...categories.map((c) => ({ value: c.id, label: c.label })),
  ], [categories])

  const supplierOptions = useMemo(() => [
    { value: "tous", label: "Tous fournisseurs" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ], [suppliers])

  // ── Groupement par zone ──
  const productsByZone = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const zone of storageZones) {
      map.set(zone.id, [])
    }
    for (const product of filtered) {
      const arr = map.get(product.storageZone)
      if (arr) arr.push(product)
      else {
        // Zone inconnue → "non_assigne"
        if (!map.has("non_assigne")) map.set("non_assigne", [])
        map.get("non_assigne")!.push(product)
      }
    }
    return map
  }, [filtered, storageZones])

  // ── Groupement par urgence ──
  const productsByUrgency = useMemo(() => {
    const groups: Record<UrgencyCategory, Product[]> = {
      a_commander: [],
      a_surveiller: [],
      stock_ok: [],
    }
    for (const product of filtered) {
      groups[getUrgencyCategory(product)].push(product)
    }
    return groups
  }, [filtered])

  // ── Handlers ──
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
    setDetailOpen(true)
  }, [])

  const handleSelectRecipe = useCallback((recipeId: string) => {
    setSelectedRecipeId(recipeId)
    setRecipeDetailOpen(true)
  }, [])

  const handleOrderFromDetail = useCallback((product: Product) => {
    const supplier = suppliers.find((s) => s.id === product.supplierId)
    if (supplier) {
      setOrderSupplierId(supplier.id)
      setPreSelectedProductId(product.id)
      setOrderDialogOpen(true)
    }
  }, [suppliers])

  const handleOrderFromSupplier = useCallback((supplierId: string) => {
    setOrderSupplierId(supplierId)
    setPreSelectedProductId(undefined)
    setOrderDialogOpen(true)
  }, [])

  const handleSubmitOrder = useCallback(
    (data: { supplierId: string; items: OrderItem[]; notes: string }) => {
      const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      const supplier = suppliers.find((s) => s.id === data.supplierId)
      const newOrder = {
        id: `ord-${Date.now()}`,
        supplierId: data.supplierId,
        items: data.items,
        date: toLocalDateString(new Date()),
        status: "pending" as const,
        totalAmount,
        expectedDelivery: daysFromNow(supplier?.averageDeliveryDays ?? 3),
        notes: data.notes,
      }
      addOrder(newOrder)
    },
    [suppliers, addOrder]
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteProduct(id)
      if (selectedProduct?.id === id) {
        setDetailOpen(false)
        setSelectedProduct(null)
      }
    },
    [deleteProduct, selectedProduct]
  )

  const handleOpenSupplierSheet = useCallback((supplierId: string) => {
    setSupplierSheetId(supplierId)
    setSupplierSheetOpen(true)
  }, [])

  // ── Inventory mode handlers ──
  const handleStartInventory = useCallback(() => {
    setViewMode("zone") // Force zone view
    setInventoryMode(true)
    setInventoryValues(new Map())
  }, [])

  const handleInventoryChange = useCallback((productId: string, value: number) => {
    setInventoryValues((prev) => {
      const next = new Map(prev)
      next.set(productId, value)
      return next
    })
  }, [])

  const handleSaveInventory = useCallback(() => {
    inventoryValues.forEach((value, productId) => {
      const product = products.find((p) => p.id === productId)
      if (product && product.quantity !== value) {
        updateProduct(productId, { quantity: value })
      }
    })
    setInventoryMode(false)
    setInventoryValues(new Map())
  }, [inventoryValues, products, updateProduct])

  const handleCancelInventory = useCallback(() => {
    setInventoryMode(false)
    setInventoryValues(new Map())
  }, [])

  // Order helpers
  const orderSupplier = orderSupplierId
    ? suppliers.find((s) => s.id === orderSupplierId) ?? null
    : null
  const orderProducts = orderSupplier
    ? getSupplierProducts(orderSupplier.id, products)
    : []

  // ── Render ──
  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <StockHeader
          totalProducts={products.length}
          totalValue={totalValue}
          ruptureCount={ruptureCount}
          faibleCount={faibleCount}
          okCount={okCount}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAddProduct={() => navigate("/stocks/nouveau")}
          onOpenZoneManager={() => setZoneManagerOpen(true)}
        />
      </motion.div>

      {/* Filtres */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between gap-3">
          <StockFilters
            search={search}
            categoryFilter={categoryFilter}
            supplierFilter={supplierFilter}
            onSearchChange={setSearch}
            onCategoryFilterChange={setCategoryFilter}
            onSupplierFilterChange={setSupplierFilter}
            categories={categoryOptions}
            suppliers={supplierOptions}
          />

          {/* Bouton mode inventaire */}
          {!inventoryMode && (
            <Button variant="outline" size="sm" onClick={handleStartInventory}>
              <HugeiconsIcon icon={Clipboard01Icon} className="size-4" strokeWidth={2} />
              Inventaire
            </Button>
          )}
        </div>
      </motion.div>

      {/* Bannière mode inventaire */}
      {inventoryMode && (
        <motion.div variants={fadeUp}>
          <StockInventoryBanner
            changedCount={inventoryValues.size}
            onSave={handleSaveInventory}
            onCancel={handleCancelInventory}
          />
        </motion.div>
      )}

      {/* Contenu principal */}
      <motion.div variants={fadeUp} className="min-h-0 flex-1 space-y-6">
        {filtered.length > 0 ? (
          viewMode === "zone" ? (
            /* ── VUE PAR ZONE ── */
            <>
              {storageZones.map((zone) => {
                const zoneProducts = productsByZone.get(zone.id) ?? []
                const health = zoneProducts.length > 0 ? getZoneHealth(zoneProducts) : "ok"
                return (
                  <StockZoneSection
                    key={zone.id}
                    zone={zone}
                    products={zoneProducts}
                    suppliers={suppliers}
                    portionSummaries={portionMap}
                    recipePortions={recipePortions}
                    defaultCollapsed={health === "ok"}
                    onSelectProduct={handleSelectProduct}
                    onSelectRecipe={handleSelectRecipe}
                    onOrder={handleOrderFromDetail}
                    inventoryMode={inventoryMode}
                    inventoryValues={inventoryValues}
                    onInventoryChange={handleInventoryChange}
                  />
                )
              })}
            </>
          ) : (
            /* ── VUE PAR URGENCE ── */
            <>
              {(["a_commander", "a_surveiller", "stock_ok"] as UrgencyCategory[]).map((cat) => (
                <StockUrgencySection
                  key={cat}
                  urgency={cat}
                  products={productsByUrgency[cat]}
                  suppliers={suppliers}
                  portionSummaries={portionMap}
                  recipePortions={recipePortions}
                  defaultCollapsed={cat === "stock_ok"}
                  onSelectProduct={handleSelectProduct}
                  onSelectRecipe={handleSelectRecipe}
                  onOrder={handleOrderFromDetail}
                />
              ))}
            </>
          )
        ) : (() => {
          const hasFilters = search.trim() !== "" || categoryFilter !== "toutes" || supplierFilter !== "tous"
          const empty = getStockEmptyState(hasFilters)
          return (
            <EmptyState
              title={empty.title}
              description={empty.description}
              actionLabel={empty.actionLabel}
              onAction={() => navigate("/stocks/nouveau")}
            />
          )
        })()}
      </motion.div>

      {/* ── Modals ── */}

      {/* Détail produit */}
      <ProductDetailModal
        product={currentProduct}
        supplier={currentSupplier}
        portionSummary={currentPortionSummary}
        recipes={recipes}
        allProducts={products}
        allOrders={orders}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onOrder={handleOrderFromDetail}
        onDelete={handleDelete}
        onOpenSupplierSheet={handleOpenSupplierSheet}
      />

      {/* Détail recette (clic sur chip recette) */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        portionInfo={selectedRecipePortionInfo}
        products={products}
        suppliers={suppliers}
        open={recipeDetailOpen}
        onOpenChange={setRecipeDetailOpen}
        onEdit={(r) => { setRecipeDetailOpen(false); navigate(`/cuisine/${r.id}/modifier`) }}
        onDuplicate={() => {}}
        onToggleActive={() => {}}
        onDelete={() => {}}
      />

      {/* Fournisseur */}
      <SupplierModal
        supplier={supplierSheetSupplier}
        products={products}
        orders={orders}
        productPortionSummaries={productPortionSummaries}
        recipes={recipes}
        open={supplierSheetOpen}
        onOpenChange={setSupplierSheetOpen}
        onOrder={handleOrderFromSupplier}
        zIndex={62}
      />

      {/* Commande */}
      <OrderDialog
        supplier={orderSupplier}
        products={orderProducts}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSubmit={handleSubmitOrder}
        preSelectedProductId={preSelectedProductId}
      />

      {/* Gestionnaire de zones */}
      <ZoneManagerPanel
        open={zoneManagerOpen}
        onOpenChange={setZoneManagerOpen}
      />
    </motion.div>
  )
}
```

**Nouveaux imports :** `RecipeDetailModal` de `@/components/carte/recipe-detail-modal`, `StockZoneSection`, `StockUrgencySection`, `StockFilters`, `StockHeader` (refait), `ZoneManagerPanel`, `StockInventoryBanner`, `getUrgencyCategory`, `getTotalStockValue`, `getZoneHealth`.

**Imports supprimés :** `StorageZones` (le composant 5 cards).

---

## Étape 12 — Router et navigation

### `router.tsx`
Supprimer la route :
```diff
- { path: "stocks/configuration", element: <StocksConfigurationPage /> },
```
Et l'import :
```diff
- import StocksConfigurationPage from "@/pages/stocks/configuration"
```

### `nav-main.tsx`
Supprimer le sous-lien "Configuration" dans la nav sidebar pour stocks. Chercher la section qui référence `/stocks/configuration` et la retirer.

### Fichier `src/pages/stocks/configuration.tsx`
Peut être supprimé, mais le laisser pour l'instant au cas où un utilisateur a un bookmark. Optionnel : ajouter un redirect vers `/stocks` dans le router.

---

## Étape 13 — Composants supprimés ou inutilisés

| Fichier | Action |
|---------|--------|
| `src/components/stock/storage-zones.tsx` | **Supprimé** — remplacé par `StockZoneSection` |
| `src/components/stock/stock-table.tsx` | **Supprimé** — remplacé par cards dans les sections |

Ne pas supprimer : `stock-product-card.tsx` (refait, pas supprimé), `product-detail-modal.tsx` (gardé tel quel), `product-flow-graph.tsx` (gardé), `product-icons.ts` (gardé).

---

## Résumé des composants réutilisés de Ma Carte

| Composant | Fichier source | Usage dans Mon Stock |
|-----------|----------------|---------------------|
| `IngredientIcon` | `carte/ingredient-icon.tsx` | Icône produit avec remplissage partiel dans les cards |
| `RecipeDetailModal` | `carte/recipe-detail-modal.tsx` | S'ouvre au clic sur une chip recette |
| `Collapsible` | `ui/collapsible` | Sections zone et urgence collapsibles |
| `AnimatePresence` | `motion/react` | Animation des cards dans les grilles |
| `EmptyState` | `shared/empty-state.tsx` | État vide quand aucun produit ne matche les filtres |
| `BLOCK_COLORS` | Pattern CSS | Mêmes couleurs RGBA pour fonds conditionnels |
| Pattern chips | `carte-recipe-card.tsx` | Chips recettes = miroir des chips ingrédients |

---

## Couleurs et tokens réutilisés

| Token | Valeur | Usage |
|-------|--------|-------|
| Rupture fond | `rgba(226,75,74,0.04)` | Card background |
| Rupture border | `rgba(226,75,74,0.15)` | Card border |
| Rupture barre | `#E24B4A` | Progress fill |
| Rupture texte | `#A32D2D` | Stock number, badges |
| Faible fond | `rgba(239,159,39,0.04)` | Card background |
| Faible border | `rgba(239,159,39,0.15)` | Card border |
| Faible barre | `#EF9F27` | Progress fill |
| Faible texte | `#BA7517` | Stock number, badges |
| OK barre | `#97C459` | Progress fill |
| OK texte | `#639922` | Stock number, compteurs |
| Barre track OK | `rgba(0,0,0,0.08)` | Progress track |
| Chip OK bg | `bg-secondary` (Tailwind) | Chip recette résumé |

---

## Vérification

1. `pnpm tsc --noEmit` → 0 erreurs
2. `pnpm vitest run` → tous les tests passent
3. `/stocks` → vérifier :
   - Header : titre + résumé valeur + compteurs colorés + toggle vue + bouton ajouter + ⚙
   - Filtres : recherche + catégorie + fournisseur + bouton inventaire
   - **Vue par zone (défaut) :**
     - Sections par zone avec icône + nom + compteur produits + alertes/OK
     - Mini barre santé 60px dans le header section
     - Zones avec alertes dépliées, zones OK collapsées (opacity 0.6 sur header)
     - Cards produit : IngredientIcon fill, nom, fournisseur+livr, stock coloré, barre 5px
     - Chips recettes détaillées pour produits à problème, résumé pour OK
     - Footer : badge statut/expiration + CTA "Commander →" orange
     - Tri : ruptures → faible → OK, puis par nb recettes
   - **Vue par urgence :**
     - 3 sections : "À commander" (rouge), "À surveiller" (amber), "Stock OK" (vert, collapsé)
     - Mêmes cards, même tri
   - **Mode inventaire :**
     - Bannière active avec pulse + compteur modifications
     - Input numérique remplace le stock sur chaque card
     - "Sauvegarder l'inventaire" met à jour le store
   - **Interactions :**
     - Clic card → ProductDetailModal (existant)
     - Clic chip recette → RecipeDetailModal
     - Clic "Commander →" → OrderDialog avec fournisseur pré-rempli
     - ⚙ → ZoneManagerPanel (double-clic rename, supprimer, ajouter)
   - **Filtres combinés :**
     - Recherche + catégorie + fournisseur filtrent dans les deux vues
     - Filtres vides → EmptyState
   - **Responsive :**
     - ≥ 1024px : 3 colonnes
     - 640-1023px : 2 colonnes
     - < 640px : 1 colonne
4. Dark mode : fonds `rgba()` lisibles, barres contrastées, chips visibles
5. Navigation : `/stocks/configuration` redirigé ou supprimé
