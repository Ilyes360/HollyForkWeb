import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useShifts, useCreateShift, useDeleteShift } from "@/hooks/use-planning"
import { setTokens } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Planning queries (user mode — API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
    setTokens("test-token", "test-refresh")
  })

  describe("useShifts", () => {
    it("fetches shifts from API and maps to front Shift type", async () => {
      const { result } = renderHook(
        () => useShifts(1),
        { wrapper: createWrapper() },
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.source).toBe("api")
      expect(result.current.data).toHaveLength(3)

      // Verify mapping: API shift → front Shift
      const first = result.current.data[0]
      expect(first.id).toBe("1")
      expect(first.employeeId).toBe("1")
      expect(first.day).toBe("lundi") // 2026-05-11 is Monday
      expect(first.service).toBe("midi") // 10:00 start
      expect(first.startTime).toBe("10:00")
      expect(first.endTime).toBe("15:00")
      expect(first.isFullDay).toBe(false)

      // Second shift is soir
      const second = result.current.data[1]
      expect(second.service).toBe("soir") // 18:00 start
      expect(second.employeeId).toBe("2")
    })

    it("fetches employees from restaurant-employes API", async () => {
      const { result } = renderHook(
        () => useShifts(1),
        { wrapper: createWrapper() },
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.employees).toHaveLength(2)

      const lucas = result.current.employees[0]
      expect(lucas.id).toBe("1")
      expect(lucas.firstName).toBe("Lucas")
      expect(lucas.lastName).toBe("Martin")
      expect(lucas.role).toBe("Chef de rang")
      expect(lucas.department).toBe("salle")
      expect(lucas.avatarColor).toBeTruthy()
    })

    it("is disabled when restaurantId is null", () => {
      const { result } = renderHook(
        () => useShifts(null),
        { wrapper: createWrapper() },
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toHaveLength(0)
      expect(result.current.employees).toHaveLength(0)
    })
  })

  describe("useCreateShift", () => {
    it("posts a new shift to the API", async () => {
      const { result } = renderHook(() => useCreateShift(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        employeId: 1,
        restaurantId: 1,
        startDate: "2026-05-13T10:00:00",
        endDate: "2026-05-13T15:00:00",
        shiftType: "MORNING",
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe("useDeleteShift", () => {
    it("deletes a shift via the API", async () => {
      const { result } = renderHook(() => useDeleteShift(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(1)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })
})

describe("Planning queries (dev mode — mock data)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: true })
  })

  describe("useShifts", () => {
    it("returns mock shifts from planning/data.ts", () => {
      const { result } = renderHook(
        () => useShifts(1),
        { wrapper: createWrapper() },
      )

      expect(result.current.source).toBe("mock")
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data.length).toBe(53)
      expect(result.current.employees.length).toBe(10)
    })
  })
})
