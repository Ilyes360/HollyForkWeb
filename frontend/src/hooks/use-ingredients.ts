import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { fetchAllPages } from "@/api/pagination"

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
 */
export function useIngredients() {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.ingredients(),
    queryFn: () => fetchAllPages<ApiIngredient>("ingredients/", {}),
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
  })

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
