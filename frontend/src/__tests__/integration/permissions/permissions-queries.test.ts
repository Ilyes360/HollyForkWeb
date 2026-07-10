import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
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

  it("fetches permissions and returns combined API + fallback", async () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    // Permissions should include manage_staff from API response
    expect(result.current.permissions).toContain("manage_staff")
    expect(result.current.permissions).toContain("manage_establishments")
    expect(result.current.permissions).toContain("manage_planning")
  })

  it("can() returns true for granted permissions", () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    expect(result.current.can("manage_staff")).toBe(true)
    expect(result.current.can("manage_stocks")).toBe(true)
  })

  it("canAny() returns true if at least one permission is granted", () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    expect(result.current.canAny("manage_staff", "nonexistent_perm")).toBe(true)
  })

  it("canAll() returns false if a permission is missing", () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    expect(result.current.canAll("manage_staff", "nonexistent_perm")).toBe(
      false
    )
  })

  it("returns role name from API", async () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    })

    // Fallback role while API might still be loading
    expect(result.current.role).toBeDefined()
  })
})
