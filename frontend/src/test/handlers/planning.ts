import { http, HttpResponse } from "msw"
import { mockEmploiDuTemps, mockShifts } from "../mocks/planning"

const API = "*/api"

export const planningHandlers = [
  // Emploi du temps (schedule overview)
  http.get(`${API}/planning/shifts/emploi-du-temps/`, ({ request }) => {
    const url = new URL(request.url)
    const restaurantId = url.searchParams.get("restaurant_id")

    if (!restaurantId) {
      return HttpResponse.json(
        { detail: "restaurant_id est requis" },
        { status: 400 },
      )
    }

    return HttpResponse.json(mockEmploiDuTemps)
  }),

  // Shifts list
  http.get(`${API}/planning/shifts/`, ({ request }) => {
    const url = new URL(request.url)
    const restaurantId = url.searchParams.get("restaurant_id")

    if (!restaurantId) {
      return HttpResponse.json(
        { detail: "restaurant_id requis" },
        { status: 400 },
      )
    }

    return HttpResponse.json({
      count: mockShifts.length,
      next: null,
      previous: null,
      results: mockShifts,
    })
  }),

  // Create shift
  http.post(`${API}/planning/shifts/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update shift
  http.put(`${API}/planning/shifts/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Delete shift
  http.delete(`${API}/planning/shifts/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
