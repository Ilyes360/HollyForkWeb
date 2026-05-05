import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useArticles } from "@/hooks/use-articles"
import { useCategories } from "@/hooks/use-categories"
import { useIngredients } from "@/hooks/use-ingredients"
import { setTokens } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Carte queries (user mode — API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
    setTokens("test-token", "test-refresh")
  })

  it("fetches articles with camelized keys", async () => {
    const { result } = renderHook(
      () => useArticles(),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.source).toBe("api")
    expect(result.current.data).toHaveLength(3)
    const first = result.current.data[0] as Record<string, unknown>
    expect(first.nom).toBe("Salade de tomates fraîches")
    expect(first.categorieId).toBe(1)
  })

  it("fetches categories from API", async () => {
    const { result } = renderHook(
      () => useCategories(),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(3)
    expect(result.current.data[0].nom).toBe("Entrées")
    expect(result.current.data[0].displayOrder).toBe(1)
  })

  it("fetches ingredients from API", async () => {
    const { result } = renderHook(
      () => useIngredients(),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(3)
    expect(result.current.data[0].nom).toBe("Tomates")
    expect(result.current.data[0].prixUnitaire).toBe(3.8)
  })
})

describe("Carte queries (dev mode)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: true })
  })

  it("returns mock recipes", () => {
    const { result } = renderHook(
      () => useArticles(),
      { wrapper: createWrapper() },
    )

    expect(result.current.source).toBe("mock")
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  it("returns empty categories in dev mode", () => {
    const { result } = renderHook(
      () => useCategories(),
      { wrapper: createWrapper() },
    )

    expect(result.current.data).toHaveLength(0)
  })

  it("returns empty ingredients in dev mode", () => {
    const { result } = renderHook(
      () => useIngredients(),
      { wrapper: createWrapper() },
    )

    expect(result.current.data).toHaveLength(0)
  })
})
