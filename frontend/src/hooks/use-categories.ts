import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

export type ApiCategory = {
  id: number
  name: string
  displayOrder: number
  description: string
}

const keys = {
  categories: () => ["categories"] as const,
}

/**
 * Fetch categories list.
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function useCategories() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.categories(),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiCategory>>("categories/")
      return res.results
    },
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: [] as ApiCategory[], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}

/**
 * Create category mutation.
 */
export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiCategory>("categories/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  })
}

/**
 * Update category mutation.
 */
export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiCategory>(`categories/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  })
}

/**
 * Delete category mutation.
 */
export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete(`categories/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  })
}
