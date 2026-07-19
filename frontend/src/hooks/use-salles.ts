import { useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import { apiPost, getAccessToken } from "@/api/client"
import { fetchAllPages } from "@/api/pagination"

type ApiSalle = {
  id: number
  name: string
  restaurantId: number
  capacity: number
  floor: number
}

type ApiTable = {
  id: number
  numero: number
  capacity: number
  positionX: number
  positionY: number
  salleId: number
  isOccupied: boolean
  employeeInChargeId: number | null
}

export interface SalleWithTables {
  id: number
  name: string
  restaurantId: number
  capacity: number
  floor: number
  tables: ApiTable[]
}

const keys = {
  salles: (restaurantId?: number) => ["salles", restaurantId] as const,
  tables: (restaurantId?: number) => ["tables", restaurantId] as const,
}

/**
 * Fetch salles + tables for a restaurant.
 */
export function useSalles(restaurantId: number | null) {
  const hasToken = !!getAccessToken()

  const sallesQuery = useQuery({
    queryKey: keys.salles(restaurantId ?? undefined),
    queryFn: () =>
      fetchAllPages<ApiSalle>("salles/", { restaurantId: restaurantId! }),
    enabled: hasToken && !!restaurantId,
    staleTime: 5 * 60_000,
  })

  const tablesQuery = useQuery({
    queryKey: keys.tables(restaurantId ?? undefined),
    queryFn: () => fetchAllPages<ApiTable>("tables/", {}),
    enabled: hasToken && !!restaurantId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  const data = useMemo(() => {
    const salles = sallesQuery.data ?? []
    const tables = tablesQuery.data ?? []
    return salles
      .filter((s) => s.restaurantId === restaurantId)
      .map((s) => ({
        ...s,
        tables: tables.filter((t) => t.salleId === s.id),
      }))
  }, [sallesQuery.data, tablesQuery.data, restaurantId])

  return { data, isLoading: sallesQuery.isLoading || tablesQuery.isLoading }
}

export function useCreateSalle() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (data: {
      name: string
      restaurantId: number
      capacity: number
      floor: number
    }) => apiPost<ApiSalle>("salles/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.salles() }),
  })
}

export function useCreateTable() {
  const qc = useQueryClient()
  return useMutationWithDefaults({
    mutationFn: (data: {
      numero: number
      capacity: number
      positionX: number
      positionY: number
      salleId: number
    }) => apiPost<ApiTable>("tables/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tables() }),
  })
}
