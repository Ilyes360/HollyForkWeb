import { useQuery } from "@tanstack/react-query"
import { getAccessToken } from "@/api/client"
import { fetchAllPages } from "@/api/pagination"

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

/**
 * Calculates revenue by category from order lines.
 * Uses fetchAllPages with a date filter to keep the dataset bounded.
 */
export function useRevenueByCategory(
  restaurantId: number | null,
  dateFrom?: string,
  dateTo?: string
) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: ["revenue-by-category", restaurantId, dateFrom, dateTo],
    queryFn: async (): Promise<RevenueByCategory> => {
      // Use caller-provided dates, fallback to last 30 days
      const effectiveDateFrom =
        dateFrom ??
        new Date(Date.now() - 30 * 86_400_000).toISOString().split("T")[0]

      const params: Record<string, string | number | boolean> = {
        restaurantId: restaurantId!,
        dateFrom: effectiveDateFrom,
      }
      if (dateTo) params.dateTo = dateTo

      const lignes = await fetchAllPages<ApiLigneCommande>(
        "lignes-commandes/",
        params
      )

      // Aggregate by category
      const byCategory = new Map<string, number>()
      for (const ligne of lignes) {
        const catName = ligne.article?.categorie?.name ?? "Autre"
        const amount =
          (ligne.quantity ?? 0) *
          parseFloat(ligne.unitPrice || ligne.article?.price || "0")
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
