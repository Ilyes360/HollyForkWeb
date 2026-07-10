import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import {
  useEmployees,
  useEmployeeTypes,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/hooks/use-employees"
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

  describe("useCreateEmployee", () => {
    it("creates an employee via POST", async () => {
      const { result } = renderHook(() => useCreateEmployee(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        lastName: "Dupont",
        firstName: "Marie",
        typeEmployeId: 1,
        salary: "2500.00",
        hireDate: "2026-01-15",
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toMatchObject({
        id: 100,
      })
    })
  })

  describe("useUpdateEmployee", () => {
    it("updates an employee via PATCH", async () => {
      const { result } = renderHook(() => useUpdateEmployee(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        id: 1,
        data: { firstName: "Lucas-Updated", salary: "3000.00" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toMatchObject({ id: 1 })
    })
  })

  describe("useDeleteEmployee", () => {
    it("deletes an employee via DELETE", async () => {
      const { result } = renderHook(() => useDeleteEmployee(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(1)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })
})
