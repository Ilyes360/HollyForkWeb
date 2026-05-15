import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useEmployees, useEmployeeTypes } from "@/hooks/use-employees"
import { useRoles } from "@/hooks/use-roles"
import { useEstablishments } from "@/hooks/use-establishments"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Admin queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  describe("useEmployees", () => {
    it("fetches employees from API and maps to Employee type", async () => {
      const { result } = renderHook(() => useEmployees(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toHaveLength(3)
      // Hook maps ApiEmploye → Employee (id is string, firstName/lastName from API)
      const first = result.current.data[0]
      expect(first.id).toBe("1")
      expect(first.firstName).toBe("Lucas")
      expect(first.lastName).toBe("Martin")
    })
  })

  describe("useEmployeeTypes", () => {
    it("fetches employee types from API", async () => {
      const { result } = renderHook(() => useEmployeeTypes(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toHaveLength(5)
      expect(result.current.data[0].typeName).toBe("Chef de rang")
    })
  })

  describe("useEstablishments", () => {
    it("fetches restaurants from API", async () => {
      const { result } = renderHook(() => useEstablishments(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toHaveLength(2)
    })
  })

  describe("useRoles", () => {
    it("fetches roles from API", async () => {
      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toHaveLength(4)
      const gerant = result.current.data[0] as Record<string, unknown>
      expect(gerant.name).toBe("gerant")
    })
  })
})
