/**
 * Auth fixtures in snake_case — matching real backend responses.
 * The camelizeKeys pipeline is validated by MSW returning these.
 */

export const mockLoginResponse = {
  message: "Connexion réussie",
  access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-access-token",
  token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-access-token",
  refresh_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-refresh-token",
  user_id: 1,
  username: "marie.dupont",
  email: "marie@hollyfork.fr",
  first_name: "Marie",
  last_name: "Dupont",
  employee_id: 1,
  employee_name: "Marie Dupont",
  employee_first_name: "Marie",
  employee_last_name: "Dupont",
  employee_type: "Gérant",
  employee_type_id: 1,
  restaurant_id: 1,
  restaurant_name: "Holly Fork — Marais",
}

export const mockProfile = {
  id: 1,
  username: "marie.dupont",
  email: "marie@hollyfork.fr",
  first_name: "Marie",
  last_name: "Dupont",
  date_joined: "2024-01-15T10:00:00Z",
  is_active: true,
  employee_id: 1,
  employee_name: "Marie Dupont",
  employee_first_name: "Marie",
  employee_last_name: "Dupont",
  employee_type: "Gérant",
  employee_type_id: 1,
}
