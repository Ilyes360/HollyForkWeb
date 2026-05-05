import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { MOCK_RESERVATIONS, RESTAURANT_TABLES } from "@/components/reservations/data"
import type { PaginatedResponse } from "@/api/types"

type ApiReservation = {
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

type ApiSalle = {
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
 * Dev mode: returns mock data. User mode: fetches from API.
 */
export function useReservations(restaurantId: number | null, date?: string) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.reservations(restaurantId ?? undefined, date),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiReservation>>("reservations/", {
        restaurantId: restaurantId!,
        date,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000, // 30s — reservations change often
  })

  if (isDevMode) {
    return {
      data: MOCK_RESERVATIONS,
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
 * Create reservation mutation.
 */
export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiReservation>("reservations/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  })
}

/**
 * Update reservation status (PATCH).
 */
export function useUpdateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPatch<ApiReservation>(`reservations/${id}/`, data),
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
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.salles(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiSalle>>("salles/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: [], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}

/**
 * Fetch tables for a salle.
 */
export function useTables(salleId?: number) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.tables(salleId),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiTable>>("tables/", {
        salleId: salleId!,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!salleId,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: RESTAURANT_TABLES, isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}
