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
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update employe (PUT)
  http.put(`${API}/employes/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Update employe (PATCH)
  http.patch(`${API}/employes/:id/`, async ({ request, params }) => {
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

  // Staff roles (GET /api/staff/permissions/roles/)
  http.get(`${API}/staff/permissions/roles/`, () => {
    return HttpResponse.json({ roles: mockRoles, count: mockRoles.length })
  }),

  // Staff permissions (my)
  http.get(`${API}/staff/permissions/me/`, () => {
    return HttpResponse.json({
      user: { id: 1, username: "marie.dupont" },
      employe: { id: 1, nom: "Dupont", prenom: "Marie" },
      role: "Gérant",
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
      restaurants: [{ id: 1, nom: "Les Ombres" }],
      permission_count: 8,
      restaurant_count: 1,
    })
  }),

  // Permissions hierarchy
  http.get(`${API}/staff/permissions/hierarchy/`, () => {
    return HttpResponse.json({
      hierarchy: [
        { level: 1, role: "Gérant", permissions_count: 8 },
        { level: 2, role: "Chef", permissions_count: 4 },
        { level: 3, role: "Responsable salle", permissions_count: 3 },
        { level: 4, role: "Serveur", permissions_count: 1 },
      ],
      total_levels: 4,
    })
  }),

  // Permissions matrix
  http.get(`${API}/staff/permissions/matrix/`, () => {
    return HttpResponse.json({
      matrix: {
        Gérant: [
          "manage_staff",
          "manage_establishments",
          "manage_roles",
          "manage_planning",
          "manage_reservations",
          "manage_stocks",
          "manage_suppliers",
          "manage_settings",
        ],
        Chef: [
          "manage_stocks",
          "manage_suppliers",
          "manage_recipes",
          "manage_menus",
        ],
        "Responsable salle": [
          "manage_reservations",
          "manage_planning",
          "assign_tables",
        ],
        Serveur: ["take_orders"],
      },
      roles_count: 4,
      total_permissions: 16,
    })
  }),
]
