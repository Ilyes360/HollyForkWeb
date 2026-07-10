import { useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import { apiPost } from "@/api/client"

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
}

const keys = {
  salles: () => ["salles"] as const,
  tables: () => ["tables"] as const,
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
