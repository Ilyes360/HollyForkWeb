import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiPost, apiPatch, getAccessToken } from "@/api/client"
import { fetchAllPages } from "@/api/pagination"
import type { Order, OrderStatus } from "@/components/commandes/types"

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

const STATUS_MAP: Record<string, OrderStatus> = {
  DRAFT: "pending",
  SENT: "pending",
  CONFIRMED: "pending",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
}

function apiOrderToOrder(o: ApiSupplierOrder): Order {
  return {
    id: String(o.id),
    supplierId: String(o.fournisseurId),
    items: [],
    date: o.orderDate,
    status: STATUS_MAP[o.status] ?? "pending",
    totalAmount: parseFloat(o.totalAmount) || 0,
    expectedDelivery: o.expectedDeliveryDate ?? "",
    notes: o.notes ?? "",
  }
}

const keys = {
  orders: (restaurantId?: number) => ["orders", restaurantId] as const,
}

export function useOrders(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  // Swagger filter param is "restaurant" (not restaurant_id)
  const query = useQuery({
    queryKey: keys.orders(restaurantId ?? undefined),
    queryFn: () => fetchAllPages<ApiSupplierOrder>("suppliers/orders/", {
      restaurant: restaurantId!,
    }),
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  const orders = useMemo(
    () => (query.data ?? []).map(apiOrderToOrder),
    [query.data],
  )

  return { data: orders, isLoading: query.isLoading }
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
