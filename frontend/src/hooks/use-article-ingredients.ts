import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
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
        }
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
  return useMutationWithDefaults({
    mutationFn: (data: {
      articleId: number
      ingredientId: number
      quantite: number
    }) => apiPost<ApiArticleIngredient>("article-ingredients/", data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: keys.articleIngredients(variables.articleId),
      }),
  })
}

/**
 * Delete article-ingredient link mutation.
 */
export function useDeleteArticleIngredient() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (variables: { id: number; articleId: number }) =>
      apiDelete(`article-ingredients/${variables.id}/`),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: keys.articleIngredients(variables.articleId),
      }),
  })
}
