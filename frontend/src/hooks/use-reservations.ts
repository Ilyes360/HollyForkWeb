import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAccessToken,
} from "@/api/client"
import type { PaginatedResponse } from "@/api/types"

export type ApiReservation = {
  id: number
  clientName: string
  clientPhone: string
  clientEmail: string | null
  date: string
  time: string
  service: string
  covers: number
  tableNumber: number
  canal: string
  status: string
  notes: string | null
  restaurantId: number
  createdAt: string
}

export type ApiSalle = {
  id: number
  nom: string
  restaurantId: number
  capacite: number
}

type ApiTable = {
  id: number
  numero: number
  label: string
  places: number
  salleId: number
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
      const res = await apiGet<PaginatedResponse<ApiReservation>>(
        "reservations/",
        {
          restaurantId: restaurantId!,
          date,
        }
      )
      return res.results
    },
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000, // 30s — reservations change often
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
  }
}

/**
 * Create reservation mutation.
 */
export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      clientName: string
      partySize: number
      datetime: string
      phoneNumber?: string
      salleId: number
      tableId?: number | null
      notes?: string | null
    }) => apiPost<ApiReservation>("reservations/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  })
}

/**
 * Update reservation status (PATCH).
 */
export function useUpdateReservation() {
  const qc = useQueryClient()
  return useMutation({
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
        status: string
        notes: string | null
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
  return useMutation({
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

  return { data: query.data ?? [], isLoading: query.isLoading }
}
