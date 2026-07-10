import { http, HttpResponse } from "msw"
import { mockRestaurants, mockRestaurantDetail } from "../mocks/restaurants"

const API = "*/api"

export const restaurantHandlers = [
  http.get(`${API}/restaurants/`, () => {
    return HttpResponse.json({
      count: mockRestaurants.length,
      next: null,
      previous: null,
      results: mockRestaurants,
    })
  }),

  http.get(`${API}/restaurants/:id/`, ({ params }) => {
    const id = Number(params.id)

    if (id === 999) {
      return HttpResponse.json(
        { detail: "Restaurant non trouvé" },
        { status: 404 }
      )
    }

    return HttpResponse.json(mockRestaurantDetail)
  }),

  http.post(`${API}/restaurants/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ restaurant_id: 42, ...body }, { status: 201 })
  }),

  http.patch(`${API}/restaurants/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const existing = mockRestaurants.find(
      (r) => r.restaurant_id === Number(params.id)
    )
    return HttpResponse.json({ ...existing, ...body })
  }),

  http.put(`${API}/restaurants/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ restaurant_id: Number(params.id), ...body })
  }),

  http.delete(`${API}/restaurants/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
