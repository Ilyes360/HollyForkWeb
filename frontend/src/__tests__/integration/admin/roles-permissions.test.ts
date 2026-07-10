import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRoles } from "@/hooks/use-roles"
import { apiGet, setTokens, getAccessToken } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

type ApiHierarchy = {
  hierarchy: Array<{
    level: number
    role: string
    permissionsCount: number
  }>
}

type ApiMatrix = {
  matrix: Record<string, string[]>
}

describe("Roles & Permissions queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  describe("useRoles", () => {
    it("fetches roles from staff/permissions/roles/", async () => {
      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toHaveLength(4)
      expect(result.current.data[0]).toMatchObject({
        name: "Gérant",
        hierarchyLevel: 1,
      })
    })
  })

  describe("permissions hierarchy", () => {
    it("fetches role hierarchy sorted by level", async () => {
      const { result } = renderHook(
        () =>
          useQuery({
            queryKey: ["permissions", "hierarchy"],
            queryFn: () => apiGet<ApiHierarchy>("staff/permissions/hierarchy/"),
            enabled: !!getAccessToken(),
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const hierarchy = result.current.data!.hierarchy
      expect(hierarchy).toHaveLength(4)
      expect(hierarchy[0]).toMatchObject({
        role: "Gérant",
        level: 1,
        permissionsCount: 8,
      })
    })
  })

  describe("permissions matrix", () => {
    it("fetches permission matrix with roles and their permissions", async () => {
      const { result } = renderHook(
        () =>
          useQuery({
            queryKey: ["permissions", "matrix"],
            queryFn: () => apiGet<ApiMatrix>("staff/permissions/matrix/"),
            enabled: !!getAccessToken(),
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const matrix = result.current.data!.matrix
      expect(matrix["Gérant"]).toContain("manage_staff")
      expect(matrix["Chef"]).toContain("manage_stocks")
      expect(matrix["Serveur"]).toContain("take_orders")
    })
  })
})
