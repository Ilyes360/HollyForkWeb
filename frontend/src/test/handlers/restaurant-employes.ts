import { http, HttpResponse } from "msw"
import { mockRestaurantEmployes } from "../mocks/restaurant-employes"

const API = "*/api"

export const restaurantEmployeHandlers = [
  // Restaurant-employes list
  http.get(`${API}/restaurant-employes/`, () => {
    return HttpResponse.json({
      count: mockRestaurantEmployes.length,
      next: null,
      previous: null,
      results: mockRestaurantEmployes,
    })
  }),

  // Create restaurant-employe assignment
  http.post(`${API}/restaurant-employes/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Delete restaurant-employe assignment
  http.delete(`${API}/restaurant-employes/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
