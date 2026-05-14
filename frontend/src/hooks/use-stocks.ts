import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { MOCK_PRODUCTS } from "@/components/stock/data"
import type { PaginatedResponse } from "@/api/types"
import { fetchAllPages } from "@/api/pagination"

// API response shape (flat, after camelizeKeys)
export type ApiStock = {
  id: number
  restaurantId: number
  ingredientId: number
  ingredientName: string
  quantityInStock: string
  alertThreshold: string
  weightedAverageCost: string
}

const keys = {
  stocks: (restaurantId?: number) => ["stocks", restaurantId] as const,
  stockAlerts: (restaurantId?: number) => ["stocks", "alerts", restaurantId] as const,
}

export function useStocks(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.stocks(restaurantId ?? undefined),
    queryFn: () => fetchAllPages<ApiStock>("stocks/", { restaurantId: restaurantId! }),
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  if (isDevMode) {
    return { data: MOCK_PRODUCTS, isLoading: false, source: "mock" as const }
  }

  return { data: query.data ?? [], isLoading: query.isLoading, source: "api" as const }
}

export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiStock>(`stocks/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stocks"] }),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { quantity: number; adjustmentType: string; reason?: string } }) =>
      apiPost<ApiStock>(`stocks/${id}/adjust/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stocks"] }),
  })
}

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
