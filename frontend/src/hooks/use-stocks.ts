import { useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAccessToken,
} from "@/api/client"
import { fetchAllPages } from "@/api/pagination"
import { apiStockToProduct } from "@/components/stock/mapping"
import type { ApiStock } from "@/components/stock/mapping"

export type { ApiStock }

const keys = {
  stocks: (restaurantId?: number) => ["stocks", restaurantId] as const,
  stockAlerts: (restaurantId?: number) =>
    ["stocks", "alerts", restaurantId] as const,
}

export function useStocks(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.stocks(restaurantId ?? undefined),
    queryFn: () =>
      fetchAllPages<ApiStock>("stocks/", { restaurantId: restaurantId! }),
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  const products = useMemo(
    () => (query.data ?? []).map(apiStockToProduct),
    [query.data]
  )

  return { data: products, isLoading: query.isLoading }
}

export function useUpdateStock() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (variables: {
      id: number
      restaurantId: number
      data: Partial<{
        restaurantId: number
        ingredientId: number
        quantityInStock: string
        alertThreshold: string
      }>
    }) => apiPatch<ApiStock>(`stocks/${variables.id}/`, variables.data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: keys.stocks(variables.restaurantId) }),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (variables: {
      id: number
      restaurantId: number
      data: {
        quantity: string
        adjustmentType: "ajout" | "retrait"
        reason?: string
      }
    }) =>
      apiPost<{ message: string; stock: ApiStock }>(
        `stocks/${variables.id}/adjust/`,
        variables.data
      ),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: keys.stocks(variables.restaurantId) }),
  })
}

export function useCreateStock() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (data: {
      restaurantId: number
      ingredientId: number
      quantityInStock: string
      alertThreshold: string
    }) => apiPost<ApiStock>("stocks/", data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: keys.stocks(variables.restaurantId) })
      qc.invalidateQueries({ queryKey: ["ingredients"] })
    },
  })
}

export function useDeleteStock() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (variables: { id: number; restaurantId: number }) =>
      apiDelete(`stocks/${variables.id}/`),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: keys.stocks(variables.restaurantId) }),
  })
}

// API response shape for /stocks/alerts/ (NOT paginated — custom endpoint)
type ApiStockAlertItem = {
  stockId: number
  ingredientName: string
  quantityInStock: number
  alertThreshold: number
  unit: string
  restaurantName: string
}

type ApiStockAlertsResponse = {
  restaurantId: string | null
  alertsCount: number
  alerts: ApiStockAlertItem[]
}

export function useStockAlerts(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  return useQuery({
    queryKey: keys.stockAlerts(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<ApiStockAlertsResponse>("stocks/alerts/", {
        restaurantId: restaurantId!,
      })
      return res.alerts
    },
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}
