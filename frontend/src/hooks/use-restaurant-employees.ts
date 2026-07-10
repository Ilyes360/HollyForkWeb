import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import { apiGet, apiPost, apiDelete, getAccessToken } from "@/api/client"
import { fetchAllPages } from "@/api/pagination"
import type { PaginatedResponse } from "@/api/types"

export type ApiRestaurantEmployee = {
  id: number
  restaurantId: number
  employeId: number
}

const keys = {
  all: ["restaurant-employees"] as const,
  byRestaurant: (restaurantId?: number) =>
    ["restaurant-employees", restaurantId] as const,
}

/**
 * Fetch restaurant-employee assignments for a specific restaurant.
 */
export function useRestaurantEmployees(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.byRestaurant(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiRestaurantEmployee>>(
        "restaurant-employes/",
        { restaurant: restaurantId! }
      )
      return res.results
    },
    enabled: hasToken && !!restaurantId,
    staleTime: 2 * 60 * 1000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
  }
}

/**
 * Fetch ALL restaurant-employee assignments (no filter).
 * Used by admin page to group employees by establishment.
 */
export function useAllRestaurantAssignments() {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.all,
    queryFn: () =>
      fetchAllPages<ApiRestaurantEmployee>("restaurant-employes/", {}),
    enabled: hasToken,
    staleTime: 2 * 60 * 1000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
  }
}

/**
 * Assign employee to restaurant mutation.
 */
export function useAssignEmployee() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (data: {
      restaurantId: number
      employeId: number
      dateAffectation?: string
      actif?: boolean
    }) => apiPost<ApiRestaurantEmployee>("restaurant-employes/", data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["restaurant-employees"] }),
  })
}

/**
 * Unassign employee from restaurant mutation.
 */
export function useUnassignEmployee() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (id: number) => apiDelete(`restaurant-employes/${id}/`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["restaurant-employees"] }),
  })
}
