import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, beforeEach } from "vitest"
import { useLogin } from "@/api/auth/mutations"
import { useProfile } from "@/api/auth/queries"
import { setTokens, getAccessToken, clearTokens } from "@/api/client"
import type { ReactNode } from "react"

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("Auth hooks (typed MSW handlers)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("login happy path — stores tokens and returns user", async () => {
    clearTokens()
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ username: "marie.dupont", password: "pass" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Tokens stored
    expect(getAccessToken()).toBeTruthy()

    // Response has the right shape (camelized)
    const data = result.current.data!
    expect(data.accessToken).toBeTruthy()
    expect(data.username).toBe("marie.dupont")
    expect(data.restaurantName).toBe("Holy Fork — Marais")
  })

  it("login 401 — returns error on bad credentials", async () => {
    clearTokens()
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ username: "bad", password: "wrong" })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // No tokens stored
    expect(getAccessToken()).toBeNull()
  })

  it("profile — fetches user profile with valid token", async () => {
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.username).toBe("marie.dupont")
    expect(data.email).toBe("marie@holyfork.fr")
    expect(data.isActive).toBe(true)
  })
})
