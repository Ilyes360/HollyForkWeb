/**
 * Employee status fixtures in snake_case — matching real backend responses.
 * This is different from /api/employes/ — this is the /api/employees/status/ endpoint.
 */

export const mockEmployeesStatus = [
  {
    id: 1,
    employe_id: 1,
    nom: "Dupont",
    prenom: "Jean",
    statut: "present",
    heure_arrivee: "08:00",
    restaurant_id: 1,
    date: "2026-05-05",
  },
  {
    id: 2,
    employe_id: 2,
    nom: "Martin",
    prenom: "Sophie",
    statut: "absent",
    heure_arrivee: null,
    restaurant_id: 1,
    date: "2026-05-05",
  },
]
