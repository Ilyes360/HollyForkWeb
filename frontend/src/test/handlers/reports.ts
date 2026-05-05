import { http, HttpResponse } from "msw"
import { mockReports } from "../mocks/reports"

const API = "*/api"

export const reportHandlers = [
  // Reports list (with restaurant_id and type params)
  http.get(`${API}/reports/`, ({ request }) => {
    const url = new URL(request.url)
    const restaurantId = url.searchParams.get("restaurant_id")
    const type = url.searchParams.get("type")
    let filtered = mockReports
    if (restaurantId) {
      filtered = filtered.filter((r) => r.restaurant_id === Number(restaurantId))
    }
    if (type) {
      filtered = filtered.filter((r) => r.type === type)
    }
    return HttpResponse.json({
      count: filtered.length,
      next: null,
      previous: null,
      results: filtered,
    })
  }),
]
