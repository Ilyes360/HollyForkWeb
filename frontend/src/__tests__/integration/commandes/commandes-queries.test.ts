import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useOrders } from "@/hooks/use-orders"
import { useSuppliers } from "@/hooks/use-suppliers"
import { setTokens } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Commandes queries (user mode — API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
    setTokens("test-token", "test-refresh")
  })

  it("fetches orders with camelized keys", async () => {
    const { result } = renderHook(
      () => useOrders(1),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.source).toBe("api")
    expect(result.current.data).toHaveLength(2)
    const first = result.current.data[0] as Record<string, unknown>
    expect((first.fournisseur as Record<string, unknown>).id).toBe(1)
    expect((first.restaurant as Record<string, unknown>).restaurantId).toBe(1)
    expect(first.expectedDeliveryDate).toBe("2026-05-05")
  })

  it("fetches suppliers from API", async () => {
    const { result } = renderHook(
      () => useSuppliers(),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.source).toBe("api")
    expect(result.current.data).toHaveLength(2)
    const first = result.current.data[0] as Record<string, unknown>
    expect(first.name).toBe("Boucherie Moderne")
    expect(first.isActive).toBe(true)
  })
})

describe("Commandes queries (dev mode)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: true })
  })

  it("returns orders from inventory store", () => {
    const { result } = renderHook(
      () => useOrders(1),
      { wrapper: createWrapper() },
    )

    expect(result.current.source).toBe("mock")
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  it("returns suppliers from inventory store", () => {
    const { result } = renderHook(
      () => useSuppliers(),
      { wrapper: createWrapper() },
    )

    expect(result.current.source).toBe("mock")
    expect(result.current.data.length).toBeGreaterThan(0)
  })
})
