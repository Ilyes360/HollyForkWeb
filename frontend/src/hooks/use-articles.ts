import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { MOCK_RECIPES } from "@/components/carte/data"
import type { PaginatedResponse } from "@/api/types"

type ApiArticle = {
  id: number
  nom: string
  prix: number
  description: string
  categorieId: number
  disponible: boolean
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
 * Create article mutation.
 */
export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiArticle>("articles/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  })
}

/**
 * Update article mutation.
 */
export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiArticle>(`articles/${id}/`, data),
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
