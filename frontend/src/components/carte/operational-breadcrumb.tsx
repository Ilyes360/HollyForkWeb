import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, ArrowLeft02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import type { Product } from "@/components/stock/types"
import { UNIT_LABELS } from "@/components/stock/types"
import type { SupplierFull } from "@/components/commandes/types"
import type { RecipePortionInfo } from "@/components/carte/types"
import { IngredientIcon } from "./ingredient-icon"
import { useCarteOperational } from "./operational-view-context"
import { cn } from "@/lib/utils"

interface OperationalBreadcrumbProps {
  products: Product[]
  suppliers: SupplierFull[]
  recipePortions: RecipePortionInfo[]
}

export function OperationalBreadcrumb({
  products,
  suppliers,
  recipePortions,
}: OperationalBreadcrumbProps) {
  const opView = useCarteOperational()

  if (!opView.isLocked) return null

  const product = opView.lockedProductId
    ? products.find((p) => p.id === opView.lockedProductId) ?? null
    : null
  const supplier = product
    ? suppliers.find((s) => s.id === product.supplierId) ?? null
    : null
  const recipeCount = opView.lockedProductId
    ? (opView.productToRecipeIds.get(opView.lockedProductId)?.length ?? 0)
    : 0
  const portionInfo = opView.lockedRecipeId
    ? recipePortions.find((p) => p.recipeId === opView.lockedRecipeId) ?? null
    : null

  const hasChain = opView.impactChain.length > 1

  return (
    <AnimatePresence>
      <motion.div
        key="breadcrumb"
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -8, height: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
        className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm overflow-hidden"
      >
        {/* Back button for chain */}
        {hasChain && (
          <button
            type="button"
            className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={opView.popChainEntry}
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="size-3.5" strokeWidth={2} />
            Retour
          </button>
        )}

        {/* Chain entries */}
        {hasChain ? (
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {opView.impactChain.map((entry, i) => (
              <span key={`${entry.type}-${entry.id}`} className="flex items-center gap-1 min-w-0">
                {i > 0 && (
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 text-muted-foreground shrink-0" strokeWidth={2} />
                )}
                <span className={cn(
                  "truncate text-xs",
                  i === opView.impactChain.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"
                )}>
                  {entry.name}
                </span>
              </span>
            ))}
          </div>
        ) : product ? (
          /* Product lock breadcrumb */
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <IngredientIcon product={product} size="sm" />
            <span className="font-medium truncate">{product.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {product.quantity} {UNIT_LABELS[product.unit]} / {product.maxStock} {UNIT_LABELS[product.unit]}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {recipeCount} recette{recipeCount > 1 ? "s" : ""}
            </span>
            {supplier && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground truncate">
                  {supplier.name} · ~{supplier.averageDeliveryDays}j
                </span>
              </>
            )}
          </div>
        ) : portionInfo ? (
          /* Recipe lock breadcrumb */
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium truncate">{portionInfo.recipeName}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {portionInfo.maxPortions} portions
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground shrink-0">
              FC {portionInfo.foodCostPercent.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {portionInfo.ingredientDetails.length} ingrédient{portionInfo.ingredientDetails.length > 1 ? "s" : ""}
            </span>
          </div>
        ) : null}

        {/* Close button */}
        <button
          type="button"
          className="shrink-0 flex size-5 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          onClick={opView.clearChain}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3" strokeWidth={2} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
