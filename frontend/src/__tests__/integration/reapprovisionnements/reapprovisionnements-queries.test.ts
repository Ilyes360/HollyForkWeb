import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useReapprovisionnements } from "@/hooks/use-reapprovisionnements"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Reapprovisionnements queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("fetches reapprovisionnements with camelized keys", async () => {
    const { result } = renderHook(
      () => useReapprovisionnements(1),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(2)
    const first = result.current.data[0] as Record<string, unknown>
    expect(first.stockId).toBe(2)
    expect(first.quantite).toBe(10)
    expect(first.fournisseurId).toBe(1)
  })
})
