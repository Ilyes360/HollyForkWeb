import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
} from "@/hooks/use-planning"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Planning queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  describe("useShifts", () => {
    it("fetches shifts from API and maps to front Shift type", async () => {
      const { result } = renderHook(() => useShifts(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toHaveLength(3)

      // Verify mapping: API shift -> front Shift
      const first = result.current.data[0]
      expect(first.id).toBe("1")
      expect(first.employeeId).toBe("1")
      expect(first.startTime).toBe("10:00")
      expect(first.endTime).toBe("15:00")
      expect(first.isFullDay).toBe(false)

      // Second shift is soir
      const second = result.current.data[1]
      expect(second.service).toBe("soir") // 18:00 start
      expect(second.employeeId).toBe("2")
    })

    it("fetches shifts with week parameter", async () => {
      const { result } = renderHook(() => useShifts(1, "2026-W20"), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data).toHaveLength(3)
    })

    it("maps typeShift to service correctly (MORNING→midi, EVENING→soir)", async () => {
      const { result } = renderHook(() => useShifts(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // First shift: type_shift=MORNING → midi
      expect(result.current.data[0].service).toBe("midi")
      // Second shift: type_shift=EVENING → soir
      expect(result.current.data[1].service).toBe("soir")
      // Third shift: type_shift=MORNING → midi
      expect(result.current.data[2].service).toBe("midi")
    })

    it("maps isFullDay based on shift duration (5h→false)", async () => {
      const { result } = renderHook(() => useShifts(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // All mock shifts are 5-6h → isFullDay: false
      for (const shift of result.current.data) {
        expect(shift.isFullDay).toBe(false)
      }
    })

    it("fetches employees via restaurant-employes cross-reference", async () => {
      const { result } = renderHook(() => useShifts(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Employees come from cross-referencing restaurant-employes with employes
      expect(result.current.employees).toHaveLength(2)

      const lucas = result.current.employees[0]
      expect(lucas.id).toBe("1")
      expect(lucas.firstName).toBe("Lucas")
      expect(lucas.lastName).toBe("Martin")
      expect(lucas.role).toBe("Chef de rang")
      expect(lucas.department).toBe("salle")
      expect(lucas.avatarColor).toBeTruthy()
    })

    it("is disabled when restaurantId is null", async () => {
      const { result } = renderHook(() => useShifts(null), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data).toHaveLength(0)
      expect(result.current.employees).toHaveLength(0)
    })
  })

  describe("useCreateShift", () => {
    it("posts a new shift to the API and returns created data", async () => {
      const { result } = renderHook(() => useCreateShift(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        employeId: 1,
        restaurantId: 1,
        startDate: "2026-05-13T10:00:00",
        endDate: "2026-05-13T15:00:00",
        typeShift: "MORNING",
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 100 })
    })
  })

  describe("useUpdateShift", () => {
    it("updates a shift via PUT", async () => {
      const { result } = renderHook(() => useUpdateShift(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        id: 1,
        data: {
          employeId: 1,
          restaurantId: 1,
          startDate: "2026-05-13T11:00:00",
          endDate: "2026-05-13T16:00:00",
          typeShift: "MORNING",
        },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 1 })
    })
  })

  describe("useDeleteShift", () => {
    it("deletes a shift via the API with restaurantId", async () => {
      const { result } = renderHook(() => useDeleteShift(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 1, restaurantId: 1 })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })
})
