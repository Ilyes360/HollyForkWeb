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
    user_id: 5,
  },
]

export const mockTypeEmployes = [
  {
    id: 1,
    type_name: "Chef de rang",
    description: "Responsable d'un rang de tables",
  },
  { id: 2, type_name: "Serveur", description: "Service en salle" },
  {
    id: 3,
    type_name: "Chef cuisinier",
    description: "Responsable de la cuisine",
  },
  { id: 4, type_name: "Commis", description: "Aide en cuisine" },
  { id: 5, type_name: "Barman", description: "Responsable du bar" },
]

/** Matches GET /api/staff/permissions/roles/ response format */
export const mockRoles = [
  { name: "Gérant", value: "Gérant", hierarchy_level: 1 },
  { name: "Chef", value: "Chef", hierarchy_level: 2 },
  { name: "Responsable salle", value: "Responsable salle", hierarchy_level: 2 },
  { name: "Serveur", value: "Serveur", hierarchy_level: 3 },
]
