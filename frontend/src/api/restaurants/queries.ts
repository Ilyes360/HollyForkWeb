import { useQuery } from "@tanstack/react-query"
import { apiGet } from "../client"
import type { PaginatedResponse } from "../types"
import type { Restaurant } from "./types"

export const restaurantKeys = {
  all: () => ["restaurants"] as const,
  list: () => [...restaurantKeys.all(), "list"] as const,
  detail: (id: number) => [...restaurantKeys.all(), "detail", id] as const,
}

export function useRestaurants(enabled = true) {
  return useQuery({
    queryKey: restaurantKeys.list(),
    queryFn: async () => {
      const response = await apiGet<PaginatedResponse<Restaurant>>("restaurants/")
      return response.results
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min — restaurants change rarely
  })
}

export function useRestaurant(id: number | null) {
  return useQuery({
    queryKey: restaurantKeys.detail(id!),
    queryFn: () => apiGet<Restaurant>(`restaurants/${id}/`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}
