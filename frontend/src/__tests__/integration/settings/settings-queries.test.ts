import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import {
  useRestaurantSettings,
  usePaymentMethods,
  useNotes,
} from "@/hooks/use-settings"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Settings queries (user mode — API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("fetches restaurant settings from API", async () => {
    const { result } = renderHook(() => useRestaurantSettings(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).not.toBeNull()
    expect(result.current.data!.name).toBe("Holy Fork — Marais")
    expect(result.current.data!.phoneNumber).toBe("+33 1 42 72 00 00")
  })

  it("fetches payment methods", async () => {
    const { result } = renderHook(() => usePaymentMethods(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(4)
    expect(result.current.data[0].name).toBe("Carte bancaire")
  })

  it("fetches notes", async () => {
    const { result } = renderHook(() => useNotes(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data[0].message).toBe("Vérifier livraison lundi")
  })
})

describe("Settings queries (no token)", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns null when no auth token is available", () => {
    const { result } = renderHook(() => useRestaurantSettings(1), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeNull()
  })
})
