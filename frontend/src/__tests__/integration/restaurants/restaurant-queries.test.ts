import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { useRestaurants, useRestaurant } from "@/api/restaurants/queries"
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

describe("Restaurant queries", () => {
  beforeEach(() => {
    setTokens("test-token", "test-refresh")
  })

  describe("useRestaurants", () => {
    it("fetches restaurant list with camelized keys", async () => {
      const { result } = renderHook(() => useRestaurants(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const data = result.current.data!
      expect(data).toHaveLength(2)
      expect(data[0].restaurantId).toBe(1)
      expect(data[0].name).toBe("Holly Fork — Marais")
      expect(data[0].postalCode).toBe("75004")
      expect(data[1].restaurantId).toBe(2)
    })

    it("is disabled when enabled=false", () => {
      const { result } = renderHook(() => useRestaurants(false), {
        wrapper: createWrapper(),
      })

      expect(result.current.fetchStatus).toBe("idle")
    })
  })

  describe("useRestaurant", () => {
    it("fetches a single restaurant detail", async () => {
      const { result } = renderHook(() => useRestaurant(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const data = result.current.data!
      expect(data.restaurantId).toBe(1)
      expect(data.name).toBe("Holly Fork — Marais")
      expect(data.phoneNumber).toBe("01 42 72 00 00")
      expect(data.siret).toBe("12345678901234")
    })

    it("is disabled when id is null", () => {
      const { result } = renderHook(() => useRestaurant(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.fetchStatus).toBe("idle")
    })
  })
})
