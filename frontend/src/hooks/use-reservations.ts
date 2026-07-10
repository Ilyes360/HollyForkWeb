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
import { fetchAllPages } from "@/api/pagination"

/** Matches the backend Reservation schema (after camelizeKeys) */
export type ApiReservation = {
  id: number
  clientName: string
  partySize: number
  datetime: string // ISO 8601: "2026-05-16T12:00:00"
  phoneNumber: string
  salleId: number
  tableId: number | null
  noteServeur: string | null
  noteClient: string | null
  allergie: string | null
  allergyIds?: number[]
  dietTypeIds?: number[]
  allergies?: { id: number; code: string; label: string }[]
  dietTypes?: { id: number; code: string; label: string }[]
}

/** Matches backend Salle schema (after camelizeKeys) */
export type ApiSalle = {
  id: number
  name: string
  restaurantId: number
  capacity: number
  floor: number | null
  description: string | null
}

/** Matches backend Table schema (after camelizeKeys) */
type ApiTable = {
  id: number
  numero: number
  capacity: number
  salleId: number
  positionX: number | null
  positionY: number | null
}

const keys = {
  reservations: (restaurantId?: number, date?: string) =>
    ["reservations", restaurantId, date] as const,
  salles: (restaurantId?: number) => ["salles", restaurantId] as const,
  tables: (salleId?: number) => ["tables", salleId] as const,
}

/**
 * Fetch reservations for a restaurant/date.
 */
export function useReservations(restaurantId: number | null, date?: string) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.reservations(restaurantId ?? undefined, date),
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        restaurantId: restaurantId!,
      }
      if (date) params.date = date
      return fetchAllPages<ApiReservation>("reservations/", params)
    },
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000, // 30s — reservations change often
    refetchOnWindowFocus: true, // §6.2 — gérant revient sur l'onglet → voir nouvelles résas
  })

  const reservations: ApiReservation[] = query.data ?? []
  return {
    data: reservations,
    isLoading: query.isLoading,
  }
}

/**
 * Create reservation mutation.
 */
export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (data: {
      clientName: string
      partySize: number
      datetime: string
      phoneNumber?: string
      salleId: number
      tableId?: number | null
      noteServeur?: string | null
      noteClient?: string | null
    }) => apiPost<ApiReservation>("reservations/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  })
}

/**
 * Update reservation status (PATCH).
 */
export function useUpdateReservation() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<{
        clientName: string
        partySize: number
        datetime: string
        phoneNumber: string
        salleId: number
        tableId: number | null
        noteServeur: string | null
        noteClient: string | null
      }>
    }) => apiPatch<ApiReservation>(`reservations/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  })
}

/**
 * Delete reservation.
 */
export function useDeleteReservation() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (id: number) => apiDelete(`reservations/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  })
}

/**
 * Fetch salles for a restaurant.
 */
export function useSalles(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.salles(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiSalle>>("salles/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: hasToken && !!restaurantId,
    staleTime: 5 * 60 * 1000,
  })

  return { data: query.data ?? [], isLoading: query.isLoading }
}

/**
 * Fetch tables for a salle.
 */
export function useTables(salleId?: number) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.tables(salleId),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiTable>>("tables/", {
        salleId: salleId!,
      })
      return res.results
    },
    enabled: hasToken && !!salleId,
    staleTime: 5 * 60 * 1000,
  })

  const tables: ApiTable[] = query.data ?? []
  return { data: tables, isLoading: query.isLoading }
}
