/**
 * Settings fixtures in snake_case — matching real backend responses.
 * camelizeKeys will convert these to camelCase for the hooks.
 */

export const mockSettings = {
  restaurant_id: 1,
  name: "Holy Fork — Marais",
  address: "12 rue des Rosiers",
  postal_code: "75004",
  city: "Paris",
  phone_number: "+33 1 42 72 00 00",
  siret: "12345678901234",
  naf_code: null,
  pin: "1234",
  logo_url: null,
}

export const mockMethodesPaiement = [
  { id: 1, name: "Carte bancaire", created_at: "2026-01-01T00:00:00Z" },
  { id: 2, name: "Espèces", created_at: "2026-01-01T00:00:00Z" },
  { id: 3, name: "Ticket restaurant", created_at: "2026-01-01T00:00:00Z" },
  { id: 4, name: "Chèque", created_at: "2026-01-01T00:00:00Z" },
]

export const mockNotes = [
  {
    id: 1,
    created_by_id: 1,
    created_by_name: "Admin",
    restaurant_id: 1,
    created_at: "2026-05-01T10:00:00Z",
    message: "Vérifier livraison lundi",
  },
  {
    id: 2,
    created_by_id: 1,
    created_by_name: "Admin",
    restaurant_id: 1,
    created_at: "2026-05-02T14:00:00Z",
    message: "Formation nouvelle recrue mercredi",
  },
]
