import { useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import { apiGet, apiPost, apiPatch, getAccessToken } from "@/api/client"
import type { PaginatedResponse } from "@/api/types"
import type { Commande } from "@/components/commandes-clients/types"

// Raw API response shape (after camelizeKeys)
type ApiCommande = {
  id: number
  status: string
  kitchenStatus: string
  priority: string
  restaurantId: number
  tableId: number | null
  createdById: number
  createdAt: string
  itemsCount: number
  amount: string
  totalCostOfGoodsSold: string
  isInProgress: boolean
  lines: Array<{
    id: number
    articleId: number
    articleName: string
    quantity: number
    unitPrice: string
    costOfGoodsSold: string
    awaitingService: boolean
  }>
}

function apiToCommande(c: ApiCommande): Commande {
  return {
    id: c.id,
    status: c.status as Commande["status"],
    kitchenStatus: (c.kitchenStatus || "PENDING") as Commande["kitchenStatus"],
    priority: c.priority || "",
    restaurantId: c.restaurantId,
    tableId: c.tableId,
    createdById: c.createdById,
    createdAt: c.createdAt,
    itemsCount: c.itemsCount,
    amount: parseFloat(c.amount) || 0,
    totalCostOfGoodsSold: parseFloat(c.totalCostOfGoodsSold) || 0,
    isInProgress: c.isInProgress,
    lines: (c.lines ?? []).map((l) => ({
      id: l.id,
      articleId: l.articleId,
      articleName: l.articleName,
      quantity: l.quantity,
      unitPrice: parseFloat(l.unitPrice) || 0,
      costOfGoodsSold: parseFloat(l.costOfGoodsSold) || 0,
      awaitingService: l.awaitingService,
    })),
  }
}

const keys = {
  all: () => ["commandes-clients"] as const,
  active: (restaurantId?: number) =>
    ["commandes-clients", "active", restaurantId] as const,
  kitchen: (restaurantId?: number) =>
    ["commandes-clients", "kitchen", restaurantId] as const,
}

/**
 * Active (EN_COURS) commandes for a restaurant.
 * Short staleTime for near-real-time updates.
 */
export function useCommandesActives(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.active(restaurantId ?? undefined),
    queryFn: () =>
      apiGet<PaginatedResponse<ApiCommande>>("commandes/", {
        restaurantId: restaurantId!,
        statut: "EN_COURS",
      }),
    enabled: hasToken && !!restaurantId,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 15 * 1000,
  })

  const commandes = useMemo(
    () => (query.data?.results ?? []).map(apiToCommande),
    [query.data]
  )

  return { data: commandes, isLoading: query.isLoading, refetch: query.refetch }
}

/**
 * Create a new commande on a table.
 */
export function useCreateCommande() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (data: {
      restaurantId: number
      tableId: number | null
      createdById: number
    }) =>
      apiPost<ApiCommande>("commandes/", {
        ...data,
        status: "EN_COURS",
        kitchenStatus: "PENDING",
        priority: "NORMAL",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

/**
 * Update commande (status, kitchen_status, etc.)
 */
export function useUpdateCommande() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<{
        status: string
        kitchenStatus: string
        priority: string
        tableId: number | null
      }>
    }) => apiPatch<ApiCommande>(`commandes/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

/**
 * Cancel commande.
 */
export function useAnnulerCommande() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (id: number) =>
      apiPost<{ detail: string }>(`commandes/${id}/annuler/`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

/**
 * Move commande to another table.
 */
export function useDeplacerCommande() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: ({ id, tableId }: { id: number; tableId: number }) =>
      apiPost<ApiCommande>(`commandes/${id}/deplacer/`, { tableId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

/**
 * Add a line to a commande.
 */
export function useAddLigneCommande() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (data: {
      commandeId: number
      articleId: number
      quantity: number
      awaitingService?: boolean
    }) => apiPost("lignes-commandes/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

/**
 * Claim a line (send awaiting dessert to kitchen).
 */
export function useReclamerLigne() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (id: number) => apiPost(`lignes-commandes/${id}/reclamer/`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}

/**
 * Delete a line from a commande.
 */
export function useDeleteLigneCommande() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (id: number) => apiPost(`lignes-commandes/${id}/`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all() }),
  })
}
