import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Recipe } from "@/components/carte/types"
import { MOCK_RECIPES } from "@/components/carte/data"

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

interface RecipeStore {
  recipes: Recipe[]
  addRecipe: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => void
  updateRecipe: (id: string, data: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => void
  deleteRecipe: (id: string) => void
  duplicateRecipe: (id: string) => void
  toggleActive: (id: string) => void
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set) => ({
      recipes: MOCK_RECIPES,

      addRecipe: (data) =>
        set((state) => {
          const today = toLocalDateString(new Date())
          const newRecipe: Recipe = {
            ...data,
            id: `r-${Date.now()}`,
            createdAt: today,
            updatedAt: today,
          }
          return { recipes: [...state.recipes, newRecipe] }
        }),

      updateRecipe: (id, data) =>
        set((state) => {
          const today = toLocalDateString(new Date())
          return {
            recipes: state.recipes.map((r) =>
              r.id === id ? { ...r, ...data, updatedAt: today } : r
            ),
          }
        }),

      deleteRecipe: (id) =>
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        })),

      duplicateRecipe: (id) =>
        set((state) => {
          const today = toLocalDateString(new Date())
          const source = state.recipes.find((r) => r.id === id)
          if (!source) return state
          const duplicated: Recipe = {
            ...source,
            id: `r-${Date.now()}`,
            name: `${source.name} (copie)`,
            createdAt: today,
            updatedAt: today,
          }
          return { recipes: [...state.recipes, duplicated] }
        }),

      toggleActive: (id) =>
        set((state) => {
          const today = toLocalDateString(new Date())
          return {
            recipes: state.recipes.map((r) =>
              r.id === id ? { ...r, isActive: !r.isActive, updatedAt: today } : r
            ),
          }
        }),
    }),
    { name: "holly-fork-recipes" }
  )
)
