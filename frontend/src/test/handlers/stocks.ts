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

  // Stock alerts
  http.get(`${API}/stocks/alerts/`, () => {
    const alerts = mockStocks.filter(
      (s) => parseFloat(s.quantity_in_stock) <= parseFloat(s.alert_threshold)
    )
    return HttpResponse.json({
      count: alerts.length,
      next: null,
      previous: null,
      results: alerts,
    })
  }),

  // Create stock
  http.post(`${API}/stocks/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update stock
  http.put(`${API}/stocks/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Adjust stock
  http.post(`${API}/stocks/:id/adjust/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const stock = mockStocks.find((s) => s.id === Number(params.id))
    return HttpResponse.json({ ...stock, ...body, id: Number(params.id) })
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
