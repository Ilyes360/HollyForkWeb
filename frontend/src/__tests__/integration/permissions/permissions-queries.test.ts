import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { usePermissions } from "@/hooks/use-permissions"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("usePermissions (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("returns empty permissions before API responds", () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    // No fallback — permissions are empty until the API responds
    expect(result.current.permissions).toEqual([])
    expect(result.current.role).toBeNull()
    expect(result.current.can("manage_staff")).toBe(false)
  })

  it("fetches permissions from API", async () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.permissions).toContain("manage_staff")
    expect(result.current.permissions).toContain("manage_establishments")
    expect(result.current.permissions).toContain("manage_planning")
  })

  it("can() returns true for granted permissions after load", async () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.can("manage_staff")).toBe(true)
    expect(result.current.can("manage_stocks")).toBe(true)
  })

  it("canAny() returns true if at least one permission is granted", async () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canAny("manage_staff", "nonexistent_perm")).toBe(true)
  })

  it("canAll() returns false if a permission is missing", async () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.canAll("manage_staff", "nonexistent_perm")).toBe(
      false
    )
  })

  it("returns role name from API after load", async () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.role).toBe("Gérant")
  })
})
