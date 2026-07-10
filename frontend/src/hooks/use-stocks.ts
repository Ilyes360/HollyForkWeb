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
import type { Product, ProductUnit } from "@/components/stock/types"
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

const VALID_UNITS: Set<string> = new Set<string>([
  "kg",
  "L",
  "btl",
  "unites",
  "pieces",
])

function toProductUnit(raw: string): ProductUnit {
  if (VALID_UNITS.has(raw)) return raw as ProductUnit
  // Map common backend variants
  if (raw === "litre" || raw === "l") return "L"
  if (raw === "bouteille") return "btl"
  if (raw === "piece" || raw === "pièce" || raw === "pcs") return "pieces"
  if (raw === "unite" || raw === "unité") return "unites"
  return "kg"
}

function apiStockToProduct(s: ApiStock): Product {
  const quantity = parseFloat(s.quantityInStock) || 0
  const minStock = parseFloat(s.alertThreshold) || 0
  const unitPrice =
    parseFloat(s.ingredientUnitPrice) || parseFloat(s.weightedAverageCost) || 0
  return {
    id: String(s.id),
    name: s.ingredientName,
    quantity,
    unit: toProductUnit(s.ingredientUnit),
    minStock,
    maxStock: minStock * 3 || 100,
    unitPrice,
    supplierId: "",
    category: "epicerie",
    storageZone: "reserve_seche",
    notes: "",
  }
}

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
