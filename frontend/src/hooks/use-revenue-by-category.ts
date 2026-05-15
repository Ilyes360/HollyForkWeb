import { useQuery } from "@tanstack/react-query"
import { apiGet, getAccessToken } from "@/api/client"
import type { PaginatedResponse } from "@/api/types"

type ApiLigneCommande = {
  id: number
  article: {
    id: number
    name: string
    categorie: {
      id: number
      name: string
    }
    price: string
  }
  quantity: number
  unitPrice: string
}

type CategoryRevenue = {
  label: string
  value: number
}

type RevenueByCategory = {
  categories: CategoryRevenue[]
  tendance: { day: string; ca: number }[]
  total: number
  changePct: number
}

const DEFAULT_TENDANCE = [
  { day: "Lun", ca: 0 },
  { day: "Mar", ca: 0 },
  { day: "Mer", ca: 0 },
  { day: "Jeu", ca: 0 },
  { day: "Ven", ca: 0 },
  { day: "Sam", ca: 0 },
]

const EMPTY_REVENUE: RevenueByCategory = {
  categories: [],
  tendance: DEFAULT_TENDANCE,
  total: 0,
  changePct: 0,
}

async function fetchAllPages<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T[]> {
  const all: T[] = []
  let page = 1
  let hasNext = true

  while (hasNext) {
    const res = await apiGet<PaginatedResponse<T>>(url, { ...params, page })
    all.push(...res.results)
    hasNext = !!res.next
    page++
    if (page > 20) break // safety limit
  }

  return all
}

/**
 * Calculates revenue by category from order lines.
 */
export function useRevenueByCategory(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: ["revenue-by-category", restaurantId],
    queryFn: async (): Promise<RevenueByCategory> => {
      const lignes = await fetchAllPages<ApiLigneCommande>(
        "lignes-commandes/",
        { restaurantId: restaurantId! },
      )

      // Aggregate by category
      const byCategory = new Map<string, number>()
      for (const ligne of lignes) {
        const catName = ligne.article?.categorie?.name ?? "Autre"
        const amount = (ligne.quantity ?? 0) * parseFloat(ligne.unitPrice || ligne.article?.price || "0")
        byCategory.set(catName, (byCategory.get(catName) ?? 0) + amount)
      }

      const categories = Array.from(byCategory.entries())
        .map(([label, value]) => ({ label, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4)

      const total = categories.reduce((sum, c) => sum + c.value, 0)

      return {
        categories,
        tendance: DEFAULT_TENDANCE, // No daily breakdown endpoint
        total,
        changePct: 0, // No comparison endpoint
      }
    },
    enabled: hasToken && !!restaurantId,
    staleTime: 5 * 60 * 1000,
  })

  return { data: query.data ?? EMPTY_REVENUE, isLoading: query.isLoading }
}
