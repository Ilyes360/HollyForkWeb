import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

type ApiIngredient = {
  id: number
  nom: string
  unite: string
  prixUnitaire: number
}

const keys = {
  ingredients: () => ["ingredients"] as const,
}

/**
 * Fetch ingredients list.
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function useIngredients() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.ingredients(),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiIngredient>>("ingredients/")
      return res.results
    },
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: [] as ApiIngredient[], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}
