import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { TruckDeliveryIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/components/stock/types"
import { STATUS_CONFIG, UNIT_LABELS } from "@/components/stock/types"
import type { ProductPortionSummary } from "@/components/stock/types"
import type { SupplierFull } from "@/components/commandes/types"
import type { Recipe } from "@/components/carte/types"
import { getProductStatus } from "@/components/stock/utils"
import { getProductIcon } from "@/components/stock/product-icons"

interface ProductFlowGraphProps {
  product: Product
  supplier: SupplierFull | null
  portionSummary: ProductPortionSummary | null
  recipes: Recipe[]
  onSupplierClick: () => void
  onRecipeClick: (recipeId: string) => void
}

const MAX_VISIBLE_RECIPES = 3

function Connector({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="h-0 w-full border-b-2 border-dashed border-border" />
      <span className="shrink-0 text-xs text-muted-foreground">→</span>
    </div>
  )
}

function getRecipeNodeColor(portions: number): string {
  if (portions === 0) return "bg-destructive/10 border-destructive/20"
  if (portions < 5) return "bg-amber-50 border-amber-200"
  return "bg-muted border-border"
}

export function ProductFlowGraph({
  product,
  supplier,
  portionSummary,
  recipes,
  onSupplierClick,
  onRecipeClick,
}: ProductFlowGraphProps) {
  const status = getProductStatus(product)
  const config = STATUS_CONFIG[status]
  const iconEntry = getProductIcon(product.icon)

  // Build recipe nodes from portion equivalents
  const recipeNodes = (portionSummary?.portionEquivalents ?? []).map((eq) => {
    const recipe = recipes.find((r) => r.id === eq.recipeId)
    return {
      id: eq.recipeId,
      name: eq.recipeName,
      portions: eq.portionsEnabled,
      icon: recipe?.icon,
    }
  })

  const visibleRecipes = recipeNodes.slice(0, MAX_VISIBLE_RECIPES)
  const hiddenCount = recipeNodes.length - MAX_VISIBLE_RECIPES

  const columnDelay = 0.1

  return (
    <div
      className="flex items-stretch gap-0"
      role="img"
      aria-label={`Flux : ${supplier?.name ?? "pas de fournisseur"} → ${product.name} → ${recipeNodes.map((r) => r.name).join(", ") || "aucune recette"}`}
    >
      {/* Supplier column */}
      <motion.div
        className="flex shrink-0 flex-col justify-center"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: columnDelay * 0 }}
      >
        {supplier ? (
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border bg-background p-3 text-left cursor-pointer transition-colors hover:bg-muted/50 hover:ring-1 hover:ring-primary/30"
            onClick={onSupplierClick}
            aria-label={`Fournisseur : ${supplier.name}`}
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
              <HugeiconsIcon icon={TruckDeliveryIcon} className="size-3.5 text-muted-foreground" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{supplier.name}</p>
              <p className="text-xs text-muted-foreground">Fournisseur</p>
            </div>
          </button>
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Pas de fournisseur</p>
          </div>
        )}
      </motion.div>

      {/* Connector 1 */}
      <Connector className="w-8 shrink-0" />

      {/* Product column (center) */}
      <motion.div
        className="flex shrink-0 flex-col justify-center"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: columnDelay * 1 }}
      >
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            {iconEntry && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <HugeiconsIcon icon={iconEntry.icon} className="size-3.5 text-muted-foreground" strokeWidth={2} />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.quantity} {UNIT_LABELS[product.unit]}
              </p>
            </div>
          </div>
          <div className="mt-1.5">
            <Badge variant={config.variant} className="text-xs">
              {config.label}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Connector 2 */}
      {recipeNodes.length > 0 && <Connector className="w-8 shrink-0" />}

      {/* Recipes column */}
      {recipeNodes.length > 0 && (
        <motion.div
          className="flex min-w-0 flex-col justify-center gap-1.5"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: columnDelay * 2 }}
        >
          {visibleRecipes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={cn(
                "rounded-lg border p-2.5 text-left cursor-pointer transition-colors hover:ring-1 hover:ring-primary/30",
                getRecipeNodeColor(node.portions)
              )}
              onClick={() => onRecipeClick(node.id)}
              aria-label={`${node.name} — ${node.portions} portion${node.portions !== 1 ? "s" : ""}`}
            >
              <p className="truncate text-xs font-medium">{node.name}</p>
              <p className="text-xs text-muted-foreground">
                {node.portions} portion{node.portions !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
          {hiddenCount > 0 && (
            <div className="rounded-lg border border-dashed bg-muted/30 px-2.5 py-1.5 text-center">
              <span className="text-xs text-muted-foreground">
                +{hiddenCount} recette{hiddenCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
