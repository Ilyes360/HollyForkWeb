import { HTTPError } from "ky"
import { api } from "./client"
import { camelizeKeys, snakifyKeys } from "./case-transform"
import { createApiError } from "./errors"

/**
 * Custom mutator for orval-generated hooks.
 * Orval calls: kyMutator<T>(url, { method, body, signal, headers, ... })
 */
export async function kyMutator<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const { method = "GET", body, signal, headers } = options
  const cleanedUrl = url.replace(/^\//, "")

  // Parse body if it's a JSON string (orval serializes it)
  let jsonData: unknown = undefined
  if (body && typeof body === "string") {
    try {
      jsonData = snakifyKeys(JSON.parse(body))
    } catch {
      jsonData = undefined
    }
  }

  try {
    const response = await api(cleanedUrl, {
      method,
      json: jsonData,
      signal: signal ?? undefined,
      headers: headers as Record<string, string>,
    })

    if (response.status === 204) return undefined as T
    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) return undefined as T
    const raw = await response.json()
    return camelizeKeys<T>(raw)
  } catch (err) {
    if (err instanceof HTTPError) {
      let body: unknown = null
      try {
        body = await err.response.json()
      } catch {
        body = await err.response.text().catch(() => null)
      }
      throw createApiError(err.response.status, body)
    }
    throw err
  }
}
