/**
 * Utilitaires de transformation snake_case <-> camelCase
 * pour mapper automatiquement les réponses/requêtes API.
 */

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
}

function transformKeys(
  data: unknown,
  transformer: (key: string) => string,
): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => transformKeys(item, transformer))
  }
  if (data !== null && typeof data === "object" && !(data instanceof Date)) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[transformer(key)] = transformKeys(value, transformer)
    }
    return result
  }
  return data
}

/** Convertit récursivement toutes les clés d'un objet de snake_case vers camelCase */
export function camelizeKeys<T>(data: unknown): T {
  return transformKeys(data, toCamelCase) as T
}

/** Convertit récursivement toutes les clés d'un objet de camelCase vers snake_case */
export function snakifyKeys<T>(data: unknown): T {
  return transformKeys(data, toSnakeCase) as T
}
