import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import {
  useRestaurantEmployees,
  useAssignEmployee,
  useUnassignEmployee,
} from "@/hooks/use-restaurant-employees"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Restaurant-Employee assignments (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  describe("useRestaurantEmployees", () => {
    it("fetches assignments for a restaurant", async () => {
      const { result } = renderHook(() => useRestaurantEmployees(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data.length).toBeGreaterThanOrEqual(0)
    })

    it("returns empty when restaurantId is null", () => {
      const { result } = renderHook(() => useRestaurantEmployees(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.data).toEqual([])
    })
  })

  describe("useAssignEmployee", () => {
    it("assigns an employee to a restaurant via POST", async () => {
      const { result } = renderHook(() => useAssignEmployee(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        restaurantId: 1,
        employeId: 3,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toMatchObject({
        id: 100,
      })
    })
  })

  describe("useUnassignEmployee", () => {
    it("unassigns an employee via DELETE", async () => {
      const { result } = renderHook(() => useUnassignEmployee(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(1)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })
})
