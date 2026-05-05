import { http, HttpResponse } from "msw"
import { mockDashboardKpis, mockDashboardMap } from "../mocks/dashboard"

const API = "*/api"

export const dashboardHandlers = [
  http.get(`${API}/dashboard/kpis/`, ({ request }) => {
    const url = new URL(request.url)
    const restaurantId = url.searchParams.get("restaurant_id")

    if (!restaurantId) {
      return HttpResponse.json(
        { detail: "restaurant_id est requis" },
        { status: 400 },
      )
    }

    if (restaurantId === "999") {
      return HttpResponse.json(
        { detail: "Restaurant non trouvé" },
        { status: 404 },
      )
    }

    return HttpResponse.json(mockDashboardKpis)
  }),

  http.get(`${API}/dashboard/map/`, () => {
    return HttpResponse.json(mockDashboardMap)
  }),
]
