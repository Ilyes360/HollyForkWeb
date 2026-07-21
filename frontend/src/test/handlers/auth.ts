import { http as rawHttp, HttpResponse } from "msw"
import { http } from "../api-http"
import { mockLoginResponse, mockProfile } from "../mocks/auth"

export const authHandlers = [
  // Login — typed against OpenAPI schema
  http.post("/api/auth/login/", async ({ request, response }) => {
    const body = await request.json()

    if (!body.username || !body.password) {
      return response(400).json({
        detail: { username: "Ce champ est obligatoire." },
      })
    }

    if (body.username === "bad") {
      return response(400).json({
        detail: { non_field_errors: "Identifiants invalides" },
      })
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

    return response(200).json(mockLoginResponse)
  }),

  // Profile — typed
  http.get("/api/auth/profile/", ({ request, response }) => {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json({ detail: "Non authentifié" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    if (token === "expired-token") {
      return HttpResponse.json({ detail: "Token expiré" }, { status: 401 })
    }

    return response(200).json(mockProfile)
  }),

  // Logout — typed
  http.post("/api/auth/logout/", ({ response }) => {
    return response(200).json({ message: "Déconnexion réussie" })
  }),

  // Token refresh — untyped (uses raw http, non-standard response shape)
  rawHttp.post("*/api/auth/token/refresh/", async ({ request }) => {
    const body = (await request.json()) as { refresh?: string }

    if (body.refresh === "valid-refresh-token") {
      return HttpResponse.json({ access: "new-access-token" })
    }

    return HttpResponse.json({ detail: "Token invalide" }, { status: 401 })
  }),

  // CSRF — typed
  http.get("/api/auth/csrf-token/", () => {
    return new HttpResponse(null, { status: 200 })
  }),
]
