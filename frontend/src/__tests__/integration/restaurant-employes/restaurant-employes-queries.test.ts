import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useRestaurantEmployees } from "@/hooks/use-restaurant-employees"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Restaurant-employes queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("fetches restaurant employees with camelized keys", async () => {
    const { result } = renderHook(
      () => useRestaurantEmployees(1),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(2)
    // Hook returns flat ApiRestaurantEmployee (id, restaurantId, employeId)
    const first = result.current.data[0] as Record<string, unknown>
    expect(first.employeId).toBe(1)
    expect(first.restaurantId).toBe(1)
  })
})
