import { http, HttpResponse } from "msw"
import { mockSettings, mockMethodesPaiement, mockNotes } from "../mocks/settings"

const API = "*/api"

export const settingsHandlers = [
  // Settings
  http.get(`${API}/settings/`, () => {
    return HttpResponse.json(mockSettings)
  }),

  http.put(`${API}/settings/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...mockSettings, ...body })
  }),

  // Méthodes de paiement
  http.get(`${API}/methodes-paiement/`, () => {
    return HttpResponse.json({
      count: mockMethodesPaiement.length,
      next: null,
      previous: null,
      results: mockMethodesPaiement,
    })
  }),

  http.post(`${API}/methodes-paiement/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Notes
  http.get(`${API}/notes/`, () => {
    return HttpResponse.json({
      count: mockNotes.length,
      next: null,
      previous: null,
      results: mockNotes,
    })
  }),

  http.post(`${API}/notes/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),
]
