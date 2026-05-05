import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useSettings, usePaymentMethods, useNotes } from "@/hooks/use-settings"
import { setTokens } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"

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
    useDevModeStore.setState({ isDevMode: false })
    setTokens("test-token", "test-refresh")
  })

  it("fetches settings from API", async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.source).toBe("api")
    expect(result.current.data).not.toBeNull()
    expect(result.current.data!.nomRestaurant).toBe("Holly Fork — Marais")
    expect(result.current.data!.telephone).toBe("+33 1 42 72 00 00")
  })

  it("fetches payment methods", async () => {
    const { result } = renderHook(() => usePaymentMethods(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(4)
    expect(result.current.data[0].nom).toBe("Carte bancaire")
  })

  it("fetches notes", async () => {
    const { result } = renderHook(() => useNotes(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data[0].contenu).toBe("Vérifier livraison lundi")
  })
})

describe("Settings queries (dev mode)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: true })
  })

  it("returns null in dev mode (settings managed by admin store)", () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    })

    expect(result.current.source).toBe("mock")
    expect(result.current.isLoading).toBe(false)
  })
})
