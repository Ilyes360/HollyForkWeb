import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useInventoryStore } from "@/stores/inventory-store"
import type { PaginatedResponse } from "@/api/types"

type ApiOrder = {
  id: number
  fournisseurId: number
  restaurantId: number
  dateCommande: string
  dateLivraisonPrevue: string
  statut: string
  lignes: { articleId: number; quantite: number; prixUnitaire: number }[]
}

const keys = {
  orders: (restaurantId?: number) => ["orders", restaurantId] as const,
}

/**
 * Fetch orders for a restaurant.
 * Dev mode: returns from inventory store. User mode: fetches from API.
 */
export function useOrders(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()
  const storeOrders = useInventoryStore((s) => s.orders)

  const query = useQuery({
    queryKey: keys.orders(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiOrder>>("commandes/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  if (isDevMode) {
    return {
      data: storeOrders,
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
 * Create order mutation.
 */
export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiOrder>("commandes/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}

/**
 * Update order mutation.
 */
export function useUpdateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiOrder>(`commandes/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}
