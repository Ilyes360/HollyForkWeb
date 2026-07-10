import { describe, it, expect, beforeEach, vi } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { http, HttpResponse } from "msw"
import { server } from "@/test/server"
import { setTokens } from "@/api/client"
import {
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/use-suppliers"
import {
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
} from "@/hooks/use-orders"
import {
  useCreateArticle,
  useUpdateArticle,
  useDeleteArticle,
} from "@/hooks/use-articles"
import {
  useUpdateStock,
  useDeleteStock,
  useAdjustStock,
  useCreateStock,
} from "@/hooks/use-stocks"
import { useCreateIngredient } from "@/hooks/use-ingredients"
import { useCreateSalle, useCreateTable } from "@/hooks/use-salles"

// Mock sonner toast for error verification
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

import { toast } from "sonner"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe("Mutation hooks — success cases", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
    vi.clearAllMocks()
  })

  // ── Suppliers ──
  describe("useCreateSupplier", () => {
    it("creates a supplier via POST", async () => {
      const { result } = renderHook(() => useCreateSupplier(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ name: "Test Supplier", telephone: "0102030405" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({
        id: 100,
        name: "Test Supplier",
      })
    })
  })

  describe("useUpdateSupplier", () => {
    it("updates a supplier via PATCH", async () => {
      const { result } = renderHook(() => useUpdateSupplier(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 1, data: { name: "Updated Supplier" } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 1 })
    })
  })

  describe("useDeleteSupplier", () => {
    it("deletes a supplier via DELETE", async () => {
      const { result } = renderHook(() => useDeleteSupplier(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(1)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  // ── Orders ──
  describe("useCreateOrder", () => {
    it("creates an order via POST", async () => {
      const { result } = renderHook(() => useCreateOrder(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        fournisseurId: 1,
        restaurantId: 1,
        notes: "Urgent",
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 100 })
    })
  })

  describe("useUpdateOrder", () => {
    it("updates an order status via PATCH", async () => {
      const { result } = renderHook(() => useUpdateOrder(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 1, data: { status: "DELIVERED" } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 1 })
    })
  })

  describe("useDeleteOrder", () => {
    it("deletes an order via DELETE", async () => {
      const { result } = renderHook(() => useDeleteOrder(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(1)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  // ── Articles ──
  describe("useCreateArticle", () => {
    it("creates an article via POST", async () => {
      const { result } = renderHook(() => useCreateArticle(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ name: "Tiramisu", categorieId: 3, price: "8.50" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 100 })
    })
  })

  describe("useUpdateArticle", () => {
    it("updates an article via PATCH", async () => {
      const { result } = renderHook(() => useUpdateArticle(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 1, data: { price: "12.00" } })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 1 })
    })
  })

  describe("useDeleteArticle", () => {
    it("deletes an article via DELETE", async () => {
      const { result } = renderHook(() => useDeleteArticle(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(1)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  // ── Stocks ──
  describe("useCreateStock", () => {
    it("creates a stock entry via POST", async () => {
      server.use(
        http.post("*/api/stocks/", async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ id: 100, ...body }, { status: 201 })
        })
      )

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
    it("updates stock via PATCH", async () => {
      server.use(
        http.patch("*/api/stocks/:id/", async ({ request, params }) => {
          const body = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ id: Number(params.id), ...body })
        })
      )

      const { result } = renderHook(() => useUpdateStock(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        id: 1,
        restaurantId: 1,
        data: { quantityInStock: "20.0" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe("useDeleteStock", () => {
    it("deletes stock via DELETE", async () => {
      server.use(
        http.delete("*/api/stocks/:id/", () => {
          return new HttpResponse(null, { status: 204 })
        })
      )

      const { result } = renderHook(() => useDeleteStock(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ id: 1, restaurantId: 1 })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  describe("useAdjustStock", () => {
    it("adjusts stock quantity via POST", async () => {
      server.use(
        http.post("*/api/stocks/:id/adjust/", async ({ request, params }) => {
          const body = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ id: Number(params.id), ...body })
        })
      )

      const { result } = renderHook(() => useAdjustStock(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        id: 1,
        restaurantId: 1,
        data: { quantity: "15", adjustmentType: "ajout", reason: "Inventaire" },
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })

  // ── Ingredients ──
  describe("useCreateIngredient", () => {
    it("creates an ingredient via POST", async () => {
      server.use(
        http.post("*/api/ingredients/", async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ id: 100, ...body }, { status: 201 })
        })
      )

      const { result } = renderHook(() => useCreateIngredient(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ name: "Farine", unit: "kg", unitPrice: "1.50" })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 100 })
    })
  })

  // ── Salles & Tables ──
  describe("useCreateSalle", () => {
    it("creates a salle via POST", async () => {
      server.use(
        http.post("*/api/salles/", async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ id: 10, ...body }, { status: 201 })
        })
      )

      const { result } = renderHook(() => useCreateSalle(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        name: "Terrasse",
        restaurantId: 1,
        capacity: 20,
        floor: 0,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 10, name: "Terrasse" })
    })
  })

  describe("useCreateTable", () => {
    it("creates a table via POST", async () => {
      server.use(
        http.post("*/api/tables/", async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({ id: 20, ...body }, { status: 201 })
        })
      )

      const { result } = renderHook(() => useCreateTable(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({
        numero: 1,
        capacity: 4,
        positionX: 100,
        positionY: 200,
        salleId: 10,
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toMatchObject({ id: 20, numero: 1 })
    })
  })
})

describe("Mutation hooks — error handling", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
    vi.clearAllMocks()
  })

  it("shows toast on 400 Bad Request", async () => {
    server.use(
      http.post("*/api/suppliers/", () => {
        return HttpResponse.json(
          { name: ["Ce nom existe déjà"], detail: "Erreur de validation" },
          { status: 400 }
        )
      })
    )

    const { result } = renderHook(() => useCreateSupplier(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ name: "Duplicate" })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it("shows toast on 404 Not Found", async () => {
    server.use(
      http.delete("*/api/suppliers/:id/", () => {
        return HttpResponse.json({ detail: "Non trouvé" }, { status: 404 })
      })
    )

    const { result } = renderHook(() => useDeleteSupplier(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(999)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it("shows toast on 500 Server Error", async () => {
    server.use(
      http.post("*/api/suppliers/orders/", () => {
        return HttpResponse.json(
          { detail: "Internal Server Error" },
          { status: 500 }
        )
      })
    )

    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ fournisseurId: 1, restaurantId: 1 })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it("calls both default and per-call onError (TanStack Query behavior)", async () => {
    server.use(
      http.post("*/api/articles/", () => {
        return HttpResponse.json({ detail: "Erreur" }, { status: 400 })
      })
    )

    const customOnError = vi.fn()
    const { result } = renderHook(() => useCreateArticle(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(
      { name: "Test", categorieId: 1, price: "5.00" },
      { onError: customOnError }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    // TanStack Query calls both hook-level onError AND per-call onError
    expect(customOnError).toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalled()
  })
})

describe("Mutation hooks — cache invalidation", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")
    vi.clearAllMocks()
  })

  it("invalidates suppliers cache after create", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCreateSupplier(), { wrapper })

    result.current.mutate({ name: "New Supplier" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // onSuccess should call invalidateQueries with the suppliers key
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["suppliers"] })
    )
  })

  it("invalidates orders cache after update", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateOrder(), { wrapper })

    result.current.mutate({ id: 1, data: { status: "DELIVERED" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["orders"] })
    )
  })
})
