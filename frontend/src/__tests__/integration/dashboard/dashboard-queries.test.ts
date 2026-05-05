import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { useDashboardKpis, useDashboardMap } from "@/api/dashboard/queries"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Dashboard queries", () => {
  beforeEach(() => {
    setTokens("test-token", "test-refresh")
  })

  describe("useDashboardKpis", () => {
    it("fetches KPIs for a restaurant", async () => {
      const { result } = renderHook(
        () => useDashboardKpis({ restaurantId: 1, date: "2026-05-05" }),
        { wrapper: createWrapper() },
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const data = result.current.data!
      expect(data.restaurantId).toBe(1)
      expect(data.restaurantName).toBe("Holly Fork — Marais")
      expect(data.kpis.dailyRevenue).toBe(4250.5)
      expect(data.kpis.occupancyRate).toBe(78.5)
      expect(data.kpis.covers).toBe(142)
      expect(data.kpis.foodCost).toBe(31.2)
      expect(data.kpis.satisfaction).toBe(4.6)
    })

    it("is disabled when params is null", () => {
      const { result } = renderHook(() => useDashboardKpis(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.fetchStatus).toBe("idle")
    })

    it("is disabled when restaurantId is 0", () => {
      const { result } = renderHook(
        () => useDashboardKpis({ restaurantId: 0 }),
        { wrapper: createWrapper() },
      )

      expect(result.current.fetchStatus).toBe("idle")
    })
  })

  describe("useDashboardMap", () => {
    it("fetches map data with camelized keys", async () => {
      const { result } = renderHook(() => useDashboardMap({ restaurantId: 1 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const data = result.current.data!
      expect(data.restaurants).toHaveLength(2)
      expect(data.restaurants[0].restaurantId).toBe(1)
      expect(data.restaurants[0].name).toBe("Holly Fork — Marais")
      expect(data.restaurants[1].restaurantId).toBe(2)
    })
  })
})
