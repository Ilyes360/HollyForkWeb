import { http, HttpResponse } from "msw"
import { mockStocks, mockReapprovisionnements } from "../mocks/stocks"

const API = "*/api"

export const stockHandlers = [
  // Stocks list
  http.get(`${API}/stocks/`, () => {
    return HttpResponse.json({
      count: mockStocks.length,
      next: null,
      previous: null,
      results: mockStocks,
    })
  }),

  // Stock alerts (custom endpoint — NOT paginated)
  http.get(`${API}/stocks/alerts/`, ({ request }) => {
    const url = new URL(request.url)
    const restaurantId = url.searchParams.get("restaurant_id")
    const alerts = mockStocks
      .filter(
        (s) => parseFloat(s.quantity_in_stock) <= parseFloat(s.alert_threshold)
      )
      .map((s) => ({
        stock_id: s.id,
        ingredient_name: s.ingredient_name,
        quantity_in_stock: parseFloat(s.quantity_in_stock),
        alert_threshold: parseFloat(s.alert_threshold),
        unit: s.ingredient_unit,
        restaurant_name: "Test Restaurant",
      }))
    return HttpResponse.json({
      restaurant_id: restaurantId,
      alerts_count: alerts.length,
      alerts,
    })
  }),

  // Create stock
  http.post(`${API}/stocks/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update stock (full)
  http.put(`${API}/stocks/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Update stock (partial)
  http.patch(`${API}/stocks/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const stock = mockStocks.find((s) => s.id === Number(params.id))
    return HttpResponse.json({ ...stock, ...body, id: Number(params.id) })
  }),

  // Adjust stock — returns { message, stock } per swagger StockAdjustResponse
  http.post(`${API}/stocks/:id/adjust/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const stock = mockStocks.find((s) => s.id === Number(params.id))
    return HttpResponse.json({
      message: "Stock ajusté avec succès",
      stock: { ...stock, ...body, id: Number(params.id) },
    })
  }),

  // Delete stock
  http.delete(`${API}/stocks/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Reapprovisionnements list
  http.get(`${API}/reapprovisionnements/`, () => {
    return HttpResponse.json({
      count: mockReapprovisionnements.length,
      next: null,
      previous: null,
      results: mockReapprovisionnements,
    })
  }),

  // Create reapprovisionnement
  http.post(`${API}/reapprovisionnements/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),
]
