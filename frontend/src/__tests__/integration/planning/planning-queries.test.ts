import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useWeeklySchedule, useShifts } from "@/hooks/use-planning"
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

  describe("useWeeklySchedule", () => {
    it("fetches emploi du temps from API with camelized keys", async () => {
      const { result } = renderHook(
        () => useWeeklySchedule(1, "05/05/2026"),
        { wrapper: createWrapper() },
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.source).toBe("api")
      expect(result.current.data).not.toBeNull()
      expect(result.current.data!.restaurant.nom).toBe("Holly Fork")
      expect(result.current.data!.jours).toHaveLength(6)
      expect(result.current.data!.totalSemaineHeures).toBe(61)
    })

    it("is disabled when restaurantId is null", () => {
      const { result } = renderHook(
        () => useWeeklySchedule(null),
        { wrapper: createWrapper() },
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeNull()
    })
  })

  describe("useShifts", () => {
    it("fetches shifts from API", async () => {
      const { result } = renderHook(
        () => useShifts(1),
        { wrapper: createWrapper() },
      )

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.source).toBe("api")
      expect(result.current.data).toHaveLength(3)
      // Verify camelization: employe_id → employeId
      const first = result.current.data[0] as Record<string, unknown>
      expect(first.employeId).toBe(1)
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
      // initialShifts has 53 entries
      expect(result.current.data.length).toBe(53)
      expect(result.current.employees.length).toBe(10)
    })
  })
})
