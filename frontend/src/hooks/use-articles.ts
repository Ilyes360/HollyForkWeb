import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPatch, apiDelete, getAccessToken } from "@/api/client"
import { fetchAllPages } from "@/api/pagination"
import type { Recipe, RecipeCategory } from "@/components/carte/types"

export type ApiArticleIngredient = {
  id: number
  requiredQuantity: string
  articleId: number
  ingredientId: number
  ingredientName: string
}

export type ApiArticle = {
  id: number
  name: string
  restaurantId: number | null
  categorieId: number
  categorieName: string | null
  price: string
  description: string | null
  available: boolean
  ingredients: ApiArticleIngredient[]
  allergens: { id: string; label: string }[]
  dietTypes: { id: string; label: string }[]
}

const CATEGORY_NAME_MAP: Record<string, RecipeCategory> = {
  "entrées": "entree",
  "entrée": "entree",
  "entree": "entree",
  "plats": "plat",
  "plat": "plat",
  "desserts": "dessert",
  "dessert": "dessert",
  "boissons": "boisson",
  "boisson": "boisson",
}

function inferCategory(name: string | null): RecipeCategory {
  if (!name) return "plat"
  return CATEGORY_NAME_MAP[name.toLowerCase()] ?? "plat"
}

function apiArticleToRecipe(a: ApiArticle): Recipe {
  return {
    id: String(a.id),
    name: a.name,
    category: inferCategory(a.categorieName),
    sellingPrice: parseFloat(a.price) || 0,
    portions: 1,
    ingredients: (a.ingredients ?? []).map((ing) => ({
      productId: String(ing.ingredientId),
      quantity: parseFloat(ing.requiredQuantity) || 0,
      unit: "kg" as const,
    })),
    allergens: (a.allergens ?? []).map((al) => al.label),
    isActive: a.available,
    notes: a.description ?? "",
    createdAt: "",
    updatedAt: "",
  }
}

const keys = {
  articles: () => ["articles"] as const,
  article: (id: number) => ["articles", id] as const,
}

/**
 * Fetch articles list.
 */
export function useArticles() {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.articles(),
    queryFn: () => fetchAllPages<ApiArticle>("articles/", {}),
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
  })

  const recipes = useMemo(
    () => (query.data ?? []).map(apiArticleToRecipe),
    [query.data],
  )

  return {
    data: recipes,
    isLoading: query.isLoading,
  }
}

/**
 * Fetch single article by id.
 */
export function useArticle(id: number | null) {
  const hasToken = !!getAccessToken()

  return useQuery({
    queryKey: keys.article(id!),
    queryFn: async () => {
      return apiGet<ApiArticle>(`articles/${id}/`)
    },
    enabled: hasToken && id != null,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Create article mutation.
 * Sends: { name, categorie_id (via snakifyKeys from categorieId), price, description }
 */
export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; categorieId: number; price: string; description?: string | null }) =>
      apiPost<ApiArticle>("articles/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  })
}

/**
 * Update article mutation.
 * Sends: { name, categorie_id, price, description, ingredients_update }
 */
export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPatch<ApiArticle>(`articles/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  })
}

/**
 * Delete article mutation.
 */
export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete(`articles/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  })
}
