import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, beforeEach } from "vitest"
import {
  useStocks,
  useCreateStock,
  useUpdateStock,
  useAdjustStock,
  useDeleteStock,
  useStockAlerts,
} from "@/hooks/use-stocks"
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from "@/hooks/use-ingredients"
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/use-suppliers"
import { setTokens } from "@/api/client"
import type { ReactNode } from "react"

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return {
    wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    },
    qc,
  }
}

// ── Stocks ──

describe("Stock hooks (MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  // ── useStocks ──

  it("fetches stocks and maps to Product domain type", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useStocks(1), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data.length).toBe(3)

    const first = result.current.data[0]
    expect(first).toHaveProperty("id")
    expect(first).toHaveProperty("name")
    expect(first).toHaveProperty("quantity")
    expect(first).toHaveProperty("unit")
    expect(first).toHaveProperty("minStock")
    expect(first).toHaveProperty("maxStock")
    expect(first).toHaveProperty("unitPrice")
    // Verify camelCase mapping worked
    expect(typeof first.id).toBe("string")
    expect(typeof first.name).toBe("string")
    expect(typeof first.quantity).toBe("number")
  })

  it("maps stock names from mock data", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useStocks(1), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const names = result.current.data.map((p) => p.name)
    expect(names).toContain("Tomates")
    expect(names).toContain("Filet de boeuf")
    expect(names).toContain("Chocolat noir 70%")
  })

  it("returns empty array when restaurantId is null", () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useStocks(null), { wrapper })

    // Query should not fire (enabled: false)
    expect(result.current.data).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it("does not fetch without auth token", () => {
    localStorage.clear()
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useStocks(1), { wrapper })

    expect(result.current.data).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  // ── useStockAlerts ──

  it("fetches stock alerts (non-paginated)", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useStockAlerts(1), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Mock has Filet de boeuf with quantity 0 <= threshold 5
    expect(result.current.data!.length).toBeGreaterThanOrEqual(1)
    const alert = result.current.data![0]
    expect(alert).toHaveProperty("ingredientName")
    expect(alert).toHaveProperty("quantityInStock")
    expect(alert).toHaveProperty("alertThreshold")
  })

  // ── useCreateStock ──

  it("creates a stock via POST", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateStock(), { wrapper })

    result.current.mutate({
      restaurantId: 1,
      ingredientId: 10,
      quantityInStock: "20.00",
      alertThreshold: "5.00",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveProperty("id", 100)
  })

  // ── useUpdateStock ──

  it("updates a stock via PATCH", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateStock(), { wrapper })

    result.current.mutate({
      id: 1,
      restaurantId: 1,
      data: { quantityInStock: "50.00" },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  // ── useAdjustStock ──

  it("adjusts stock via POST /adjust/", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAdjustStock(), { wrapper })

    result.current.mutate({
      id: 1,
      restaurantId: 1,
      data: {
        quantity: "5",
        adjustmentType: "ajout",
        reason: "Livraison reçue",
      },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveProperty("message")
    expect(result.current.data).toHaveProperty("stock")
  })

  // ── useDeleteStock ──

  it("deletes a stock via DELETE", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteStock(), { wrapper })

    result.current.mutate({ id: 1, restaurantId: 1 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

// ── Ingredients ──

describe("Ingredient hooks (MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("fetches ingredients with camelized keys", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useIngredients(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data.length).toBe(3)
    const first = result.current.data[0]
    expect(first).toHaveProperty("id")
    expect(first).toHaveProperty("name")
    expect(first).toHaveProperty("unit")
    expect(first).toHaveProperty("unitPrice")
  })

  it("returns empty array without auth token", () => {
    localStorage.clear()
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useIngredients(), { wrapper })

    expect(result.current.data).toEqual([])
  })

  it("creates an ingredient via POST", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateIngredient(), { wrapper })

    result.current.mutate({
      name: "Beurre",
      unit: "kg",
      unitPrice: "12.50",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveProperty("id", 100)
  })

  it("updates an ingredient via PATCH", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateIngredient(), { wrapper })

    result.current.mutate({
      id: 1,
      data: { name: "Tomates cerises" },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("deletes an ingredient via DELETE", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteIngredient(), { wrapper })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

// ── Suppliers ──

describe("Supplier hooks (MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
  })

  it("fetches suppliers and maps to SupplierFull", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useSuppliers(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data.length).toBe(2)

    const first = result.current.data[0]
    // SupplierFull domain type
    expect(first).toHaveProperty("id")
    expect(first).toHaveProperty("name")
    expect(first).toHaveProperty("phone")
    expect(first).toHaveProperty("email")
    expect(first).toHaveProperty("address")
    expect(typeof first.id).toBe("string") // mapped from number
  })

  it("maps supplier address from parts", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useSuppliers(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // "12 rue des Bouchers, 75004, Paris"
    const first = result.current.data[0]
    expect(first.address).toContain("12 rue des Bouchers")
    expect(first.address).toContain("75004")
    expect(first.address).toContain("Paris")
  })

  it("returns empty array without auth token", () => {
    localStorage.clear()
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useSuppliers(), { wrapper })

    expect(result.current.data).toEqual([])
  })

  it("creates a supplier via POST", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateSupplier(), { wrapper })

    result.current.mutate({
      name: "Ferme Bio",
      email: "contact@ferme-bio.fr",
      telephone: "01 23 45 67 89",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveProperty("id", 100)
  })

  it("updates a supplier via PATCH", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateSupplier(), { wrapper })

    result.current.mutate({
      id: 1,
      data: { name: "Boucherie Premium" },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("deletes a supplier via DELETE", async () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteSupplier(), { wrapper })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
