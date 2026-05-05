import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
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
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function usePayments(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.payments(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiPayment>>("paiements/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  if (isDevMode) {
    return {
      data: [] as ApiPayment[],
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
 * Create payment mutation.
 */
export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiPayment>("paiements/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  })
}
