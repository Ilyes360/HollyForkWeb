import { HugeiconsIcon } from "@hugeicons/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/components/stocks/types"
import type { Recipe } from "./types"
import { CATEGORY_LABELS } from "./types"
import { getMaterialCost, getFoodCostPercent, getFoodCostColor, isFeasible, getMaxPortions } from "./utils"
import { formatCurrency } from "@/components/stocks/utils"
import { getProductIcon } from "@/components/stocks/product-icons"

interface RecipeCardProps {
  recipe: Recipe
  products: Product[]
  onClick: (recipe: Recipe) => void
}

export function RecipeCard({ recipe, products, onClick }: RecipeCardProps) {
  const materialCost = getMaterialCost(recipe.ingredients, products)
  const foodCostPct = getFoodCostPercent(materialCost, recipe.sellingPrice)
  const feasible = isFeasible(recipe.ingredients, products)
  const maxPortions = getMaxPortions(recipe.ingredients, products)
  const iconEntry = getProductIcon(recipe.icon)

  return (
    <Card
      className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
      onClick={() => onClick(recipe)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {iconEntry && (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <HugeiconsIcon icon={iconEntry.icon} className="size-4 text-muted-foreground" strokeWidth={2} />
            </div>
          )}
          <Badge variant="outline">{CATEGORY_LABELS[recipe.category]}</Badge>
        </div>
        {!recipe.isActive && (
          <Badge variant="outline" className="text-muted-foreground">
            Inactif
          </Badge>
        )}
      </div>

      <h3 className="mt-2 font-medium leading-snug">{recipe.name}</h3>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Prix de vente</span>
        <span className="font-medium">{formatCurrency(recipe.sellingPrice)}</span>
      </div>

      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Food Cost</span>
        <span className={`font-medium ${getFoodCostColor(foodCostPct)}`}>
          {foodCostPct.toFixed(1)}%
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Ingrédients</span>
        <span>{recipe.ingredients.length}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {feasible ? (
          <>
            <Badge variant="success">Réalisable</Badge>
            <span className="text-xs text-muted-foreground">×{maxPortions} portions</span>
          </>
        ) : (
          <Badge variant="destructive">Ingrédients manquants</Badge>
        )}
      </div>
    </Card>
  )
}
