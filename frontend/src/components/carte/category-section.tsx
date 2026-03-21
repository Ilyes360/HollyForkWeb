import { AnimatePresence, motion } from "motion/react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { RecipeCategory, Recipe, RecipePortionInfo } from "@/components/carte/types"
import { CATEGORY_LABELS_PLURAL } from "@/components/carte/types"
import type { Product } from "@/components/stock/types"
import type { SupplierFull } from "@/components/commandes/types"
import { CarteRecipeCard } from "./carte-recipe-card"

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

export function CategorySection({
  category,
  portionInfos,
  recipes,
  products,
  suppliers,
  rankMap,
  onSelectRecipe,
  onSelectProduct,
}: CategorySectionProps) {
  if (portionInfos.length === 0) return null

  const sorted = [...portionInfos].sort((a, b) => {
    if (b.maxPortions !== a.maxPortions) return b.maxPortions - a.maxPortions
    return a.recipeName.localeCompare(b.recipeName, "fr")
  })

  const recipeMap = new Map(recipes.map((r) => [r.id, r]))

  const servable = portionInfos.filter((r) => r.maxPortions >= 10).length
  const stockFaible = portionInfos.filter((r) => r.maxPortions > 0 && r.maxPortions < 10).length
  const rupture = portionInfos.filter((r) => r.maxPortions === 0).length

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-border pb-3 pt-2 text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {CATEGORY_LABELS_PLURAL[category]} · {portionInfos.length} recette{portionInfos.length > 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-3">
          {servable > 0 && (
            <span className="text-xs font-medium" style={{ color: "#639922" }}>
              {servable} servable{servable > 1 ? "s" : ""}
            </span>
          )}
          {stockFaible > 0 && (
            <span className="text-xs font-medium" style={{ color: "#BA7517" }}>
              {stockFaible} stock faible
            </span>
          )}
          {rupture > 0 && (
            <span className="text-xs font-medium" style={{ color: "#A32D2D" }}>
              {rupture} en rupture
            </span>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div layout className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {sorted.map((info, i) => {
              const recipe = recipeMap.get(info.recipeId)
              if (!recipe) return null
              return (
                <CarteRecipeCard
                  key={info.recipeId}
                  recipe={recipe}
                  portionInfo={info}
                  products={products}
                  suppliers={suppliers}
                  allRecipes={recipes}
                  rank={rankMap.get(info.recipeId) ?? null}
                  onClick={onSelectRecipe}
                  onSelectProduct={onSelectProduct}
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
