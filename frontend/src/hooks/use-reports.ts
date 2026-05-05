import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

type ApiReport = {
  type: string
  restaurantId: number
  periode: string
  chiffreAffaires: number
  nombreCouverts: number
  panierMoyen: number
  foodCostPct: number
}

const keys = {
  reports: (restaurantId?: number, type?: string) =>
    ["reports", restaurantId, type] as const,
}

/**
 * Fetch reports for a restaurant.
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function useReports(restaurantId: number | null, type?: string) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.reports(restaurantId ?? undefined, type),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiReport>>("reports/", {
        restaurantId: restaurantId!,
        type,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 60 * 1000,
  })

  if (isDevMode) {
    return {
      data: [] as ApiReport[],
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
