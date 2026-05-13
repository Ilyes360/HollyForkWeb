import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

export type ApiIngredient = {
  id: number
  name: string
  unit: string
  unitPrice: string
}

const keys = {
  ingredients: () => ["ingredients"] as const,
}

/**
 * Fetch ingredients list.
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function useIngredients() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.ingredients(),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiIngredient>>("ingredients/")
      return res.results
    },
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: [] as ApiIngredient[], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}

/**
 * Create ingredient mutation.
 */
export function useCreateIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiIngredient>("ingredients/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  })
}

/**
 * Update ingredient mutation.
 */
export function useUpdateIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiIngredient>(`ingredients/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  })
}

/**
 * Delete ingredient mutation.
 */
export function useDeleteIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete(`ingredients/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  })
}
