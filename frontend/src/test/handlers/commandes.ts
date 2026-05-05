import { http, HttpResponse } from "msw"
import { mockCommandes, mockSuppliers } from "../mocks/commandes"

const API = "*/api"

export const commandeHandlers = [
  // Commandes list
  http.get(`${API}/commandes/`, () => {
    return HttpResponse.json({
      count: mockCommandes.length,
      next: null,
      previous: null,
      results: mockCommandes,
    })
  }),

  // Commande detail
  http.get(`${API}/commandes/:id/`, ({ params }) => {
    const id = Number(params.id)
    const commande = mockCommandes.find((c) => c.id === id)
    if (!commande) return HttpResponse.json({ detail: "Non trouvé" }, { status: 404 })
    return HttpResponse.json(commande)
  }),

  // Create commande
  http.post(`${API}/commandes/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update commande
  http.put(`${API}/commandes/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Delete commande
  http.delete(`${API}/commandes/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Suppliers list
  http.get(`${API}/suppliers/`, () => {
    return HttpResponse.json({
      count: mockSuppliers.length,
      next: null,
      previous: null,
      results: mockSuppliers,
    })
  }),

  // Supplier detail
  http.get(`${API}/suppliers/:id/`, ({ params }) => {
    const id = Number(params.id)
    const supplier = mockSuppliers.find((s) => s.id === id)
    if (!supplier) return HttpResponse.json({ detail: "Non trouvé" }, { status: 404 })
    return HttpResponse.json(supplier)
  }),

  // Create supplier
  http.post(`${API}/suppliers/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update supplier
  http.put(`${API}/suppliers/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Delete supplier
  http.delete(`${API}/suppliers/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
