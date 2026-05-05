import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPut, apiPost, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

type ApiSettings = {
  id: number
  restaurantId: number
  nomRestaurant: string
  adresse: string
  telephone: string
  email: string
  siret: string
  tvaNumber: string
  horairesMidi: { debut: string; fin: string }
  horairesSoir: { debut: string; fin: string }
  joursOuverture: string[]
}

type ApiMethodePaiement = {
  id: number
  nom: string
  actif: boolean
}

type ApiNote = {
  id: number
  contenu: string
  restaurantId: number
  createdAt: string
}

const keys = {
  settings: () => ["settings"] as const,
  paymentMethods: () => ["payment-methods"] as const,
  notes: () => ["notes"] as const,
}

/**
 * Fetch restaurant settings.
 */
export function useSettings() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.settings(),
    queryFn: () => apiGet<ApiSettings>("settings/"),
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: null, isLoading: false, source: "mock" as const }
  }

  return { data: query.data ?? null, isLoading: query.isLoading, source: "api" as const }
}

/**
 * Update settings.
 */
export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPut<ApiSettings>("settings/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings() }),
  })
}

/**
 * Fetch payment methods.
 */
export function usePaymentMethods() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.paymentMethods(),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiMethodePaiement>>("methodes-paiement/")
      return res.results
    },
    enabled: !isDevMode && hasToken,
    staleTime: 10 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: [], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}

/**
 * Fetch notes.
 */
export function useNotes(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: [...keys.notes(), restaurantId],
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiNote>>("notes/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 60 * 1000,
  })

  if (isDevMode) {
    return { data: [], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}

/**
 * Create note.
 */
export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiNote>("notes/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notes() }),
  })
}
