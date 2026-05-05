import { http, HttpResponse } from "msw"
import { mockEmployeesStatus } from "../mocks/employees-status"

const API = "*/api"

export const employeesStatusHandlers = [
  // Employees status list
  http.get(`${API}/employees/status/`, ({ request }) => {
    const url = new URL(request.url)
    const restaurantId = url.searchParams.get("restaurant_id")
    const filtered = restaurantId
      ? mockEmployeesStatus.filter((e) => e.restaurant_id === Number(restaurantId))
      : mockEmployeesStatus
    return HttpResponse.json({
      count: filtered.length,
      next: null,
      previous: null,
      results: filtered,
    })
  }),
]
