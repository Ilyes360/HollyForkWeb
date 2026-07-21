import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, beforeEach } from "vitest"
import { useDeviceLogin, useQuickLogin } from "@/api/auth/mutations"
import { useRestaurantEmployees } from "@/api/auth/queries"
import {
  getDeviceToken,
  getAccessToken,
  clearTokens,
  clearDeviceToken,
  isDeviceSession,
} from "@/api/client"
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

describe("Device Login hooks (typed MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // ── useDeviceLogin ──

  it("stores device token on successful device login", async () => {
    const { result } = renderHook(() => useDeviceLogin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ restaurantId: 1, pinRestaurant: "123456" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getDeviceToken()).toBe("mock-device-token-abc123")
    expect(result.current.data!.restaurantName).toBe("Les Ombres et Bar")
  })

  it("returns 400 on invalid restaurant", async () => {
    const { result } = renderHook(() => useDeviceLogin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ restaurantId: 999, pinRestaurant: "000000" })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(getDeviceToken()).toBeNull()
  })

  // ── useRestaurantEmployees ──

  it("fetches employee list with valid device token", async () => {
    const { result } = renderHook(
      () => useRestaurantEmployees("mock-device-token-abc123"),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.employees).toHaveLength(2)
    expect(result.current.data!.restaurantName).toBe("Les Ombres et Bar")
  })

  it("returns empty list for restaurant with no employees", async () => {
    const { result } = renderHook(
      () => useRestaurantEmployees("empty-restaurant"),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.employees).toHaveLength(0)
    expect(result.current.data!.total).toBe(0)
  })

  it("is disabled when device token is null", () => {
    const { result } = renderHook(() => useRestaurantEmployees(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe("idle")
  })

  // ── useQuickLogin ──

  it("stores JWT tokens and marks device session on quick login", async () => {
    const { result } = renderHook(() => useQuickLogin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      deviceToken: "mock-device-token-abc123",
      pinCode: "1234",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getAccessToken()).toBeTruthy()
    expect(isDeviceSession()).toBe(true)
    expect(result.current.data!.employeeName).toBe("Jean Dupont")
  })

  it("returns error on wrong PIN and stores no tokens", async () => {
    clearTokens()
    clearDeviceToken()

    const { result } = renderHook(() => useQuickLogin(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      deviceToken: "mock-device-token-abc123",
      pinCode: "0000",
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(getAccessToken()).toBeNull()
  })
})
