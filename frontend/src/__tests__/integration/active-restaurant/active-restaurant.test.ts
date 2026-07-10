import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor, act } from "@testing-library/react"
import { createElement } from "react"
import {
  useActiveRestaurant,
  useActiveRestaurantStore,
} from "@/hooks/use-active-restaurant"
import { useAuthStore } from "@/stores/auth-store"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("useActiveRestaurant (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
    useActiveRestaurantStore.setState({ selectedId: null })
    useAuthStore.setState({
      user: {
        id: 1,
        username: "test",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        employeeId: null,
        employeeName: null,
        employeeType: null,
        employeeTypeId: null,
        restaurantId: 1,
        restaurantName: "Holy Fork — Marais",
      },
      isAuthenticated: true,
    })
  })

  it("defaults to user.restaurantId when no selection", async () => {
    const { result } = renderHook(() => useActiveRestaurant(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Should default to user's restaurant (id: 1)
    expect(result.current.restaurantId).toBe(1)
  })

  it("fetches restaurant list from API", async () => {
    const { result } = renderHook(() => useActiveRestaurant(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.restaurants).toHaveLength(2)
  })

  it("setRestaurantId changes the active restaurant", async () => {
    const { result } = renderHook(() => useActiveRestaurant(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setRestaurantId(2)
    })

    expect(result.current.restaurantId).toBe(2)
  })

  it("falls back to first restaurant if selectedId is invalid", async () => {
    useActiveRestaurantStore.setState({ selectedId: 999 })
    useAuthStore.setState({
      user: {
        id: 1,
        username: "test",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        employeeId: null,
        employeeName: null,
        employeeType: null,
        employeeTypeId: null,
        restaurantId: null,
        restaurantName: null,
      },
      isAuthenticated: true,
    })

    const { result } = renderHook(() => useActiveRestaurant(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // 999 is not in the restaurant list, user has no restaurantId → falls back to first
    expect(result.current.restaurantId).toBe(1)
  })
})
