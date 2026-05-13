import { http, HttpResponse } from "msw"
import { mockShifts } from "../mocks/planning"

const API = "*/api"

export const planningHandlers = [
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
    return HttpResponse.json(
      { id: 100, ...mockShifts[0], ...body },
      { status: 201 },
    )
  }),

  // Update shift
  http.put(`${API}/planning/shifts/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...mockShifts[0], id: Number(params.id), ...body })
  }),

  // Delete shift
  http.delete(`${API}/planning/shifts/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
