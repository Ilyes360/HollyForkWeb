import { HttpResponse } from "msw"
import { http } from "../api-http"

const mockDeviceLoginResponse = {
  message: "Équipement connecté au restaurant avec succès",
  device_token: "mock-device-token-abc123",
  restaurant_id: 1,
  restaurant_name: "Les Ombres et Bar",
  restaurant_ville: "Paris",
  next_step: "quick_login",
}

const mockEmployees = [
  {
    employee_id: 1,
    employee_name: "Jean Dupont",
    employee_first_name: "Jean",
    employee_last_name: "Dupont",
    employee_type: "Manager Salle",
    employee_type_id: 384,
    has_pin: true,
  },
  {
    employee_id: 2,
    employee_name: "Marie Martin",
    employee_first_name: "Marie",
    employee_last_name: "Martin",
    employee_type: "Serveur",
    employee_type_id: 387,
    has_pin: false,
  },
]

const mockQuickLoginResponse = {
  message: "Connexion réussie",
  access_token: "eyJ-mock-quick-access-token",
  refresh_token: "eyJ-mock-quick-refresh-token",
  user_id: 10,
  username: "jean_dupont",
  employee_id: 1,
  employee_name: "Jean Dupont",
  employee_first_name: "Jean",
  employee_last_name: "Dupont",
  employee_type: "Manager Salle",
  employee_type_id: 384,
  restaurant_id: 1,
  restaurant_name: "Les Ombres et Bar",
}

export const deviceLoginHandlers = [
  // Step 1: device-login
  http.post("/api/auth/device-login/", async ({ request, response }) => {
    const body = await request.json()

    if (body.restaurant_id === 999) {
      return response(400).json({
        detail: { non_field_errors: "Restaurant introuvable." },
      })
    }

    return response(200).json(mockDeviceLoginResponse)
  }),

  // Step 2: restaurant employees
  // NOTE: openapi-msw types this as { [key: string]: unknown }[] for employees
  // because the backend schema uses additionalProperties (DictField).
  // This is a SCHEMA WEAKNESS — the real response has typed employee objects.
  // Logged as drift finding.
  http.get("/api/auth/restaurant-employees/", ({ request, response }) => {
    const url = new URL(request.url)
    const token = url.searchParams.get("device_token")

    if (!token || token === "expired-token") {
      return HttpResponse.json(
        {
          error:
            "Équipement non configuré ou session expirée. Veuillez reconnecter l'équipement.",
        },
        { status: 401 }
      )
    }

    if (token === "empty-restaurant") {
      return response(200).json({
        restaurant_id: 1,
        restaurant_name: "Restaurant Vide",
        employees: [],
        total: 0,
      })
    }

    return response(200).json({
      restaurant_id: 1,
      restaurant_name: "Les Ombres et Bar",
      employees: mockEmployees,
      total: mockEmployees.length,
    })
  }),

  // Step 3: quick-login
  http.post("/api/auth/quick-login/", async ({ request, response }) => {
    const body = await request.json()

    if (body.pin_code === "0000") {
      return response(400).json({
        detail: { non_field_errors: "PIN incorrect." },
      })
    }

    if (body.device_token === "expired-token") {
      return HttpResponse.json(
        {
          non_field_errors: ["Équipement non configuré ou session expirée."],
        },
        { status: 401 }
      )
    }

    return response(200).json(mockQuickLoginResponse)
  }),
]

export { mockDeviceLoginResponse, mockEmployees, mockQuickLoginResponse }
