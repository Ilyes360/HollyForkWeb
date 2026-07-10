import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import {
  useEstablishments,
  useEstablishment,
  useCreateEstablishment,
  useUpdateEstablishment,
  useDeleteEstablishment,
} from "@/hooks/use-establishments"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Establishment mutations (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  describe("useEstablishments", () => {
    it("fetches restaurants and maps to Establishment type", async () => {
      const { result } = renderHook(() => useEstablishments(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toHaveLength(2)
      const first = result.current.data[0]
      expect(first.id).toBe("1")
      expect(first.name).toBe("Holy Fork — Marais")
      expect(first.siret).toBe("12345678901234")
    })
  })

  describe("useEstablishment", () => {
    it("fetches a single restaurant by id", async () => {
      const { result } = renderHook(() => useEstablishment(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).not.toBeNull()
      expect(result.current.data!.name).toBe("Holy Fork — Marais")
      expect(result.current.raw).not.toBeNull()
      expect(result.current.raw!.pin).toBe("1234")
    })

    it("returns null for disabled query (null id)", () => {
      const { result } = renderHook(() => useEstablishment(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.data).toBeNull()
    })
  })

  describe("useCreateEstablishment", () => {
    it("creates a restaurant via POST and returns ApiRestaurant", async () => {
      const { result } = renderHook(() => useCreateEstablishment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        name: "Holy Fork — Bastille",
        address: "24 rue de la Roquette",
        postalCode: "75011",
        city: "Paris",
        phoneNumber: "01 43 55 00 00",
        siret: "98765432109876",
        pin: "9999",
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toMatchObject({
        restaurantId: 42,
        name: "Holy Fork — Bastille",
      })
    })
  })

  describe("useUpdateEstablishment", () => {
    it("updates a restaurant via PATCH", async () => {
      const { result } = renderHook(() => useUpdateEstablishment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        id: 1,
        data: {
          name: "Holy Fork — Marais Rénové",
          phoneNumber: "01 42 72 99 99",
        },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toMatchObject({
        name: "Holy Fork — Marais Rénové",
      })
    })
  })

  describe("useDeleteEstablishment", () => {
    it("deletes a restaurant via DELETE", async () => {
      const { result } = renderHook(() => useDeleteEstablishment(), {
        wrapper: createWrapper(),
      })

      result.current.mutate("1")

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })
})
