import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import { apiGet, apiPost, getAccessToken } from "@/api/client"
import type { PaginatedResponse } from "@/api/types"

export type ApiInvoice = {
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
  lignes: {
    description: string
    quantite: number
    prixUnitaire: number
    tvaRate: number
  }[]
}

const keys = {
  invoices: (restaurantId?: number) => ["invoices", restaurantId] as const,
}

/**
 * Fetch invoices for a restaurant.
 */
export function useInvoices(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.invoices(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiInvoice>>("factures/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
  }
}

/**
 * Create invoice mutation.
 */
export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (data: {
      commandeId: number
      restaurantId: number
      dateFacture?: string
      dateEcheance?: string
      lignes?: {
        description: string
        quantite: number
        prixUnitaire: number
        tvaRate: number
      }[]
    }) => apiPost<ApiInvoice>("factures/", data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: keys.invoices(variables.restaurantId) }),
  })
}
