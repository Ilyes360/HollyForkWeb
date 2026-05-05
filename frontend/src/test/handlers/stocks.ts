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
