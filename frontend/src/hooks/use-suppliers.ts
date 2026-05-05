import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useInventoryStore } from "@/stores/inventory-store"
import type { PaginatedResponse } from "@/api/types"

type ApiSupplier = {
  id: number
  nom: string
  telephone: string
  email: string
  joursLivraison: string[]
}

const keys = {
  suppliers: () => ["suppliers"] as const,
}

/**
 * Fetch suppliers list.
 * Dev mode: returns from inventory store. User mode: fetches from API.
 */
export function useSuppliers() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()
  const storeSuppliers = useInventoryStore((s) => s.suppliers)

  const query = useQuery({
    queryKey: keys.suppliers(),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiSupplier>>("suppliers/")
      return res.results
    },
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return {
      data: storeSuppliers,
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
