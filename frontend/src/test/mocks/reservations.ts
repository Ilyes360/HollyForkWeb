/**
 * Reservation fixtures in snake_case — matching real backend responses.
 */

export const mockReservations = [
  {
    id: 1,
    client_name: "Martin Dupont",
    client_phone: "06 12 34 56 78",
    client_email: "martin.dupont@email.fr",
    date: "2026-05-05",
    time: "12:00",
    service: "midi",
    covers: 2,
    table_number: 3,
    canal: "site",
    status: "confirmee",
    notes: "Anniversaire de mariage",
    restaurant_id: 1,
    created_at: "2026-05-01T10:00:00Z",
  },
  {
    id: 2,
    client_name: "Sophie Laurent",
    client_phone: "06 98 76 54 32",
    client_email: "sophie.laurent@email.fr",
    date: "2026-05-05",
    time: "12:15",
    service: "midi",
    covers: 4,
    table_number: 4,
    canal: "telephone",
    status: "confirmee",
    notes: null,
    restaurant_id: 1,
    created_at: "2026-05-02T14:00:00Z",
  },
  {
    id: 3,
    client_name: "Pierre Moreau",
    client_phone: "06 11 22 33 44",
    client_email: null,
    date: "2026-05-05",
    time: "19:30",
    service: "soir",
    covers: 6,
    table_number: 5,
    canal: "thefork",
    status: "confirmee",
    notes: "Allergie arachides",
    restaurant_id: 1,
    created_at: "2026-05-03T09:00:00Z",
  },
]

export const mockSalles = [
  {
    id: 1,
    nom: "Salle principale",
    restaurant_id: 1,
    capacite: 36,
  },
  {
    id: 2,
    nom: "Terrasse",
    restaurant_id: 1,
    capacite: 12,
  },
]

export const mockTables = [
  { id: 1, numero: 1, label: "T1", places: 4, salle_id: 1 },
  { id: 2, numero: 2, label: "T2", places: 4, salle_id: 1 },
  { id: 3, numero: 3, label: "T3", places: 2, salle_id: 1 },
  { id: 4, numero: 4, label: "T4", places: 6, salle_id: 1 },
  { id: 5, numero: 5, label: "T5", places: 8, salle_id: 1 },
  { id: 6, numero: 6, label: "T6", places: 2, salle_id: 2 },
  { id: 7, numero: 7, label: "T7", places: 4, salle_id: 2 },
]
