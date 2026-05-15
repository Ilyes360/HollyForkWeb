import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiDelete, getAccessToken } from "@/api/client"
import type { PaginatedResponse } from "@/api/types"

type ApiArticleIngredient = {
  id: number
  articleId: number
  ingredientId: number
  quantite: number
}

const keys = {
  articleIngredients: (articleId?: number) =>
    ["article-ingredients", articleId] as const,
}

/**
 * Fetch article-ingredient links for a given article.
 */
export function useArticleIngredients(articleId: number | null) {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.articleIngredients(articleId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiArticleIngredient>>(
        "article-ingredients/",
        {
          articleId: articleId!,
        },
      )
      return res.results
    },
    enabled: hasToken && !!articleId,
    staleTime: 30 * 1000,
  })

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
  }
}

/**
 * Add article-ingredient link mutation.
 */
export function useAddArticleIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      articleId: number
      ingredientId: number
      quantite: number
    }) => apiPost<ApiArticleIngredient>("article-ingredients/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["article-ingredients"] }),
  })
}

/**
 * Delete article-ingredient link mutation.
 */
export function useDeleteArticleIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete(`article-ingredients/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["article-ingredients"] }),
  })
}
