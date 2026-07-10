import { http, HttpResponse } from "msw"
import { mockLignesCommandes } from "../mocks/lignes-commandes"

const API = "*/api"

export const ligneCommandeHandlers = [
  // Lignes-commandes list (with optional commande_id filter)
  http.get(`${API}/lignes-commandes/`, ({ request }) => {
    const url = new URL(request.url)
    const commandeId = url.searchParams.get("commande_id")
    const filtered = commandeId
      ? mockLignesCommandes.filter((l) => l.commande_id === Number(commandeId))
      : mockLignesCommandes
    return HttpResponse.json({
      count: filtered.length,
      next: null,
      previous: null,
      results: filtered,
    })
  }),

  // Create ligne-commande
  http.post(`${API}/lignes-commandes/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: 100, ...body }, { status: 201 })
  }),

  // Update ligne-commande (full + partial)
  http.put(`${API}/lignes-commandes/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),
  http.patch(`${API}/lignes-commandes/:id/`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ id: Number(params.id), ...body })
  }),

  // Delete ligne-commande
  http.delete(`${API}/lignes-commandes/:id/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
