import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useArticleIngredients } from "@/hooks/use-article-ingredients"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Article-ingredients queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("fetches article ingredients with camelized keys", async () => {
    const { result } = renderHook(() => useArticleIngredients(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(3)
    const first = result.current.data[0] as Record<string, unknown>
    expect(first.articleId).toBe(1)
    expect(first.ingredientId).toBe(1)
    expect(first.requiredQuantity).toBe("0.5")
  })
})
