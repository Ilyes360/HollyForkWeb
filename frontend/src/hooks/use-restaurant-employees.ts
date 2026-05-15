import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiDelete, getAccessToken } from "@/api/client"
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
 */
export function useRestaurantEmployees(restaurantId: number | null) {
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
    enabled: hasToken && !!restaurantId,
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
  return useMutation({
    mutationFn: (data: {
      restaurantId: number
      employeId: number
      dateAffectation?: string
      actif?: boolean
    }) => apiPost<ApiRestaurantEmployee>("restaurant-employes/", data),
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
