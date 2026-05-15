import { http, HttpResponse } from "msw"
import { mockSettings, mockMethodesPaiement, mockNotes } from "../mocks/settings"

const API = "*/api"

export const settingsHandlers = [
  // Restaurant settings (new endpoint used by useRestaurantSettings)
  http.get(`${API}/settings/restaurant/`, () => {
    return HttpResponse.json(mockSettings)
  }),

  http.patch(`${API}/settings/restaurant/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...mockSettings, ...body })
  }),

  // Legacy settings endpoint (kept for backward compat)
  http.get(`${API}/settings/`, () => {
    return HttpResponse.json(mockSettings)
  }),

  http.put(`${API}/settings/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...mockSettings, ...body })
  }),

  // Notification settings
  http.get(`${API}/settings/notifications/`, () => {
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),

  // Billing settings
  http.get(`${API}/settings/billing/`, () => {
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),

  // Méthodes de paiement (new endpoint used by usePaymentMethods)
  http.get(`${API}/billing/methodes-paiement/`, () => {
    return HttpResponse.json({
      count: mockMethodesPaiement.length,
      next: null,
      previous: null,
      results: mockMethodesPaiement,
    })
  }),

  // Legacy méthodes de paiement endpoint
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
