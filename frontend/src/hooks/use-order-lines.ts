import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAccessToken,
} from "@/api/client"
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
      const res = await apiGet<PaginatedResponse<ApiOrderLine>>(
        "lignes-commandes/",
        {
          commandeId: commandeId!,
        }
      )
      return res.results
    },
    enabled: hasToken && !!commandeId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
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
  return useMutationWithDefaults({
    mutationFn: (data: {
      commandeId: number
      articleId: number
      quantite: number
      prixUnitaire: number
    }) => apiPost<ApiOrderLine>("lignes-commandes/", data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: keys.orderLines(variables.commandeId) }),
  })
}

/**
 * Update order line mutation.
 */
export function useUpdateOrderLine() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      commandeId: number
      data: Partial<{
        articleId: number
        quantite: number
        prixUnitaire: number
      }>
    }) => apiPatch<ApiOrderLine>(`lignes-commandes/${id}/`, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: keys.orderLines(variables.commandeId) }),
  })
}

/**
 * Delete order line mutation.
 */
export function useDeleteOrderLine() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (variables: { id: number; commandeId: number }) =>
      apiDelete(`lignes-commandes/${variables.id}/`),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: keys.orderLines(variables.commandeId) }),
  })
}
