import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

type ApiReapprovisionnement = {
  id: number
  stockId: number
  quantite: number
  date: string
  fournisseurId: number
  restaurantId: number
}

const keys = {
  reapprovisionnements: (restaurantId?: number) =>
    ["reapprovisionnements", restaurantId] as const,
}

/**
 * Fetch reapprovisionnements for a restaurant.
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function useReapprovisionnements(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.reapprovisionnements(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiReapprovisionnement>>(
        "reapprovisionnements/",
        {
          restaurantId: restaurantId!,
        },
      )
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  if (isDevMode) {
    return {
      data: [] as ApiReapprovisionnement[],
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
 * Create reapprovisionnement mutation.
 */
export function useCreateReapprovisionnement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiReapprovisionnement>("reapprovisionnements/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reapprovisionnements"] }),
  })
}
