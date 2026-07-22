import { HttpResponse } from "msw"
import { http } from "../api-http"
import { mockReservations, mockSalles, mockTables } from "../mocks/reservations"

function errorJson(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export const reservationHandlers = [
  // Reservations list — typed
  http.get("/api/reservations/", ({ request, response }) => {
    const url = new URL(request.url)
    const dateFilter = url.searchParams.get("date")

    let filtered = mockReservations
    if (dateFilter) {
      filtered = filtered.filter((r) => r.datetime.startsWith(dateFilter))
    }

    return response(200).json({
      count: filtered.length,
      next: null,
      previous: null,
      results: filtered,
    })
  }),

  // Reservation detail — typed (200), plain Response (404)
  http.get("/api/reservations/{id}/", ({ params, response }) => {
    const id = Number(params.id)
    const resa = mockReservations.find((r) => r.id === id)
    if (!resa) return errorJson({ detail: "Non trouvé" }, 404)
    return response(200).json(resa)
  }),

  // Create reservation — typed
  http.post("/api/reservations/", async ({ request, response }) => {
    const body = await request.json()
    return response(201).json({
      id: 100,
      client_name: body.client_name,
      party_size: body.party_size ?? 2,
      datetime: body.datetime ?? "2026-07-21T12:00:00",
      phone_number: body.phone_number ?? "",
      salle_id: body.salle_id ?? 1,
      table_id: body.table_id ?? null,
      note_serveur: body.note_serveur ?? null,
      note_client: null,
      allergie: null,
      created_at: "2026-07-21T12:00:00Z",
      allergies: [],
      diet_types: [],
    })
  }),

  // Patch reservation — raw Response (typed response rejects spread of partial body)
  http.patch("/api/reservations/{id}/", async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const resa = mockReservations.find((r) => r.id === Number(params.id))
    if (!resa) return errorJson({ detail: "Non trouvé" }, 404)
    return Response.json({ ...resa, ...body })
  }),

  // Delete reservation — typed
  http.delete("/api/reservations/{id}/", () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Salles list — typed
  http.get("/api/salles/", ({ response }) => {
    return response(200).json({
      count: mockSalles.length,
      next: null,
      previous: null,
      results: mockSalles,
    })
  }),

  // Tables list — typed
  http.get("/api/tables/", ({ response }) => {
    return response(200).json({
      count: mockTables.length,
      next: null,
      previous: null,
      results: mockTables,
    })
  }),
]
