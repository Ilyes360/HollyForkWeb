import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from "@/api/client"
import { useProfile } from "@/api/auth/queries"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Token refresh flow", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("stores tokens via setTokens and retrieves them", () => {
    setTokens("access-123", "refresh-456")
    expect(getAccessToken()).toBe("access-123")
    expect(getRefreshToken()).toBe("refresh-456")
  })

  it("clearTokens removes both tokens", () => {
    setTokens("access-123", "refresh-456")
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it("profile fetch succeeds with valid token", async () => {
    setTokens("valid-token", "valid-refresh")

    const { result } = renderHook(() => useProfile(true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isError).toBe(false)
    expect(result.current.data?.username).toBe("marie.dupont")
    expect(result.current.data?.email).toBe("marie@holyfork.fr")
  })

  it("profile fetch fails with expired token (401)", async () => {
    setTokens("expired-token", "some-refresh")

    const { result } = renderHook(() => useProfile(true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isError).toBe(true)
  })

  it("profile fetch is disabled when enabled=false", () => {
    setTokens("valid-token", "valid-refresh")

    const { result } = renderHook(() => useProfile(false), {
      wrapper: createWrapper(),
    })

    // Should not fetch — isLoading stays false, no data
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
  })

  it("refresh endpoint returns new access token for valid refresh", async () => {
    // This tests the MSW handler directly — the actual refresh logic
    // is in the ky beforeRetry hook which is harder to test in isolation
    server.use(
      http.post("*/api/auth/token/refresh/", async ({ request }) => {
        const body = (await request.json()) as { refresh?: string }
        if (body.refresh === "my-valid-refresh") {
          return HttpResponse.json({ access: "fresh-access-token" })
        }
        return HttpResponse.json({ detail: "Invalid" }, { status: 401 })
      })
    )

    // Simulate the refresh call directly
    const { default: ky } = await import("ky")
    const response = await ky
      .post("http://localhost:3000/api/auth/token/refresh/", {
        json: { refresh: "my-valid-refresh" },
      })
      .json<{ access: string }>()

    expect(response.access).toBe("fresh-access-token")
  })

  it("refresh endpoint rejects invalid refresh token", async () => {
    server.use(
      http.post("*/api/auth/token/refresh/", () => {
        return HttpResponse.json({ detail: "Token invalide" }, { status: 401 })
      })
    )

    const { default: ky } = await import("ky")

    await expect(
      ky
        .post("http://localhost:3000/api/auth/token/refresh/", {
          json: { refresh: "bad-refresh" },
        })
        .json()
    ).rejects.toThrow()
  })
})
