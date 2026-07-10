import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import {
  useReservations,
  useCreateReservation,
  useUpdateReservation,
  useDeleteReservation,
  useSalles,
  useTables,
} from "@/hooks/use-reservations"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Reservation queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  // ── Queries ──

  it("fetches reservations and maps camelized keys from backend schema", async () => {
    const { result } = renderHook(() => useReservations(1, "2026-05-05"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(3)
    const first = result.current.data[0]
    // Backend returns client_name → camelized to clientName
    expect(first.clientName).toBe("Martin Dupont")
    // Backend returns party_size → camelized to partySize
    expect(first.partySize).toBe(2)
    // Backend returns datetime as ISO string
    expect(first.datetime).toBe("2026-05-05T12:00:00")
    // Backend returns phone_number → camelized to phoneNumber
    expect(first.phoneNumber).toBe("06 12 34 56 78")
    // Backend returns table_id → camelized to tableId
    expect(first.tableId).toBe(12)
    // Backend returns salle_id → camelized to salleId
    expect(first.salleId).toBe(1)
  })

  it("filters reservations by date (datetime prefix match)", async () => {
    const { result } = renderHook(() => useReservations(1, "2026-05-06"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Only 1 reservation on 2026-05-06
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data[0].clientName).toBe("Claire Bernard")
  })

  it("returns all reservations when no date filter", async () => {
    const { result } = renderHook(() => useReservations(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // All 4 reservations
    expect(result.current.data).toHaveLength(4)
  })

  it("returns empty array when disabled (no restaurantId)", () => {
    const { result } = renderHook(() => useReservations(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.data).toHaveLength(0)
    expect(result.current.isLoading).toBe(false)
  })

  it("fetches salles from API", async () => {
    const { result } = renderHook(() => useSalles(1), {
      wrapper: createWrapper(),
    })

    // useSalles is enabled when hasToken && !!restaurantId
    // It returns ApiSalle[] with { id, name, restaurantId, capacity }
    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data[0].name).toBe("Salle principale")
  })

  it("fetches tables from API with correct schema", async () => {
    const { result } = renderHook(() => useTables(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    })

    expect(result.current.data).toHaveLength(7)
    expect(result.current.data[0].numero).toBe(1)
    expect(result.current.data[0].capacity).toBe(4)
  })

  // ── Mutations ──

  describe("useCreateReservation", () => {
    it("creates a reservation via POST with correct backend fields", async () => {
      const { result } = renderHook(() => useCreateReservation(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        clientName: "Nouveau Client",
        partySize: 4,
        datetime: "2026-05-10T19:00:00",
        phoneNumber: "06 00 00 00 00",
        salleId: 1,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 100 })
    })
  })

  describe("useUpdateReservation", () => {
    it("updates a reservation via PATCH", async () => {
      const { result } = renderHook(() => useUpdateReservation(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        id: 1,
        data: { noteServeur: "Note mise à jour" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 1 })
    })
  })

  describe("useDeleteReservation", () => {
    it("deletes a reservation via DELETE", async () => {
      const { result } = renderHook(() => useDeleteReservation(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(1)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })
})
