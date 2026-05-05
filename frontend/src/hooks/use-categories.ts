import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { PaginatedResponse } from "@/api/types"

type ApiCategory = {
  id: number
  nom: string
  displayOrder: number
  description: string
}

const keys = {
  categories: () => ["categories"] as const,
}

/**
 * Fetch categories list.
 * Dev mode: returns empty array. User mode: fetches from API.
 */
export function useCategories() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.categories(),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiCategory>>("categories/")
      return res.results
    },
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: [] as ApiCategory[], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}
