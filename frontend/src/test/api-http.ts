import { createOpenApiHttp } from "openapi-msw"
import type { paths } from "@/types/api"

/**
 * Type-safe MSW http handlers tied to the OpenAPI schema.
 * If the schema changes and a handler diverges, tsc will fail.
 *
 * Usage:
 *   import { http } from "@/test/api-http"
 *   http.get("/api/reservations/", ({ response }) => response(200).json({ ... }))
 *
 * For endpoints not yet in the schema or error scenarios, use:
 *   import { http as rawHttp } from "msw"
 */
export const http = createOpenApiHttp<paths>({ baseUrl: "*" })
