import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"
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
 */
export function useEmployeesStatus(restaurantId: number | null, date?: string) {
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
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
  }
}
