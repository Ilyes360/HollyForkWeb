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
        { status: 404 },
      )
    }

    return HttpResponse.json(mockRestaurantDetail)
  }),
]
