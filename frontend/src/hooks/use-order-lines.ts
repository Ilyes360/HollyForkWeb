import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import type { PaginatedResponse } from "@/api/types"

type ApiOrderLine = {
  id: number
  commandeId: number
  articleId: number
  articleNom: string
  quantite: number
  prixUnitaire: number
  montantTotal: number
}

const keys = {
  orderLines: (commandeId?: number) => ["order-lines", commandeId] as const,
}

/**
 * Fetch order lines for a given order.
 */
export function useOrderLines(commandeId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.orderLines(commandeId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiOrderLine>>("lignes-commandes/", {
        commandeId: commandeId!,
      })
      return res.results
    },
    enabled: hasToken && !!commandeId,
    staleTime: 30 * 1000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
  }
}

/**
 * Create order line mutation.
 */
export function useCreateOrderLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      commandeId: number
      articleId: number
      quantite: number
      prixUnitaire: number
    }) => apiPost<ApiOrderLine>("lignes-commandes/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order-lines"] }),
  })
}

/**
 * Update order line mutation.
 */
export function useUpdateOrderLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{
      commandeId: number
      articleId: number
      quantite: number
      prixUnitaire: number
    }> }) => apiPut<ApiOrderLine>(`lignes-commandes/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order-lines"] }),
  })
}

/**
 * Delete order line mutation.
 */
export function useDeleteOrderLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete(`lignes-commandes/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order-lines"] }),
  })
}
