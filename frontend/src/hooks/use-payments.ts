import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, getAccessToken } from "@/api/client"
import type { PaginatedResponse } from "@/api/types"

type ApiPayment = {
  id: number
  commandeId: number
  montant: number
  methodePaiement: string
  datePaiement: string
  reference: string
}

const keys = {
  payments: (restaurantId?: number) => ["payments", restaurantId] as const,
}

/**
 * Fetch payments for a restaurant.
 */
export function usePayments(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.payments(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiPayment>>("paiements/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
  }
}

/**
 * Create payment mutation.
 */
export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      commandeId: number
      montant: number
      methodePaiement: string
      datePaiement?: string
      reference?: string
    }) => apiPost<ApiPayment>("paiements/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  })
}
