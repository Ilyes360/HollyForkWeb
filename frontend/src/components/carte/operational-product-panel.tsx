import { useState, useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
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
  const {
    hoveredProductId,
    setHoveredProduct,
    hoveredRecipeId,
    hoveredRecipeName,
    recipeToProductIds,
    productToRecipeIds,
  } = useCarteOperational()

  // Sort by stock ratio ascending (most critical first)
  const sorted = useMemo(
    () =>
      [...products].sort((a, b) => {
        const ratioA = a.maxStock > 0 ? a.quantity / a.maxStock : 0
        const ratioB = b.maxStock > 0 ? b.quantity / b.maxStock : 0
        return ratioA - ratioB
      }),
    [products]
  )

  // When hovering a recipe: filter to only that recipe's ingredients
  const recipeFilteredIds = hoveredRecipeId
    ? new Set(recipeToProductIds.get(hoveredRecipeId) ?? [])
    : null

  const visible = sorted.filter((p) => {
    // Recipe hover filter takes priority
    if (recipeFilteredIds && !recipeFilteredIds.has(p.id)) return false
    // Status filter
    if (filter === "tous") return true
    return getProductStatus(p) === filter
  })

  const ruptureCount = products.filter(
    (p) => getProductStatus(p) === "rupture"
  ).length
  const faibleCount = products.filter(
    (p) => getProductStatus(p) === "stock_faible"
  ).length

  // Contextual header
  const isFiltered = recipeFilteredIds !== null
  const headerTitle = isFiltered
    ? hoveredRecipeName ?? "Recette"
    : "Produits"
  const headerCount = isFiltered
    ? `${visible.length} ingrédient${visible.length > 1 ? "s" : ""}`
    : `${visible.length} / ${products.length}`

  return (
    <Sidebar
      collapsible="none"
      variant="sidebar"
      className="!bg-background !text-foreground border-r"
    >
      <SidebarHeader className="px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={isFiltered ? "filtered" : "all"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between gap-2"
          >
            <h2
              className={cn(
                "font-semibold tracking-wider text-muted-foreground truncate",
                isFiltered ? "text-xs" : "text-sm uppercase"
              )}
            >
              {headerTitle}
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {headerCount}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Stats + filters (hidden when filtering by recipe hover) */}
        {!isFiltered && (
          <>
            {(ruptureCount > 0 || faibleCount > 0) && (
              <div className="flex gap-3 text-xs">
                {ruptureCount > 0 && (
                  <span className="font-medium" style={{ color: "#A32D2D" }}>
                    {ruptureCount} rupture
                  </span>
                )}
                {faibleCount > 0 && (
                  <span className="font-medium" style={{ color: "#BA7517" }}>
                    {faibleCount} faible
                  </span>
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
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="p-2">
            <AnimatePresence mode="popLayout">
              {visible.map((product, i) => {
                const status = getProductStatus(product)
                const recipeCount =
                  productToRecipeIds.get(product.id)?.length ?? 0
                const stockPercent =
                  product.maxStock > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (product.quantity / product.maxStock) * 100
                        )
                      )
                    : 0
                const isActive = hoveredProductId === product.id

                const barColor =
                  status === "rupture"
                    ? "#E24B4A"
                    : status === "stock_faible"
                      ? "#EF9F27"
                      : "#97C459"

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{
                      duration: 0.2,
                      delay: isFiltered ? i * 0.03 : 0,
                      layout: { duration: 0.25 },
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted",
                      isActive && "bg-muted ring-1 ring-border"
                    )}
                    onMouseEnter={() =>
                      setHoveredProduct(product.id, product.name)
                    }
                    onMouseLeave={() => setHoveredProduct(null)}
                    onClick={() => onSelectProduct(product.id)}
                  >
                    <IngredientIcon product={product} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div
                          className="h-1 w-14 rounded-full overflow-hidden"
                          style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${stockPercent}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {recipeCount} recette{recipeCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                      {product.quantity} {UNIT_LABELS[product.unit]}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {visible.length === 0 && isFiltered && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 py-4 text-xs text-muted-foreground text-center"
              >
                Aucun ingrédient
              </motion.p>
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}
