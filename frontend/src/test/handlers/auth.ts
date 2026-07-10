import { http, HttpResponse } from "msw"
import { mockLoginResponse, mockProfile } from "../mocks/auth"

const API = "*/api"

export const authHandlers = [
  // Login
  http.post(`${API}/auth/login/`, async ({ request }) => {
    const body = (await request.json()) as {
      username?: string
      password?: string
    }

    if (!body.username || !body.password) {
      return HttpResponse.json(
        { detail: "Email et mot de passe requis" },
        { status: 400 }
      )
    }

    if (body.username === "bad") {
      return HttpResponse.json(
        { detail: "Email ou mot de passe incorrect" },
        { status: 401 }
      )
    }

    if (body.username === "rate_limited") {
      return HttpResponse.json(
        { detail: "Trop de tentatives" },
        { status: 429 }
      )
    }

    if (body.username === "error") {
      return HttpResponse.json(
        { detail: "Internal server error" },
        { status: 500 }
      )
    }

    return HttpResponse.json(mockLoginResponse)
  }),

  // Profile
  http.get(`${API}/auth/profile/`, ({ request }) => {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json({ detail: "Non authentifié" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    if (token === "expired-token") {
      return HttpResponse.json({ detail: "Token expiré" }, { status: 401 })
    }

    return HttpResponse.json(mockProfile)
  }),

  // Logout
  http.post(`${API}/auth/logout/`, () => {
    return HttpResponse.json({ message: "Déconnexion réussie" })
  }),

  // Token refresh
  http.post(`${API}/auth/token/refresh/`, async ({ request }) => {
    const body = (await request.json()) as { refresh?: string }

    if (body.refresh === "valid-refresh-token") {
      return HttpResponse.json({ access: "new-access-token" })
    }

    return HttpResponse.json({ detail: "Token invalide" }, { status: 401 })
  }),

  // CSRF
  http.get(`${API}/auth/csrf-token/`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
