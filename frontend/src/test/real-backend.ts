import { http as rawHttp, passthrough } from "msw"
import { server } from "./server"

/**
 * Auth integration tests (features/auth/pages.test.tsx, guards.test.tsx) hit
 * this real backend instead of MSW mocks — see docs/testing/auth.md.
 * Requires the backend from .env.local (API_PROXY_TARGET) running locally.
 */
export const REAL_API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Registers MSW passthrough for the given path patterns so requests reach
 * the real backend instead of being intercepted by the default mock
 * handlers already registered on the shared `server`.
 */
export function passthroughReal(
  ...routes: Array<{
    method: "get" | "post" | "put" | "patch" | "delete"
    path: string
  }>
) {
  server.use(
    ...routes.map(({ method, path }) =>
      rawHttp[method](path, () => passthrough())
    )
  )
}

export async function ensureBackendReachable() {
  passthroughReal({ method: "get", path: "*/api/schema/" })
  try {
    const response = await fetch(`${REAL_API_BASE_URL}/schema/`)
    if (!response.ok) {
      throw new Error(`status ${response.status}`)
    }
  } catch (error) {
    throw new Error(
      `Backend injoignable sur ${REAL_API_BASE_URL} — lance-le avant de rouler ces tests d'intégration (${String(error)}).`
    )
  }
}

/**
 * Real login against the backend — used to obtain a genuine JWT for guard
 * tests, since a fabricated token would fail real signature verification.
 */
export async function loginReal(
  username: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  passthroughReal({ method: "post", path: "*/api/auth/login/" })
  const response = await fetch(`${REAL_API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) {
    throw new Error(
      `Echec login reel (${username}) contre ${REAL_API_BASE_URL} — status ${response.status}`
    )
  }
  const data = (await response.json()) as {
    access_token: string
    refresh_token: string
  }
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}
