import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAccessToken,
} from "@/api/client"
import type { PaginatedResponse } from "@/api/types"
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
  all: () => ["orders"] as const,
  list: (restaurantId?: number, page?: number) =>
    ["orders", "list", restaurantId, page] as const,
  pendingCount: (restaurantId?: number) =>
    ["orders", "pending-count", restaurantId] as const,
}

/**
 * Paginated orders hook — uses server-side pagination.
 * Orders are unbounded (can grow to thousands), so fetchAllPages is not appropriate.
 */
export function useOrders(restaurantId: number | null) {
  const hasToken = !!getAccessToken()
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: keys.list(restaurantId ?? undefined, page),
    queryFn: () =>
      apiGet<PaginatedResponse<ApiSupplierOrder>>("suppliers/orders/", {
        restaurant: restaurantId!,
        page,
      }),
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  const orders = useMemo(
    () => (query.data?.results ?? []).map(apiOrderToOrder),
    [query.data]
  )

  return {
    data: orders,
    isLoading: query.isLoading,
    page,
    setPage,
    total: query.data?.count ?? 0,
    hasNextPage: !!query.data?.next,
    hasPreviousPage: !!query.data?.previous,
  }
}

/**
 * Lightweight hook for badge counts (sidebar).
 * Only fetches page 1 to get the total count of pending orders.
 */
export function useOrdersPendingCount(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.pendingCount(restaurantId ?? undefined),
    queryFn: () =>
      apiGet<PaginatedResponse<ApiSupplierOrder>>("suppliers/orders/", {
        restaurant: restaurantId!,
        status: "DRAFT",
      }),
    enabled: hasToken && !!restaurantId,
    staleTime: 60 * 1000,
  })

  return { count: query.data?.count ?? 0 }
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (data: {
      fournisseurId: number
      restaurantId: number
      expectedDeliveryDate?: string
      notes?: string
    }) => apiPost<ApiSupplierOrder>("suppliers/orders/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

export function useUpdateOrder() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<{
        fournisseurId: number
        restaurantId: number
        expectedDeliveryDate: string
        status: string
        notes: string
      }>
    }) => apiPatch<ApiSupplierOrder>(`suppliers/orders/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (id: number) => apiDelete(`suppliers/orders/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}
