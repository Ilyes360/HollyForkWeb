import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { http, HttpResponse } from "msw"
import { useRevenueByCategory } from "@/hooks/use-revenue-by-category"
import { setTokens } from "@/api/client"
import { server } from "@/test/server"

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockLignesWithArticles = [
  {
    id: 1,
    article: {
      id: 1,
      name: "Entrecôte",
      categorie: { id: 1, name: "Viandes" },
      price: "25.00",
    },
    quantity: 10,
    unit_price: "25.00",
  },
  {
    id: 2,
    article: {
      id: 2,
      name: "Saumon",
      categorie: { id: 2, name: "Poissons" },
      price: "18.00",
    },
    quantity: 5,
    unit_price: "18.00",
  },
  {
    id: 3,
    article: {
      id: 3,
      name: "Côte de bœuf",
      categorie: { id: 1, name: "Viandes" },
      price: "35.00",
    },
    quantity: 3,
    unit_price: "35.00",
  },
]

describe("useRevenueByCategory (API via MSW)", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens("test-token", "test-refresh")

    // Override lignes-commandes handler with nested article data
    server.use(
      http.get("*/api/lignes-commandes/", () => {
        return HttpResponse.json({
          count: mockLignesWithArticles.length,
          next: null,
          previous: null,
          results: mockLignesWithArticles,
        })
      })
    )
  })

  it("aggregates revenue by category", async () => {
    const { result } = renderHook(() => useRevenueByCategory(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Viandes: 10*25 + 3*35 = 355, Poissons: 5*18 = 90
    expect(result.current.data.categories).toHaveLength(2)
    expect(result.current.data.categories[0].label).toBe("Viandes")
    expect(result.current.data.categories[0].value).toBe(355)
    expect(result.current.data.categories[1].label).toBe("Poissons")
    expect(result.current.data.categories[1].value).toBe(90)
  })

  it("calculates total as sum of category revenues", async () => {
    const { result } = renderHook(() => useRevenueByCategory(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data.total).toBe(445)
  })

  it("returns empty revenue when not enabled", () => {
    const { result } = renderHook(() => useRevenueByCategory(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.data.categories).toHaveLength(0)
    expect(result.current.data.total).toBe(0)
  })

  it("returns default tendance (placeholder)", async () => {
    const { result } = renderHook(() => useRevenueByCategory(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data.tendance).toHaveLength(6)
    expect(result.current.data.tendance[0].day).toBe("Lun")
  })
})
