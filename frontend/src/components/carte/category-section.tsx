import { useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
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
import type { Product } from "@/components/stock/types"
import type { SupplierFull } from "@/components/commandes/types"
import { CarteRecipeCard } from "./carte-recipe-card"
import { useCarteOperational } from "./operational-view-context"

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
  const { isEditing } = useCarteOperational()

  const sorted = [...portionInfos].sort((a, b) => {
    if (b.maxPortions !== a.maxPortions) return b.maxPortions - a.maxPortions
    return a.recipeName.localeCompare(b.recipeName, "fr")
  })

  const recipeMap = new Map(recipes.map((r) => [r.id, r]))

  const servable = portionInfos.filter((r) => r.maxPortions >= 10).length
  const stockFaible = portionInfos.filter(
    (r) => r.maxPortions > 0 && r.maxPortions < 10
  ).length
  const rupture = portionInfos.filter((r) => r.maxPortions === 0).length

  // Ambient heatmap background (operational mode only)
  const sectionTint = useMemo(() => {
    if (!isEditing) return undefined
    if (rupture > 0) return "rgba(226, 75, 74, 0.025)"
    if (stockFaible > 0) return "rgba(239, 159, 39, 0.02)"
    return "rgba(151, 196, 89, 0.02)"
  }, [isEditing, rupture, stockFaible])

  if (portionInfos.length === 0) return null

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-border pt-2 pb-3 text-left">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {CATEGORY_LABELS_PLURAL[category]} · {portionInfos.length} recette
          {portionInfos.length > 1 ? "s" : ""}
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
        <motion.div
          layout
          className="mt-3 grid grid-cols-1 gap-3.5 rounded-lg transition-colors duration-500 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          style={
            sectionTint
              ? { backgroundColor: sectionTint, padding: 12, margin: -12 }
              : undefined
          }
        >
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
