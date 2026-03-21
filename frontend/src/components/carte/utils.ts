import type { Product } from "@/components/stock/types"
import { getProductStatus } from "@/components/stock/utils"
import type { IngredientPortionInfo, Recipe, RecipeIngredient } from "./types"
import { PORTION_ALERT_THRESHOLD } from "./types"

export function getMaterialCost(
  ingredients: RecipeIngredient[],
  products: Product[]
): number {
  return ingredients.reduce((sum, ing) => {
    const product = products.find((p) => p.id === ing.productId)
    if (!product) return sum
    return sum + ing.quantity * product.unitPrice
  }, 0)
}

export function getFoodCostPercent(
  materialCost: number,
  sellingPrice: number
): number {
  if (sellingPrice === 0) return 0
  return (materialCost / sellingPrice) * 100
}

export function getGrossMargin(
  sellingPrice: number,
  materialCost: number
): number {
  return sellingPrice - materialCost
}

export function getFoodCostColor(percent: number): string {
  if (percent < 25) return "text-emerald-600"
  if (percent <= 35) return "text-amber-600"
  return "text-destructive"
}

export function getMissingIngredients(
  ingredients: RecipeIngredient[],
  products: Product[]
): RecipeIngredient[] {
  return ingredients.filter((ing) => {
    const product = products.find((p) => p.id === ing.productId)
    if (!product) return true
    const status = getProductStatus(product)
    return status === "rupture" || product.quantity < ing.quantity
  })
}

export function isFeasible(
  ingredients: RecipeIngredient[],
  products: Product[]
): boolean {
  return getMissingIngredients(ingredients, products).length === 0
}

export function getMaxPortions(
  ingredients: RecipeIngredient[],
  products: Product[]
): number {
  if (ingredients.length === 0) return 0
  let min = Infinity
  for (const ing of ingredients) {
    const product = products.find((p) => p.id === ing.productId)
    if (!product || ing.quantity <= 0) return 0
    min = Math.min(min, Math.floor(product.quantity / ing.quantity))
  }
  return min === Infinity ? 0 : min
}

export function getRecipesImpactedByAlerts(
  recipes: Recipe[],
  products: Product[]
): number {
  return recipes.filter(
    (r) => r.isActive && !isFeasible(r.ingredients, products)
  ).length
}

export function getLimitingIngredientName(
  limitingIngredient: IngredientPortionInfo | null
): string {
  return limitingIngredient?.productName ?? "—"
}

export function getPortionGaugeColor(
  maxPortions: number,
  threshold: number = PORTION_ALERT_THRESHOLD
): string {
  if (maxPortions === 0) return "bg-destructive"
  if (maxPortions < threshold) return "bg-amber-500"
  return "bg-emerald-500"
}

export function getPortionGaugePercent(
  maxPortions: number,
  threshold: number = PORTION_ALERT_THRESHOLD
): number {
  if (threshold === 0) return 0
  return Math.min(100, Math.round((maxPortions / threshold) * 100))
}
