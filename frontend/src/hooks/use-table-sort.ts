import { useState, useMemo } from "react"

type SortDir = "asc" | "desc"

interface UseTableSortOptions<T, K extends string> {
  data: T[]
  defaultSortKey: K
  defaultSortDir?: SortDir
  getSortValue: (item: T, key: K) => string | number
  /** Optional secondary sort key for stable ordering when primary values are equal */
  secondarySortKey?: K
}

interface UseTableSortReturn<T, K extends string> {
  sortedData: T[]
  sortKey: K
  sortDir: SortDir
  handleSort: (key: K) => void
}

export function useTableSort<T, K extends string>({
  data,
  defaultSortKey,
  defaultSortDir = "asc",
  getSortValue,
  secondarySortKey,
}: UseTableSortOptions<T, K>): UseTableSortReturn<T, K> {
  const [sortKey, setSortKey] = useState<K>(defaultSortKey)
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir)

  const handleSort = (key: K) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      let cmp = 0
      if (typeof va === "string" && typeof vb === "string") {
        cmp = va.localeCompare(vb, "fr")
      } else {
        cmp = (va as number) - (vb as number)
      }
      if (cmp === 0 && secondarySortKey) {
        const sa = getSortValue(a, secondarySortKey)
        const sb = getSortValue(b, secondarySortKey)
        if (typeof sa === "string" && typeof sb === "string") {
          cmp = sa.localeCompare(sb, "fr")
        } else {
          cmp = (sa as number) - (sb as number)
        }
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [data, sortKey, sortDir, getSortValue, secondarySortKey])

  return { sortedData, sortKey, sortDir, handleSort }
}
