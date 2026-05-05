import ky, { type Options, type KyInstance, HTTPError } from "ky"
import { camelizeKeys, snakifyKeys } from "./case-transform"
import type { ApiError } from "./types"

/**
 * Client API central.
 *
 * - Base URL : le proxy Vite redirige `/api` vers `http://localhost:8000`
 * - Auth : injecte automatiquement le Bearer token depuis localStorage
 * - Transforme les clés : snake_case (back) <-> camelCase (front)
 * - Gère le refresh token automatique sur 401
 */


const TOKEN_KEY = "holly_access_token"
const REFRESH_KEY = "holly_refresh_token"

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

const API_BASE_URL =
  typeof window !== "undefined" && window.location?.origin !== "null"
    ? `${window.location.origin}/api`
    : "http://localhost:3000/api"

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function ensureCsrfCookie(): Promise<void> {
  if (!getCsrfToken()) {
    await ky.get(`${API_BASE_URL}/auth/csrf-token/`)
  }
}

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  try {
    // Appel direct sans passer par `api` pour éviter la boucle infinie
    const response = await ky
      .post(`${API_BASE_URL}/auth/token/refresh/`, {
        json: { refresh },
      })
      .json<{ access: string }>()

    setTokens(response.access, refresh)
    return response.access
  } catch {
    clearTokens()
    return null
  }
}

export const api: KyInstance = ky.create({
  prefixUrl: API_BASE_URL,
  timeout: 30_000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAccessToken()
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
        // CSRF token for non-GET requests
        const method = request.method.toUpperCase()
        if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
          const csrfToken = getCsrfToken()
          if (csrfToken) {
            request.headers.set("X-CSRFToken", csrfToken)
          }
        }
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 403) {
          window.dispatchEvent(new CustomEvent("api:forbidden"))
        }
      },
    ],
    beforeRetry: [
      async ({ request, error }) => {
        // Refresh token sur 401
        const response = (error as { response?: Response })?.response
        if (response?.status !== 401) return

        if (!isRefreshing) {
          isRefreshing = true
          refreshPromise = refreshAccessToken()
        }

        const newToken = await refreshPromise
        isRefreshing = false
        refreshPromise = null

        if (newToken) {
          request.headers.set("Authorization", `Bearer ${newToken}`)
        }
      },
    ],
  },
  retry: {
    limit: 1,
    statusCodes: [401],
    methods: ["get", "post", "put", "patch", "delete"],
  },
})

/**
 * Helpers typés qui gèrent la transformation camelCase/snake_case.
 *
 * Usage :
 *   const data = await apiGet<LoginResponse>("auth/login/")
 *   const data = await apiPost<LoginResponse>("auth/login/", { email, password })
 */

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: Options,
): Promise<T> {
  const searchParams = params
    ? Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [toSnakeCase(k), String(v)]),
      )
    : undefined
  const raw = await api.get(url, { ...options, searchParams }).json()
  return camelizeKeys<T>(raw)
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  options?: Options,
): Promise<T> {
  const raw = await api
    .post(url, { ...options, json: body ? snakifyKeys(body) : undefined })
    .json()
  return camelizeKeys<T>(raw)
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  options?: Options,
): Promise<T> {
  const raw = await api
    .put(url, { ...options, json: body ? snakifyKeys(body) : undefined })
    .json()
  return camelizeKeys<T>(raw)
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  options?: Options,
): Promise<T> {
  const raw = await api
    .patch(url, { ...options, json: body ? snakifyKeys(body) : undefined })
    .json()
  return camelizeKeys<T>(raw)
}

export async function apiDelete<T>(
  url: string,
  options?: Options,
): Promise<T> {
  const response = await api.delete(url, options)
  if (response.status === 204) return undefined as T
  const raw = await response.json()
  return camelizeKeys<T>(raw)
}

export async function apiUpload<T>(
  url: string,
  formData: FormData,
  options?: Options,
): Promise<T> {
  const raw = await api.post(url, { ...options, body: formData }).json()
  return camelizeKeys<T>(raw)
}

export async function extractApiError(error: unknown): Promise<ApiError> {
  if (error instanceof HTTPError) {
    try {
      const body = await error.response.json()
      return camelizeKeys<ApiError>(body)
    } catch {
      return { detail: `Erreur ${error.response.status}` }
    }
  }
  if (error instanceof Error) {
    return { detail: error.message }
  }
  return { detail: "Une erreur inattendue est survenue" }
}
