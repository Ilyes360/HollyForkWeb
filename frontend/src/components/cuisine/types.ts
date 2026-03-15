import type { ProductUnit } from "@/components/stocks/types"

export type RecipeCategory = "entree" | "plat" | "dessert" | "boisson"

export interface RecipeIngredient {
  productId: string
  quantity: number
  unit: ProductUnit
}

export interface Recipe {
  id: string
  name: string
  icon?: string
  category: RecipeCategory
  sellingPrice: number
  portions: number
  ingredients: RecipeIngredient[]
  allergens: string[]
  isActive: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export const CATEGORY_LABELS: Record<RecipeCategory, string> = {
  entree: "Entrée",
  plat: "Plat",
  dessert: "Dessert",
  boisson: "Boisson",
}

export const CATEGORY_FILTER_OPTIONS = [
  { value: "toutes", label: "Toutes" },
  { value: "entree", label: "Entrées" },
  { value: "plat", label: "Plats" },
  { value: "dessert", label: "Desserts" },
  { value: "boisson", label: "Boissons" },
] as const

export const FEASIBILITY_FILTER_OPTIONS = [
  { value: "tous", label: "Tous" },
  { value: "realisable", label: "Réalisables" },
  { value: "non_realisable", label: "Non réalisables" },
] as const

export const ALLERGEN_OPTIONS = [
  "Gluten",
  "Crustacés",
  "Oeufs",
  "Poisson",
  "Arachides",
  "Soja",
  "Lait",
  "Fruits à coque",
  "Céleri",
  "Moutarde",
  "Sésame",
  "Sulfites",
  "Lupin",
  "Mollusques",
] as const
