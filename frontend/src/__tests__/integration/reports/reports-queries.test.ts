import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useReports } from "@/hooks/use-reports"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Reports queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("fetches reports with camelized keys", async () => {
    const { result } = renderHook(
      () => useReports(1, "monthly"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(1)
    const first = result.current.data[0] as Record<string, unknown>
    expect(first.chiffreAffaires).toBe(45200.0)
    expect(first.nombreCouverts).toBe(1280)
    expect(first.foodCostPct).toBe(28.5)
  })
})
