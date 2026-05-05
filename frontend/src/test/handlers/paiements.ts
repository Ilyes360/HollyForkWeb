import { http, HttpResponse } from "msw"
import { mockPaiements } from "../mocks/paiements"

const API = "*/api"

export const paiementHandlers = [
  // Paiements list
  http.get(`${API}/paiements/`, () => {
    return HttpResponse.json({
      count: mockPaiements.length,
      next: null,
      previous: null,
      results: mockPaiements,
    })
  }),

  // Create paiement
  http.post(`${API}/paiements/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),
]
