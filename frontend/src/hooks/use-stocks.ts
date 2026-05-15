import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, getAccessToken } from "@/api/client"
import type { PaginatedResponse } from "@/api/types"
import type { Product } from "@/components/stock/types"
import { fetchAllPages } from "@/api/pagination"

// API response shape (flat, after camelizeKeys)
export type ApiStock = {
  id: number
  restaurantId: number
  ingredientId: number
  ingredientName: string
  ingredientUnit: string
  ingredientUnitPrice: string
  quantityInStock: string
  alertThreshold: string
  weightedAverageCost: string
}

function apiStockToProduct(s: ApiStock): Product {
  const quantity = parseFloat(s.quantityInStock) || 0
  const minStock = parseFloat(s.alertThreshold) || 0
  const unitPrice = parseFloat(s.ingredientUnitPrice) || parseFloat(s.weightedAverageCost) || 0
  return {
    id: String(s.id),
    name: s.ingredientName,
    icon: "naturalfood",
    quantity,
    unit: (s.ingredientUnit || "kg") as Product["unit"],
    minStock,
    maxStock: minStock * 3 || 100,
    unitPrice,
    supplierId: "",
    category: "epicerie",
    rotation: 0,
    lastOrderDate: "",
    expirationDate: "",
    storageZone: "reserve_seche",
    notes: "",
    orderHistory: [],
  }
}

const keys = {
  stocks: (restaurantId?: number) => ["stocks", restaurantId] as const,
  stockAlerts: (restaurantId?: number) => ["stocks", "alerts", restaurantId] as const,
}

export function useStocks(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.stocks(restaurantId ?? undefined),
    queryFn: () => fetchAllPages<ApiStock>("stocks/", { restaurantId: restaurantId! }),
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  const products = useMemo(
    () => (query.data ?? []).map(apiStockToProduct),
    [query.data],
  )

  return { data: products, isLoading: query.isLoading }
}

export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiStock>(`stocks/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stocks"] }),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { quantity: number; adjustmentType: string; reason?: string } }) =>
      apiPost<ApiStock>(`stocks/${id}/adjust/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stocks"] }),
  })
}

export function useStockAlerts(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  return useQuery({
    queryKey: keys.stockAlerts(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiStock>>("stocks/alerts/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })
}
