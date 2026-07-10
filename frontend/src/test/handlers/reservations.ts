import { http, HttpResponse } from "msw"
import { mockReservations, mockSalles, mockTables } from "../mocks/reservations"

const API = "*/api"

export const reservationHandlers = [
  // Reservations list (supports date and restaurant_id filtering)
  http.get(`${API}/reservations/`, ({ request }) => {
    const url = new URL(request.url)
    const dateFilter = url.searchParams.get("date")
    const restaurantFilter = url.searchParams.get("restaurant_id")

    let filtered = mockReservations
    if (dateFilter) {
      // datetime is ISO: "2026-05-05T12:00:00" — compare date portion
      filtered = filtered.filter((r) => r.datetime.startsWith(dateFilter))
    }
    if (restaurantFilter) {
      filtered = filtered.filter((r) => r.salle_id === Number(restaurantFilter))
    }

    return HttpResponse.json({
      count: filtered.length,
      next: null,
      previous: null,
      results: filtered,
    })
  }),

  // Reservation detail
  http.get(`${API}/reservations/:id/`, ({ params }) => {
    const id = Number(params.id)
    const resa = mockReservations.find((r) => r.id === id)
    if (!resa)
      return HttpResponse.json({ detail: "Non trouvé" }, { status: 404 })
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
