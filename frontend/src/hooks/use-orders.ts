import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPatch, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useInventoryStore } from "@/stores/inventory-store"
import type { PaginatedResponse } from "@/api/types"

export type ApiSupplierOrder = {
  id: number
  fournisseur: { id: number; name: string }
  restaurant: { restaurantId: number; name: string }
  orderNumber: string
  orderDate: string
  expectedDeliveryDate: string | null
  status: string // "DRAFT"|"SENT"|"CONFIRMED"|"DELIVERED"|"CANCELLED"
  totalAmount: string
  notes: string | null
}

const keys = {
  orders: (restaurantId?: number) => ["orders", restaurantId] as const,
}

/**
 * Fetch supplier orders for a restaurant.
 * Dev mode: returns from inventory store. User mode: fetches from API.
 */
export function useOrders(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()
  const storeOrders = useInventoryStore((s) => s.orders)

  const query = useQuery({
    queryKey: keys.orders(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiSupplierOrder>>("suppliers/orders/", {
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
 * Create supplier order mutation.
 */
export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiSupplierOrder>("suppliers/orders/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}

/**
 * Update supplier order mutation (e.g. change status).
 */
export function useUpdateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPatch<ApiSupplierOrder>(`suppliers/orders/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}
