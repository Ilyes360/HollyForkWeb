import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { useEmployees, useEmployeeTypes } from "@/hooks/use-employees"
import { useRoles } from "@/hooks/use-roles"
import { useEstablishments } from "@/hooks/use-establishments"
import { setTokens } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Admin queries (user mode — API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: false })
    setTokens("test-token", "test-refresh")
  })

  describe("useEmployees", () => {
    it("fetches employees from API with camelized keys", async () => {
      const { result } = renderHook(() => useEmployees(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.source).toBe("api")
      expect(result.current.data).toHaveLength(3)
      // Verify camelization: type_employe_id → typeEmployeId
      const first = result.current.data[0] as Record<string, unknown>
      expect(first.typeEmployeId).toBe(1)
      expect(first.prenom).toBe("Lucas")
    })
  })

  describe("useEmployeeTypes", () => {
    it("fetches employee types from API", async () => {
      const { result } = renderHook(() => useEmployeeTypes(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toHaveLength(5)
      expect(result.current.data[0].nom).toBe("Chef de rang")
    })
  })

  describe("useEstablishments", () => {
    it("fetches restaurants from API", async () => {
      const { result } = renderHook(() => useEstablishments(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.source).toBe("api")
      expect(result.current.data).toHaveLength(2)
    })
  })

  describe("useRoles", () => {
    it("fetches roles from API", async () => {
      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.source).toBe("api")
      expect(result.current.data).toHaveLength(4)
      const gerant = result.current.data[0] as Record<string, unknown>
      expect(gerant.name).toBe("gerant")
    })
  })
})

describe("Admin queries (dev mode — mock store)", () => {
  beforeEach(() => {
    localStorage.clear()
    useDevModeStore.setState({ isDevMode: true })
  })

  describe("useEmployees", () => {
    it("returns mock data from store", () => {
      const { result } = renderHook(() => useEmployees(), {
        wrapper: createWrapper(),
      })

      expect(result.current.source).toBe("mock")
      expect(result.current.isLoading).toBe(false)
      // Store has mock employees from admin-mock-data.ts
      expect(result.current.data.length).toBeGreaterThan(0)
    })
  })

  describe("useEstablishments", () => {
    it("returns mock data from store", () => {
      const { result } = renderHook(() => useEstablishments(), {
        wrapper: createWrapper(),
      })

      expect(result.current.source).toBe("mock")
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data.length).toBeGreaterThan(0)
    })
  })

  describe("useRoles", () => {
    it("returns mock data from store", () => {
      const { result } = renderHook(() => useRoles(), {
        wrapper: createWrapper(),
      })

      expect(result.current.source).toBe("mock")
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data.length).toBeGreaterThan(0)
    })
  })
})
