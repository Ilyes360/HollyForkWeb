import { useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type {
  RecipeCategory,
  Recipe,
  RecipePortionInfo,
} from "@/components/carte/types"
import { CATEGORY_LABELS_PLURAL } from "@/components/carte/types"
import { getFoodCostColor } from "@/components/carte/utils"
import { formatCurrency } from "@/components/stock/utils"
import type { Product } from "@/components/stock/types"
import type { SupplierFull } from "@/components/commandes/types"
import { cn } from "@/lib/utils"

interface CategorySectionProps {
  category: RecipeCategory
  portionInfos: RecipePortionInfo[]
  recipes: Recipe[]
  products: Product[]
  suppliers: SupplierFull[]
  rankMap: Map<string, number>
  onSelectRecipe: (recipeId: string) => void
  onSelectProduct: (productId: string) => void
}

type RecipeStatus = "rupture" | "stock_faible" | "ok"

function getRecipeStatus(info: RecipePortionInfo): RecipeStatus {
  if (info.maxPortions === 0) return "rupture"
  if (info.maxPortions < 10) return "stock_faible"
  return "ok"
}

const STATUS_ORDER: Record<RecipeStatus, number> = {
  rupture: 0,
  stock_faible: 1,
  ok: 2,
}

const STATUS_DOT: Record<RecipeStatus, string> = {
  rupture: "bg-red-500",
  stock_faible: "bg-amber-500",
  ok: "bg-emerald-500",
}

const STATUS_LABEL: Record<RecipeStatus, string> = {
  rupture: "Rupture",
  stock_faible: "Stock bas",
  ok: "",
}

export function CategorySection({
  category,
  portionInfos,
  recipes,
  onSelectRecipe,
}: CategorySectionProps) {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]))

  const sorted = useMemo(() => {
    return [...portionInfos].sort((a, b) => {
      const statusDiff =
        STATUS_ORDER[getRecipeStatus(a)] - STATUS_ORDER[getRecipeStatus(b)]
      if (statusDiff !== 0) return statusDiff
      // Within same status group, sort by food cost descending (worst first)
      return b.foodCostPercent - a.foodCostPercent
    })
  }, [portionInfos])

  const servable = portionInfos.filter((r) => r.maxPortions > 0).length
  const rupture = portionInfos.filter((r) => r.maxPortions === 0).length
  const total = portionInfos.length
  const availabilityPercent =
    total > 0 ? Math.round((servable / total) * 100) : 0

  if (total === 0) return null

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group w-full text-left">
        {/* Summary banner */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {CATEGORY_LABELS_PLURAL[category]}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {total} recette{total > 1 ? "s" : ""}
                <span className="mx-1.5 text-border">|</span>
                <span className="text-emerald-600">
                  {servable} servable{servable > 1 ? "s" : ""}
                </span>
                {rupture > 0 && (
                  <>
                    <span className="mx-1.5 text-border">|</span>
                    <span className="font-medium text-destructive">
                      {rupture} en rupture
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  availabilityPercent === 100
                    ? "text-emerald-600"
                    : availabilityPercent >= 75
                      ? "text-foreground"
                      : availabilityPercent >= 50
                        ? "text-amber-600"
                        : "text-destructive"
                )}
              >
                {availabilityPercent}%
              </span>
            </div>
          </div>

          {/* Availability bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  availabilityPercent === 100
                    ? "bg-emerald-500"
                    : availabilityPercent >= 75
                      ? "bg-emerald-500"
                      : availabilityPercent >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                )}
                style={{ width: `${availabilityPercent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              disponible
            </span>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 overflow-hidden rounded-xl border border-border bg-card">
          {sorted.map((info, i) => {
            const recipe = recipeMap.get(info.recipeId)
            if (!recipe) return null
            const status = getRecipeStatus(info)

            return (
              <motion.button
                key={info.recipeId}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-accent/50",
                  i > 0 && "border-t border-border/50",
                  status === "rupture" && "bg-red-500/[0.03]",
                  status === "stock_faible" && "bg-amber-500/[0.03]"
                )}
                onClick={() => onSelectRecipe(info.recipeId)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02, duration: 0.2 }}
              >
                {/* Status dot */}
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    STATUS_DOT[status]
                  )}
                  aria-label={STATUS_LABEL[status] || "OK"}
                />

                {/* Recipe name */}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {recipe.name}
                </span>

                {/* Price */}
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {formatCurrency(recipe.sellingPrice)}
                </span>

                {/* Food cost */}
                <span
                  className={cn(
                    "w-[70px] shrink-0 text-right text-xs font-medium tabular-nums",
                    getFoodCostColor(info.foodCostPercent)
                  )}
                >
                  FC {info.foodCostPercent.toFixed(1)}%
                </span>

                {/* Portions */}
                <span
                  className={cn(
                    "w-[90px] shrink-0 text-right text-sm font-semibold tabular-nums",
                    status === "rupture" && "text-destructive",
                    status === "stock_faible" && "text-amber-600",
                    status === "ok" && "text-emerald-600"
                  )}
                >
                  {info.maxPortions}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    port.
                  </span>
                </span>

                {/* Limiting ingredient (if not OK) */}
                {status !== "ok" && info.limitingIngredient && (
                  <span
                    className={cn(
                      "hidden w-[120px] shrink-0 truncate text-right text-xs lg:inline",
                      status === "rupture" ? "text-red-500" : "text-amber-500"
                    )}
                  >
                    {info.limitingIngredient.productName}
                  </span>
                )}

                {/* Chevron */}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="size-4 shrink-0 text-muted-foreground/50"
                  strokeWidth={2}
                />
              </motion.button>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
