import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPatch, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { MOCK_RECIPES } from "@/components/carte/data"
import type { PaginatedResponse } from "@/api/types"

export type ApiArticle = {
  id: number
  name: string
  categorie: { id: number; name: string; displayOrder: number; description: string }
  price: string
  description: string | null
  available: boolean
}

const keys = {
  articles: () => ["articles"] as const,
  article: (id: number) => ["articles", id] as const,
}

/**
 * Fetch articles list.
 * Dev mode: returns MOCK_RECIPES. User mode: fetches from API.
 */
export function useArticles() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.articles(),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiArticle>>("articles/")
      return res.results
    },
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return {
      data: MOCK_RECIPES,
      isLoading: false,
      source: "mock" as const,
    }
  }

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    source: "api" as const,
  }
}

/**
 * Fetch single article by id.
 */
export function useArticle(id: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  return useQuery({
    queryKey: keys.article(id!),
    queryFn: async () => {
      return apiGet<ApiArticle>(`articles/${id}/`)
    },
    enabled: !isDevMode && hasToken && id != null,
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
