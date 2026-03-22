import { useState, useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Product } from "@/components/stock/types"
import { UNIT_LABELS } from "@/components/stock/types"
import { getProductStatus } from "@/components/stock/utils"
import type { SupplierFull } from "@/components/commandes/types"
import type { ProductPortionSummary } from "@/components/stock/types"
import { IngredientIcon } from "./ingredient-icon"
import { useCarteOperational } from "./operational-view-context"
import { cn } from "@/lib/utils"

type ProductFilter = "tous" | "rupture" | "stock_faible"

const FILTER_OPTIONS: { value: ProductFilter; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "rupture", label: "Rupture" },
  { value: "stock_faible", label: "Faible" },
]

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

interface OperationalProductPanelProps {
  products: Product[]
  suppliers: SupplierFull[]
  productPortionSummaries: ProductPortionSummary[]
  onSelectProduct: (productId: string) => void
}

export function OperationalProductPanel({
  products,
  suppliers,
  productPortionSummaries,
  onSelectProduct,
}: OperationalProductPanelProps) {
  const [filter, setFilter] = useState<ProductFilter>("tous")
  const [searchQuery, setSearchQuery] = useState("")
  const opView = useCarteOperational()

  const supplierMap = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers]
  )

  // Sort by stock ratio ascending
  const sorted = useMemo(
    () =>
      [...products].sort((a, b) => {
        const ratioA = a.maxStock > 0 ? a.quantity / a.maxStock : 0
        const ratioB = b.maxStock > 0 ? b.quantity / b.maxStock : 0
        return ratioA - ratioB
      }),
    [products]
  )

  // Sidebar filtering from chain state (recipe locked → only its ingredients)
  const chainProductIds = opView.chainState.sidebarProductIds

  // Hover recipe → dim non-matching (don't filter)
  const hoverRecipeProductIds = !opView.isLocked && opView.hoveredRecipeId
    ? new Set(opView.recipeToProductIds.get(opView.hoveredRecipeId) ?? [])
    : null

  const visible = sorted.filter((p) => {
    // Chain filter (locked recipe)
    if (chainProductIds && !chainProductIds.has(p.id)) return false
    // Search
    if (searchQuery.trim() && !normalize(p.name).includes(normalize(searchQuery.trim()))) return false
    // Status filter
    if (filter !== "tous" && getProductStatus(p) !== filter) return false
    return true
  })

  // Group by supplier
  const groupedBySupplier = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const p of visible) {
      const list = map.get(p.supplierId)
      if (list) list.push(p)
      else map.set(p.supplierId, [p])
    }
    // Sort suppliers: worst stock ratio first
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const worstA = Math.min(...a.map((p) => (p.maxStock > 0 ? p.quantity / p.maxStock : 0)))
      const worstB = Math.min(...b.map((p) => (p.maxStock > 0 ? p.quantity / p.maxStock : 0)))
      return worstA - worstB
    })
  }, [visible])

  const isChainFiltered = chainProductIds !== null

  const ruptureCount = products.filter((p) => getProductStatus(p) === "rupture").length
  const faibleCount = products.filter((p) => getProductStatus(p) === "stock_faible").length

  const headerTitle = isChainFiltered
    ? opView.lockedRecipeName ?? "Recette"
    : "Produits"
  const headerCount = isChainFiltered
    ? `${visible.length} ingrédient${visible.length > 1 ? "s" : ""}`
    : `${visible.length} / ${products.length}`

  return (
    <Sidebar collapsible="none" variant="sidebar" className="!bg-background !text-foreground border-r">
      <SidebarHeader className="px-4 py-3 space-y-2">
        {/* Header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isChainFiltered ? "filtered" : "all"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between gap-2"
          >
            <h2 className={cn(
              "font-semibold tracking-wider text-muted-foreground truncate",
              isChainFiltered ? "text-xs" : "text-sm uppercase"
            )}>
              {headerTitle}
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {headerCount}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Stats + filters (hidden when chain filtered) */}
        {!isChainFiltered && (
          <>
            {(ruptureCount > 0 || faibleCount > 0) && (
              <div className="flex gap-3 text-xs">
                {ruptureCount > 0 && (
                  <span className="font-medium" style={{ color: "#A32D2D" }}>{ruptureCount} rupture</span>
                )}
                {faibleCount > 0 && (
                  <span className="font-medium" style={{ color: "#BA7517" }}>{faibleCount} faible</span>
                )}
              </div>
            )}
            <div className="flex gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === opt.value
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Search */}
        <div className="relative">
          <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" strokeWidth={2} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setSearchQuery("") }}
            className="w-full rounded-md border border-border bg-muted/50 py-1.5 pl-8 pr-7 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" strokeWidth={2} />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            <AnimatePresence mode="popLayout">
              {groupedBySupplier.map(([supplierId, groupProducts]) => {
                const supplier = supplierMap.get(supplierId)
                const restockCount = groupProducts.filter((p) => p.quantity < p.minStock).length

                return (
                  <motion.div
                    key={supplierId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Collapsible defaultOpen>
                      <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-left hover:bg-muted/50 rounded-md transition-colors">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                          {supplier?.name ?? "Inconnu"}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {restockCount > 0 && (
                            <span className="text-[10px] font-medium" style={{ color: "#A32D2D" }}>
                              {restockCount} à restock
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {groupProducts.length}
                          </span>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {groupProducts.map((product, i) => (
                          <ProductRow
                            key={product.id}
                            product={product}
                            index={i}
                            isChainFiltered={isChainFiltered}
                            hoverRecipeProductIds={hoverRecipeProductIds}
                            opView={opView}
                            onSelectProduct={onSelectProduct}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {visible.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                {searchQuery ? "Aucun résultat" : "Aucun produit"}
              </p>
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}

// ── Product Row ──

function ProductRow({
  product,
  index,
  isChainFiltered,
  hoverRecipeProductIds,
  opView,
  onSelectProduct,
}: {
  product: Product
  index: number
  isChainFiltered: boolean
  hoverRecipeProductIds: Set<string> | null
  opView: ReturnType<typeof useCarteOperational>
  onSelectProduct: (productId: string) => void
}) {
  const status = getProductStatus(product)
  const recipeCount = opView.productToRecipeIds.get(product.id)?.length ?? 0
  const stockPercent = product.maxStock > 0
    ? Math.min(100, Math.round((product.quantity / product.maxStock) * 100))
    : 0
  const isLockedProduct = opView.lockedProductId === product.id
  const isActive = opView.hoveredProductId === product.id

  // Dim when recipe is hovered and this product isn't in the recipe
  const isDimmed = hoverRecipeProductIds !== null && !hoverRecipeProductIds.has(product.id)

  const barColor = status === "rupture" ? "#E24B4A" : status === "stock_faible" ? "#EF9F27" : "#97C459"

  // Expiration
  const expirationInfo = getExpirationInfo(product.expirationDate)

  const handleClick = () => {
    if (opView.lockedProductId === product.id) {
      opView.unlock()
    } else {
      opView.lockProduct(product.id, product.name)
    }
  }

  return (
    <motion.div
      layout
      data-product-id={product.id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: isDimmed ? 0.3 : 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{
        duration: 0.2,
        delay: isChainFiltered ? index * 0.03 : 0,
        layout: { duration: 0.25 },
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted",
        isLockedProduct && "bg-primary/10 ring-1 ring-primary/30",
        isActive && !isLockedProduct && "bg-muted"
      )}
      onMouseEnter={() => opView.setHoveredProduct(product.id, product.name)}
      onMouseLeave={() => opView.setHoveredProduct(null)}
      onClick={handleClick}
    >
      <IngredientIcon product={product} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="h-1 w-14 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${stockPercent}%`, backgroundColor: barColor }} />
          </div>
          <span className="text-[11px] text-muted-foreground">
            {recipeCount} recette{recipeCount > 1 ? "s" : ""}
          </span>
        </div>
        {expirationInfo && (
          <p className="text-[10px] font-medium mt-0.5" style={{ color: expirationInfo.color }}>
            {expirationInfo.label}
          </p>
        )}
      </div>
      <span className="text-xs tabular-nums text-muted-foreground shrink-0">
        {product.quantity} {UNIT_LABELS[product.unit]}
      </span>
    </motion.div>
  )
}

function getExpirationInfo(expirationDate: string | undefined) {
  if (!expirationDate) return null
  const now = new Date()
  const exp = new Date(expirationDate)
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: "Expiré", color: "#A32D2D" }
  if (diffDays === 0) return { label: "Exp. aujourd'hui", color: "#A32D2D" }
  if (diffDays <= 2) return { label: `Exp. ${diffDays}j`, color: "#A32D2D" }
  if (diffDays <= 5) return { label: `Exp. ${diffDays}j`, color: "#BA7517" }
  return null
}
