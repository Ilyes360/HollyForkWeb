import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useStocks } from "@/hooks/use-stocks"
import { setTokens } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Stock queries (user mode — API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
    setTokens("test-token", "test-refresh")
  })

  it("fetches stocks and maps to Product type", async () => {
    const { result } = renderHook(
      () => useStocks(1),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.source).toBe("api")
    expect(result.current.data).toHaveLength(3)
    // Hook maps ApiStock → Product (flat object)
    const first = result.current.data[0]
    expect(first.name).toBe("Tomates")
    expect(first.quantity).toBe(12)
    expect(first.unit).toBe("kg")
  })
})

describe("Stock queries (dev mode)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: true })
  })

  it("returns mock products", () => {
    const { result } = renderHook(
      () => useStocks(1),
      { wrapper: createWrapper() },
    )

    expect(result.current.source).toBe("mock")
    expect(result.current.data.length).toBeGreaterThan(0)
  })
})
