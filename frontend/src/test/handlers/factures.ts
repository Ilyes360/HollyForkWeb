import { http, HttpResponse } from "msw"
import { mockFactures } from "../mocks/factures"

const API = "*/api"

export const factureHandlers = [
  // Factures list
  http.get(`${API}/factures/`, () => {
    return HttpResponse.json({
      count: mockFactures.length,
      next: null,
      previous: null,
      results: mockFactures,
    })
  }),

  // Facture detail
  http.get(`${API}/factures/:id/`, ({ params }) => {
    const id = Number(params.id)
    const facture = mockFactures.find((f) => f.id === id)
    if (!facture) return HttpResponse.json({ detail: "Non trouvé" }, { status: 404 })
    return HttpResponse.json(facture)
  }),

  // Create facture
  http.post(`${API}/factures/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update facture
  http.put(`${API}/factures/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),
]
