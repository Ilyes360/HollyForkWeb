import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useReservations, useSalles, useTables } from "@/hooks/use-reservations"
import { setTokens } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Reservation queries (user mode — API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
    setTokens("test-token", "test-refresh")
  })

  it("fetches reservations with camelized keys", async () => {
    const { result } = renderHook(
      () => useReservations(1, "2026-05-05"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.source).toBe("api")
    expect(result.current.data).toHaveLength(3)
    const first = result.current.data[0] as Record<string, unknown>
    expect(first.clientName).toBe("Martin Dupont")
    expect(first.tableNumber).toBe(3)
    expect(first.restaurantId).toBe(1)
  })

  it("fetches salles from API", async () => {
    const { result } = renderHook(
      () => useSalles(1),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data[0].nom).toBe("Salle principale")
    expect(result.current.data[0].restaurantId).toBe(1)
  })

  it("fetches tables from API", async () => {
    const { result } = renderHook(
      () => useTables(1),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(7)
    expect(result.current.data[0].label).toBe("T1")
    expect((result.current.data[0] as any).places).toBe(4)
  })
})

describe("Reservation queries (dev mode)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: true })
  })

  it("returns mock reservations", () => {
    const { result } = renderHook(
      () => useReservations(1),
      { wrapper: createWrapper() },
    )

    expect(result.current.source).toBe("mock")
    expect(result.current.data.length).toBeGreaterThan(0)
  })

  it("returns mock tables", () => {
    const { result } = renderHook(
      () => useTables(1),
      { wrapper: createWrapper() },
    )

    expect(result.current.data.length).toBe(12) // RESTAURANT_TABLES has 12
  })
})
