import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

type ApiRestaurantEmployee = {
  id: number
  restaurantId: number
  employeId: number
  dateAffectation: string
  actif: boolean
}

const keys = {
  restaurantEmployees: (restaurantId?: number) =>
    ["restaurant-employees", restaurantId] as const,
}

/**
 * Fetch restaurant-employee assignments.
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function useRestaurantEmployees(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.restaurantEmployees(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiRestaurantEmployee>>(
        "restaurant-employes/",
        {
          restaurantId: restaurantId!,
        },
      )
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 2 * 60 * 1000,
  })

  if (isDevMode) {
    return {
      data: [] as ApiRestaurantEmployee[],
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
 * Assign employee to restaurant mutation.
 */
export function useAssignEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiRestaurantEmployee>("restaurant-employes/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-employees"] }),
  })
}

/**
 * Unassign employee from restaurant mutation.
 */
export function useUnassignEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete(`restaurant-employes/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-employees"] }),
  })
}
