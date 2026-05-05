import { describe, it, expect, beforeEach } from "vitest"
import {
  useDevModeStore,
  DEV_MOCK_USER,
  applyDevModeTransition,
} from "@/stores/dev-mode-store"
import { useAuthStore } from "@/stores/auth-store"
import { getAccessToken, getRefreshToken } from "@/api/client"

describe("Dev mode store", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it("defaults to false", () => {
    expect(useDevModeStore.getState().isDevMode).toBe(false)
  })

  it("toggle flips isDevMode", () => {
    useDevModeStore.getState().toggle()
    expect(useDevModeStore.getState().isDevMode).toBe(true)
    useDevModeStore.getState().toggle()
    expect(useDevModeStore.getState().isDevMode).toBe(false)
  })
})

describe("applyDevModeTransition", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it("enableDevMode injects mock user and tokens", async () => {
    await applyDevModeTransition(true)

    // Wait for dynamic imports to resolve
    await new Promise((r) => setTimeout(r, 50))

    expect(getAccessToken()).toBe("dev-mock-access-token")
    expect(getRefreshToken()).toBe("dev-mock-refresh-token")
    expect(useAuthStore.getState().user).toEqual(DEV_MOCK_USER)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it("disableDevMode clears tokens and user", async () => {
    // First enable
    await applyDevModeTransition(true)
    await new Promise((r) => setTimeout(r, 50))

    // Then disable
    await applyDevModeTransition(false)
    await new Promise((r) => setTimeout(r, 50))

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
