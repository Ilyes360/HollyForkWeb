import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useRestaurantsList } from "@/api/generated/endpoints/restaurants/restaurants"
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

describe("Orval-generated hooks (pipeline: orval → kyMutator → ky → MSW → camelizeKeys)", () => {
  beforeEach(() => {
    setTokens("test-token", "test-refresh")
  })

  it("useRestaurantsList fetches and camelizes restaurant data", async () => {
    const { result } = renderHook(() => useRestaurantsList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // kyMutator returns the camelized JSON directly (paginated response)
    const response = result.current.data as unknown as {
      count: number
      results: Array<{ restaurantId: number; name: string; postalCode: string }>
    }
    expect(response.count).toBe(2)
    expect(response.results).toHaveLength(2)
    expect(response.results[0].restaurantId).toBe(1)
    expect(response.results[0].name).toBe("Holy Fork — Marais")
    expect(response.results[0].postalCode).toBe("75004")
    expect(response.results[1].restaurantId).toBe(2)
  })
})
