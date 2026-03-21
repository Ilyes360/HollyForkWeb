import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { TruckDeliveryIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import type { Product, ProductStatus } from "@/components/stock/types"
import { STATUS_CONFIG, UNIT_LABELS } from "@/components/stock/types"
import type { ProductPortionSummary } from "@/components/stock/types"
import type { SupplierFull } from "@/components/commandes/types"
import type { Recipe } from "@/components/carte/types"
import { getProductStatus } from "@/components/stock/utils"
import { getProductIcon } from "@/components/stock/product-icons"

interface SupplierFlowGraphProps {
  supplier: SupplierFull
  products: Product[]
  productPortionSummaries: ProductPortionSummary[]
  recipes: Recipe[]
}

const MAX_VISIBLE_PRODUCTS = 4
const MAX_VISIBLE_RECIPES = 3

function Connector({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="h-0 w-full border-b-2 border-dashed border-border" />
      <span className="shrink-0 text-xs text-muted-foreground">→</span>
    </div>
  )
}

function getProductNodeColor(status: ProductStatus): string {
  if (status === "rupture") return "bg-destructive/10 border-destructive/20"
  if (status === "stock_faible") return "bg-amber-50 border-amber-200"
  return "bg-muted border-border"
}

function getRecipeNodeColor(portions: number): string {
  if (portions === 0) return "bg-destructive/10 border-destructive/20"
  if (portions < 5) return "bg-amber-50 border-amber-200"
  return "bg-muted border-border"
}

export function SupplierFlowGraph({
  supplier,
  products,
  productPortionSummaries,
  recipes,
}: SupplierFlowGraphProps) {
  const summaryMap = new Map(productPortionSummaries.map((s) => [s.productId, s]))

  // Build product nodes
  const productNodes = products.map((p) => {
    const status = getProductStatus(p)
    const iconEntry = getProductIcon(p.icon)
    return { product: p, status, iconEntry }
  })

  // Deduplicated recipes from all products' portion equivalents
  const recipeMap = new Map<string, { id: string; name: string; portions: number; icon?: string }>()
  for (const p of products) {
    const summary = summaryMap.get(p.id)
    if (!summary) continue
    for (const eq of summary.portionEquivalents) {
      if (!recipeMap.has(eq.recipeId)) {
        const recipe = recipes.find((r) => r.id === eq.recipeId)
        recipeMap.set(eq.recipeId, {
          id: eq.recipeId,
          name: eq.recipeName,
          portions: eq.portionsEnabled,
          icon: recipe?.icon,
        })
      }
    }
  }
  const recipeNodes = Array.from(recipeMap.values())

  const visibleProducts = productNodes.slice(0, MAX_VISIBLE_PRODUCTS)
  const hiddenProductCount = productNodes.length - MAX_VISIBLE_PRODUCTS
  const visibleRecipes = recipeNodes.slice(0, MAX_VISIBLE_RECIPES)
  const hiddenRecipeCount = recipeNodes.length - MAX_VISIBLE_RECIPES

  const columnDelay = 0.1

  return (
    <div
      className="flex items-stretch gap-0"
      role="img"
      aria-label={`Flux : ${supplier.name} → ${products.map((p) => p.name).join(", ")} → ${recipeNodes.map((r) => r.name).join(", ") || "aucune recette"}`}
    >
      {/* Supplier column */}
      <motion.div
        className="flex shrink-0 flex-col justify-center"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: columnDelay * 0 }}
      >
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
              <HugeiconsIcon icon={TruckDeliveryIcon} className="size-3.5 text-muted-foreground" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{supplier.name}</p>
              <p className="text-xs text-muted-foreground">Fournisseur</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Connector 1 */}
      {productNodes.length > 0 && <Connector className="w-8 shrink-0" />}

      {/* Products column */}
      {productNodes.length > 0 && (
        <motion.div
          className="flex min-w-0 flex-col justify-center gap-1.5"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: columnDelay * 1 }}
        >
          {visibleProducts.map(({ product: p, status, iconEntry }) => (
            <div
              key={p.id}
              className={cn(
                "rounded-lg border p-2.5 transition-colors hover:ring-1 hover:ring-primary/30",
                getProductNodeColor(status)
              )}
            >
              <div className="flex items-center gap-2">
                {iconEntry && (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-background/60">
                    <HugeiconsIcon icon={iconEntry.icon} className="size-3 text-muted-foreground" strokeWidth={2} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.quantity} {UNIT_LABELS[p.unit]}
                  </p>
                </div>
              </div>
              <div className="mt-1">
                <Badge variant={STATUS_CONFIG[status].variant} className="text-[10px]">
                  {STATUS_CONFIG[status].label}
                </Badge>
              </div>
            </div>
          ))}
          {hiddenProductCount > 0 && (
            <div className="rounded-lg border border-dashed bg-muted/30 px-2.5 py-1.5 text-center">
              <span className="text-xs text-muted-foreground">
                +{hiddenProductCount} produit{hiddenProductCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </motion.div>
      )}

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
            <div
              key={node.id}
              className={cn(
                "rounded-lg border p-2.5 transition-colors hover:ring-1 hover:ring-primary/30",
                getRecipeNodeColor(node.portions)
              )}
            >
              <p className="truncate text-xs font-medium">{node.name}</p>
              <p className="text-xs text-muted-foreground">
                {node.portions} portion{node.portions !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
          {hiddenRecipeCount > 0 && (
            <div className="rounded-lg border border-dashed bg-muted/30 px-2.5 py-1.5 text-center">
              <span className="text-xs text-muted-foreground">
                +{hiddenRecipeCount} recette{hiddenRecipeCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
