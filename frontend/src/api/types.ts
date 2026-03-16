/**
 * Types partagés pour la couche API.
 * Pagination, erreurs, et réponses génériques.
 */

/** Réponse paginée DRF (PageNumberPagination) */
export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Structure d'erreur renvoyée par le backend */
export type ApiError = {
  detail?: string
  nonFieldErrors?: string[]
  [field: string]: unknown
}

/** Options communes pour les queries de liste */
export type ListParams = {
  page?: number
  pageSize?: number
}
