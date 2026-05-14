import { apiGet } from "./client"
import type { PaginatedResponse } from "./types"

/**
 * Fetches all pages from a paginated DRF endpoint.
 * The backend forces PAGE_SIZE=20 and ignores page_size params.
 */
export async function fetchAllPages<T>(
  url: string,
  params: Record<string, string | number | boolean>,
): Promise<T[]> {
  const all: T[] = []
  let page = 1
  let hasNext = true
  while (hasNext) {
    const res = await apiGet<PaginatedResponse<T>>(url, { ...params, page })
    all.push(...res.results)
    hasNext = !!res.next
    page++
    if (page > 50) break // safety limit
  }
  return all
}
