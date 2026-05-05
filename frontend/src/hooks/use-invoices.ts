import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

type ApiInvoice = {
  id: number
  numero: string
  commandeId: number
  restaurantId: number
  fournisseurNom: string
  dateFacture: string
  dateEcheance: string
  montantHt: number
  montantTva: number
  montantTtc: number
  statut: string
  lignes: { description: string; quantite: number; prixUnitaire: number; tvaRate: number }[]
}

const keys = {
  invoices: (restaurantId?: number) => ["invoices", restaurantId] as const,
}

/**
 * Fetch invoices for a restaurant.
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function useInvoices(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.invoices(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiInvoice>>("factures/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 30 * 1000,
  })

  if (isDevMode) {
    return {
      data: [] as ApiInvoice[],
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
 * Create invoice mutation.
 */
export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiInvoice>("factures/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  })
}
