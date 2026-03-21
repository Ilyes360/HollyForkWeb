import { useMemo } from "react"
import type { Recipe } from "@/components/carte/types"
import type { IngredientPortionInfo, RecipePortionInfo } from "@/components/carte/types"
import { getMaterialCost, getFoodCostPercent } from "@/components/carte/utils"
import type { Product } from "@/components/stock/types"
import type { ProductPortionSummary, PortionEquivalent } from "@/components/stock/types"
import { getProductStatus } from "@/components/stock/utils"
import type { SupplierFull } from "@/components/commandes/types"

interface UsePortionCalculatorReturn {
  recipePortions: RecipePortionInfo[]
  productPortionSummaries: ProductPortionSummary[]
  totalFeasibleRecipes: number
  totalActiveRecipes: number
  averageFoodCost: number
  totalPortions: number
}

export function usePortionCalculator(
  recipes: Recipe[],
  products: Product[],
  _suppliers: SupplierFull[]
): UsePortionCalculatorReturn {
  return useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]))

    // Pass 1: recipe portions
    const recipePortions: RecipePortionInfo[] = recipes.map((recipe) => {
      const ingredientDetails: IngredientPortionInfo[] = recipe.ingredients.map((ing) => {
        const product = productMap.get(ing.productId)
        const portionsAllowed =
          product && ing.quantity > 0
            ? Math.floor(product.quantity / ing.quantity)
            : 0
        return {
          productId: ing.productId,
          productName: product?.name ?? "Inconnu",
          portionsAllowed,
          isLimiting: false,
        }
      })

      let maxPortions = 0
      let limitingIngredient: IngredientPortionInfo | null = null

      if (ingredientDetails.length > 0) {
        maxPortions = Math.min(...ingredientDetails.map((d) => d.portionsAllowed))
        const limiting = ingredientDetails.find((d) => d.portionsAllowed === maxPortions)
        if (limiting) {
          limiting.isLimiting = true
          limitingIngredient = limiting
        }
      }

      const materialCostPerPortion = getMaterialCost(recipe.ingredients, products)
      const foodCostPercent = getFoodCostPercent(materialCostPerPortion, recipe.sellingPrice)

      return {
        recipeId: recipe.id,
        recipeName: recipe.name,
        category: recipe.category,
        maxPortions,
        limitingIngredient,
        ingredientDetails,
        materialCostPerPortion,
        foodCostPercent,
        isActive: recipe.isActive,
      }
    })

    // Pass 2: product portion summaries
    const productPortionSummaries: ProductPortionSummary[] = products.map((product) => {
      const equivalents: PortionEquivalent[] = []

      for (const recipe of recipes) {
        const ing = recipe.ingredients.find((i) => i.productId === product.id)
        if (ing && ing.quantity > 0) {
          equivalents.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            portionsEnabled: Math.floor(product.quantity / ing.quantity),
          })
        }
      }

      return {
        productId: product.id,
        productName: product.name,
        currentStock: product.quantity,
        unit: product.unit,
        portionEquivalents: equivalents,
        totalPortionsEnabled: equivalents.reduce((sum, e) => sum + e.portionsEnabled, 0),
        status: getProductStatus(product),
      }
    })

    // Aggregates
    const feasible = recipePortions.filter((r) => r.maxPortions > 0)
    const feasibleActive = feasible.filter((r) => r.isActive)
    const totalFeasibleRecipes = feasible.length
    const totalActiveRecipes = recipePortions.filter((r) => r.isActive).length
    const averageFoodCost =
      feasibleActive.length > 0
        ? feasibleActive.reduce((sum, r) => sum + r.foodCostPercent, 0) / feasibleActive.length
        : 0
    const totalPortions = recipePortions.reduce((sum, r) => sum + r.maxPortions, 0)

    return {
      recipePortions,
      productPortionSummaries,
      totalFeasibleRecipes,
      totalActiveRecipes,
      averageFoodCost,
      totalPortions,
    }
  }, [recipes, products, _suppliers])
}
