import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import {
  useStocks,
  useCreateStock,
  useUpdateStock,
  useDeleteStock,
  useAdjustStock,
  useStockAlerts,
} from "@/hooks/use-stocks"
import { setTokens } from "@/api/client"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Stock queries (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  describe("useStocks", () => {
    it("fetches stocks and maps to Product type", async () => {
      const { result } = renderHook(() => useStocks(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toHaveLength(3)
      const first = result.current.data[0]
      expect(first.name).toBe("Tomates")
      expect(first.quantity).toBe(12)
      expect(first.unit).toBe("kg")
      expect(first.id).toBe("1")
    })

    it("maps all stock fields correctly", async () => {
      const { result } = renderHook(() => useStocks(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const first = result.current.data[0]
      expect(first.id).toBe("1")
      expect(first.name).toBe("Tomates")
      expect(first.quantity).toBe(12)
      expect(first.minStock).toBe(5)
      expect(first.maxStock).toBe(15) // minStock * 3
      expect(first.unitPrice).toBe(3.8)
      expect(first.storageZone).toBe("reserve_seche")
    })

    it("computes minStock and unitPrice from API decimals", async () => {
      const { result } = renderHook(() => useStocks(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      const first = result.current.data[0]
      expect(first.minStock).toBe(5)
      expect(first.unitPrice).toBe(3.8)
    })

    it("is disabled when restaurantId is null", async () => {
      const { result } = renderHook(() => useStocks(null), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.data).toHaveLength(0)
    })
  })

  describe("useCreateStock", () => {
    it("posts a new stock entry", async () => {
      const { result } = renderHook(() => useCreateStock(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        restaurantId: 1,
        ingredientId: 5,
        quantityInStock: "10.0",
        alertThreshold: "2.0",
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 100 })
    })
  })

  describe("useUpdateStock", () => {
    it("patches a stock entry via PATCH", async () => {
      const { result } = renderHook(() => useUpdateStock(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        id: 1,
        restaurantId: 1,
        data: { quantityInStock: "20.0", alertThreshold: "3.0" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 1 })
    })
  })

  describe("useDeleteStock", () => {
    it("deletes a stock entry with restaurantId", async () => {
      const { result } = renderHook(() => useDeleteStock(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 1, restaurantId: 1 })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe("useAdjustStock", () => {
    it("adjusts stock with ajout type and string quantity", async () => {
      const { result } = renderHook(() => useAdjustStock(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        id: 1,
        restaurantId: 1,
        data: { quantity: "5.5", adjustmentType: "ajout", reason: "Livraison" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })

    it("adjusts stock with retrait type", async () => {
      const { result } = renderHook(() => useAdjustStock(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        id: 2,
        restaurantId: 1,
        data: { quantity: "3.0", adjustmentType: "retrait" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe("useStockAlerts", () => {
    it("fetches alerts with correct response shape", async () => {
      const { result } = renderHook(() => useStockAlerts(1), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Only stocks where quantity <= threshold (Filet de boeuf: 0 <= 5)
      const alerts = result.current.data!
      expect(alerts.length).toBeGreaterThanOrEqual(1)
      expect(alerts[0]).toHaveProperty("stockId")
      expect(alerts[0]).toHaveProperty("ingredientName")
      expect(alerts[0]).toHaveProperty("quantityInStock")
      expect(alerts[0]).toHaveProperty("alertThreshold")
      expect(alerts[0]).toHaveProperty("unit")
    })

    it("is disabled when restaurantId is null", async () => {
      const { result } = renderHook(() => useStockAlerts(null), {
        wrapper: createWrapper(),
      })

      // Query should not fire
      expect(result.current.fetchStatus).toBe("idle")
    })
  })
})
