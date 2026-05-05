import { http, HttpResponse } from "msw"
import { mockReservations, mockSalles, mockTables } from "../mocks/reservations"

const API = "*/api"

export const reservationHandlers = [
  // Reservations list
  http.get(`${API}/reservations/`, () => {
    return HttpResponse.json({
      count: mockReservations.length,
      next: null,
      previous: null,
      results: mockReservations,
    })
  }),

  // Reservation detail
  http.get(`${API}/reservations/:id/`, ({ params }) => {
    const id = Number(params.id)
    const resa = mockReservations.find((r) => r.id === id)
    if (!resa) return HttpResponse.json({ detail: "Non trouvé" }, { status: 404 })
    return HttpResponse.json(resa)
  }),

  // Create reservation
  http.post(`${API}/reservations/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update reservation
  http.put(`${API}/reservations/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Patch reservation (status change)
  http.patch(`${API}/reservations/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const resa = mockReservations.find((r) => r.id === Number(params.id))
    return HttpResponse.json({ ...resa, ...body })
  }),

  // Delete reservation
  http.delete(`${API}/reservations/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Salles list
  http.get(`${API}/salles/`, () => {
    return HttpResponse.json({
      count: mockSalles.length,
      next: null,
      previous: null,
      results: mockSalles,
    })
  }),

  // Tables list
  http.get(`${API}/tables/`, () => {
    return HttpResponse.json({
      count: mockTables.length,
      next: null,
      previous: null,
      results: mockTables,
    })
  }),
]
