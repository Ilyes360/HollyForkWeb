import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { MOCK_PRODUCTS } from "@/components/stock/data"
import type { PaginatedResponse } from "@/api/types"

export type ApiStock = {
  id: number
  restaurant: { restaurantId: number; name: string }
  ingredient: { id: number; name: string; unit: string; unitPrice: string }
  quantityInStock: string
  alertThreshold: string
  weightedAverageCost: string
}

const keys = {
  stocks: (restaurantId?: number) => ["stocks", restaurantId] as const,
  stockAlerts: (restaurantId?: number) => ["stocks", "alerts", restaurantId] as const,
}

/**
 * Fetch stocks for a restaurant.
 * Dev mode: returns MOCK_PRODUCTS. User mode: fetches from API.
 */
export function useStocks(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.stocks(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiStock>>("stocks/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  if (isDevMode) {
    return {
      data: MOCK_PRODUCTS,
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
 * Update stock mutation.
 */
export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiStock>(`stocks/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stocks"] }),
  })
}

/**
 * Adjust stock quantity — POST stocks/{id}/adjust/ with { quantite, raison, type }.
 */
export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { quantite: number; raison: string; type: string } }) =>
      apiPost<ApiStock>(`stocks/${id}/adjust/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stocks"] }),
  })
}

/**
 * Fetch stock alerts for a restaurant — GET stocks/alerts/.
 */
export function useStockAlerts(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  return useQuery({
    queryKey: keys.stockAlerts(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiStock>>("stocks/alerts/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })
}
