/**
 * Admin fixtures in snake_case — matching real backend responses.
 * camelizeKeys converts these to the ApiEmploye type fields.
 */

export const mockEmployees = [
  {
    id: 1,
    last_name: "Martin",
    first_name: "Lucas",
    type_employe_id: 1,
    type_employe_name: "Chef de rang",
    salary: "2200.00",
    hire_date: "2022-09-01",
    phone_number: "+33 6 12 34 56 78",
    user_id: null,
  },
  {
    id: 2,
    last_name: "Dubois",
    first_name: "Emma",
    type_employe_id: 2,
    type_employe_name: "Serveur",
    salary: "1900.00",
    hire_date: "2023-01-15",
    phone_number: "+33 6 23 45 67 89",
    user_id: null,
  },
  {
    id: 3,
    last_name: "Bernard",
    first_name: "Hugo",
    type_employe_id: 3,
    type_employe_name: "Chef cuisinier",
    salary: "2800.00",
    hire_date: "2020-06-01",
    phone_number: "+33 6 34 56 78 90",
    user_id: null,
  },
]

export const mockTypeEmployes = [
  { id: 1, type_name: "Chef de rang", description: "Responsable d'un rang de tables" },
  { id: 2, type_name: "Serveur", description: "Service en salle" },
  { id: 3, type_name: "Chef cuisinier", description: "Responsable de la cuisine" },
  { id: 4, type_name: "Commis", description: "Aide en cuisine" },
  { id: 5, type_name: "Barman", description: "Responsable du bar" },
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
