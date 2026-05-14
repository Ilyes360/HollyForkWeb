import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiPost, apiPatch, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useInventoryStore } from "@/stores/inventory-store"
import { fetchAllPages } from "@/api/pagination"

// Flat API response (after camelizeKeys)
export type ApiSupplierOrder = {
  id: number
  fournisseurId: number
  fournisseurName: string
  restaurantId: number
  orderNumber: string
  orderDate: string
  expectedDeliveryDate: string | null
  status: string // "DRAFT"|"SENT"|"CONFIRMED"|"DELIVERED"|"CANCELLED"
  totalAmount: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

const keys = {
  orders: (restaurantId?: number) => ["orders", restaurantId] as const,
}

export function useOrders(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()
  const storeOrders = useInventoryStore((s) => s.orders)

  // Swagger filter param is "restaurant" (not restaurant_id)
  const query = useQuery({
    queryKey: keys.orders(restaurantId ?? undefined),
    queryFn: () => fetchAllPages<ApiSupplierOrder>("suppliers/orders/", {
      restaurant: restaurantId!,
    }),
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  if (isDevMode) {
    return { data: storeOrders, isLoading: false, source: "mock" as const }
  }

  return { data: query.data ?? [], isLoading: query.isLoading, source: "api" as const }
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiSupplierOrder>("suppliers/orders/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}

export function useUpdateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPatch<ApiSupplierOrder>(`suppliers/orders/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  })
}
