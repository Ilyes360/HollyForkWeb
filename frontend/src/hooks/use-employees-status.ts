import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

type ApiEmployeeStatus = {
  id: number
  employeId: number
  nom: string
  prenom: string
  statut: string
  heureArrivee: string | null
  restaurantId: number
  date: string
}

const keys = {
  status: (restaurantId?: number, date?: string) =>
    ["employees-status", restaurantId, date] as const,
}

/**
 * Fetch employees status for a restaurant.
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function useEmployeesStatus(restaurantId: number | null, date?: string) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.status(restaurantId ?? undefined, date),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiEmployeeStatus>>(
        "employees/status/",
        {
          restaurantId: restaurantId!,
          date,
        },
      )
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  if (isDevMode) {
    return {
      data: [] as ApiEmployeeStatus[],
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
