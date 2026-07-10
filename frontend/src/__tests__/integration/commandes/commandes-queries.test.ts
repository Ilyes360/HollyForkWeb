import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useOrders, useOrdersPendingCount } from "@/hooks/use-orders"
import { useSuppliers } from "@/hooks/use-suppliers"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Commandes queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("fetches orders (paginated) and maps to Order type", async () => {
    const { result } = renderHook(() => useOrders(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(2)
    // Hook maps ApiSupplierOrder → Order (id is string, supplierId, date, status, etc.)
    const first = result.current.data[0]
    expect(first.id).toBe("1")
    expect(first.supplierId).toBe("1")
    expect(first.expectedDelivery).toBe("2026-05-05")
    expect(first.status).toBe("pending") // "SENT" → "pending"
  })

  it("returns pagination metadata", async () => {
    const { result } = renderHook(() => useOrders(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.total).toBe(2)
    expect(result.current.hasNextPage).toBe(false)
    expect(result.current.page).toBe(1)
  })

  it("useOrdersPendingCount returns count", async () => {
    const { result } = renderHook(() => useOrdersPendingCount(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.count).toBeGreaterThanOrEqual(0))
  })

  it("fetches suppliers and maps to SupplierFull type", async () => {
    const { result } = renderHook(() => useSuppliers(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(2)
    // Hook maps ApiSupplier → SupplierFull (id is string, name, phone, etc.)
    const first = result.current.data[0]
    expect(first.name).toBe("Boucherie Moderne")
    expect(first.phone).toBe("01 42 36 78 90")
  })
})
