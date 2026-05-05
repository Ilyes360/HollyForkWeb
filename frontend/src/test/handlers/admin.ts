import { http, HttpResponse } from "msw"
import { mockEmployees, mockTypeEmployes, mockRoles } from "../mocks/admin"

const API = "*/api"

export const adminHandlers = [
  // Employes list
  http.get(`${API}/employes/`, () => {
    return HttpResponse.json({
      count: mockEmployees.length,
      next: null,
      previous: null,
      results: mockEmployees,
    })
  }),

  // Employe detail
  http.get(`${API}/employes/:id/`, ({ params }) => {
    const id = Number(params.id)
    const emp = mockEmployees.find((e) => e.id === id)
    if (!emp) {
      return HttpResponse.json({ detail: "Non trouvé" }, { status: 404 })
    }
    return HttpResponse.json(emp)
  }),

  // Create employe
  http.post(`${API}/employes/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(
      { id: 100, ...body },
      { status: 201 },
    )
  }),

  // Update employe
  http.put(`${API}/employes/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Delete employe
  http.delete(`${API}/employes/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Type employes
  http.get(`${API}/type-employes/`, () => {
    return HttpResponse.json({
      count: mockTypeEmployes.length,
      next: null,
      previous: null,
      results: mockTypeEmployes,
    })
  }),

  // Staff roles
  http.get(`${API}/staff/roles/all/`, () => {
    return HttpResponse.json({ roles: mockRoles })
  }),

  // Staff permissions (my)
  http.get(`${API}/staff/permissions/me/`, () => {
    return HttpResponse.json({
      role_name: "Gérant",
      permissions: [
        "manage_staff",
        "manage_establishments",
        "manage_roles",
        "manage_planning",
        "manage_reservations",
        "manage_stocks",
        "manage_suppliers",
        "manage_settings",
      ],
    })
  }),
]
