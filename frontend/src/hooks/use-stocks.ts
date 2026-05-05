import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPut, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { MOCK_PRODUCTS } from "@/components/stock/data"
import type { PaginatedResponse } from "@/api/types"

type ApiStock = {
  id: number
  ingredientId: number
  ingredientNom: string
  quantite: number
  unite: string
  seuilMin: number
  zoneStockage: string
  restaurantId: number
}

const keys = {
  stocks: (restaurantId?: number) => ["stocks", restaurantId] as const,
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
