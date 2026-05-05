/**
 * Admin fixtures in snake_case — matching real backend responses.
 */

export const mockEmployees = [
  {
    id: 1,
    nom: "Martin",
    prenom: "Lucas",
    email: "lucas.martin@hollyfork.fr",
    telephone: "+33 6 12 34 56 78",
    type_employe_id: 1,
    pin_code: "1234",
  },
  {
    id: 2,
    nom: "Dubois",
    prenom: "Emma",
    email: "emma.dubois@hollyfork.fr",
    telephone: "+33 6 23 45 67 89",
    type_employe_id: 2,
    pin_code: "5678",
  },
  {
    id: 3,
    nom: "Bernard",
    prenom: "Hugo",
    email: "hugo.bernard@hollyfork.fr",
    telephone: "+33 6 34 56 78 90",
    type_employe_id: 3,
    pin_code: "9012",
  },
]

export const mockTypeEmployes = [
  { id: 1, nom: "Chef de rang", description: "Responsable d'un rang de tables" },
  { id: 2, nom: "Serveur", description: "Service en salle" },
  { id: 3, nom: "Chef cuisinier", description: "Responsable de la cuisine" },
  { id: 4, nom: "Commis", description: "Aide en cuisine" },
  { id: 5, nom: "Barman", description: "Responsable du bar" },
]

export const mockRoles = [
  {
    id: 1,
    name: "gerant",
    description: "Accès complet à toutes les fonctionnalités",
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
  },
  {
    id: 2,
    name: "chef",
    description: "Gestion cuisine et stocks",
    permissions: ["manage_stocks", "manage_suppliers"],
  },
  {
    id: 3,
    name: "responsable_salle",
    description: "Gestion salle et réservations",
    permissions: ["manage_reservations", "manage_planning"],
  },
  {
    id: 4,
    name: "serveur",
    description: "Consultation réservations et salle",
    permissions: [],
  },
]
