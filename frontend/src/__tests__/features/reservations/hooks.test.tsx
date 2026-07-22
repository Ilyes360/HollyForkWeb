import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, beforeEach } from "vitest"
import {
  useReservations,
  useCreateReservation,
  useUpdateReservation,
  useDeleteReservation,
} from "@/hooks/use-reservations"
import { setTokens } from "@/api/client"
import type { ReactNode } from "react"

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return {
    wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    },
    qc,
  }
}

describe("Reservation hooks (typed MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  // ── useReservations ──

  it("fetches all reservations for a restaurant", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useReservations(1), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data.length).toBeGreaterThan(0)
    expect(result.current.data[0]).toHaveProperty("clientName")
    expect(result.current.data[0]).toHaveProperty("datetime")
  })

  it("filters reservations by date", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useReservations(1, "2026-05-05"), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // All returned reservations should match the date
    for (const r of result.current.data) {
      expect(r.datetime).toContain("2026-05-05")
    }
  })

  it("returns empty array when no reservations match date", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useReservations(1, "2099-01-01"), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(0)
  })

  // ── useCreateReservation ──

  it("creates a reservation via POST", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateReservation(), { wrapper })

    result.current.mutate({
      clientName: "Test Client",
      partySize: 3,
      datetime: "2026-07-21T19:00:00",
      phoneNumber: "+33600000000",
      salleId: 1,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveProperty("id", 100)
  })

  // ── useUpdateReservation ──

  it("updates a reservation via PATCH", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateReservation(), { wrapper })

    result.current.mutate({
      id: 1,
      data: { noteServeur: "Table près de la fenêtre" },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  // ── useDeleteReservation ──

  it("deletes a reservation via DELETE", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteReservation(), { wrapper })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
