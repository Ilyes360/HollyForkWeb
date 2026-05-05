import { describe, it, expect, beforeEach } from "vitest"
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from "@/api/client"

describe("Token management", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("stores access and refresh tokens", () => {
    setTokens("my-access", "my-refresh")
    expect(getAccessToken()).toBe("my-access")
    expect(getRefreshToken()).toBe("my-refresh")
  })

  it("clears all tokens", () => {
    setTokens("my-access", "my-refresh")
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})

describe("Auth store", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("sets user and marks as authenticated", async () => {
    const { useAuthStore } = await import("@/stores/auth-store")

    const store = useAuthStore.getState()
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()

    store.setUser({
      id: 1,
      username: "test",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      employeeId: null,
      employeeName: null,
      employeeType: null,
      employeeTypeId: null,
      restaurantId: null,
      restaurantName: null,
    })

    const updated = useAuthStore.getState()
    expect(updated.isAuthenticated).toBe(true)
    expect(updated.user?.email).toBe("test@example.com")
  })

  it("clears user and marks as unauthenticated", async () => {
    const { useAuthStore } = await import("@/stores/auth-store")

    useAuthStore.getState().setUser({
      id: 1,
      username: "test",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      employeeId: null,
      employeeName: null,
      employeeType: null,
      employeeTypeId: null,
      restaurantId: null,
      restaurantName: null,
    })

    useAuthStore.getState().clearUser()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })
})
