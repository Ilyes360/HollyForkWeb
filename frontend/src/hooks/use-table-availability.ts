import { useMemo } from "react"
import type { Reservation, RestaurantTable } from "@/components/reservations/types"
import { RESTAURANT_TABLES } from "@/components/reservations/data"

export interface TableAvailability {
  table: RestaurantTable
  currentReservation: Reservation | null
  nextReservation: Reservation | null
  isFree: boolean
  freeUntil: string | null
}

interface UseTableAvailabilityReturn {
  tables: TableAvailability[]
  freeTables: TableAvailability[]
  occupiedTables: TableAvailability[]
}

export function useTableAvailability(
  reservations: Reservation[],
  currentTime: Date,
  tables: RestaurantTable[] = RESTAURANT_TABLES
): UseTableAvailabilityReturn {
  return useMemo(() => {
    const currentHH = String(currentTime.getHours()).padStart(2, "0")
    const currentMM = String(currentTime.getMinutes()).padStart(2, "0")
    const currentTimeStr = `${currentHH}:${currentMM}`

    const result: TableAvailability[] = tables.map((table) => {
      const currentReservation =
        reservations.find(
          (r) => r.status === "arrivee" && r.tableNumber === table.number
        ) ?? null

      const nextReservation =
        reservations
          .filter(
            (r) =>
              r.tableNumber === table.number &&
              r.time > currentTimeStr &&
              (r.status === "confirmee" || r.status === "en_attente")
          )
          .sort((a, b) => a.time.localeCompare(b.time))[0] ?? null

      const isFree = !currentReservation
      const freeUntil = nextReservation?.time ?? null

      return { table, currentReservation, nextReservation, isFree, freeUntil }
    })

    return {
      tables: result,
      freeTables: result.filter((t) => t.isFree),
      occupiedTables: result.filter((t) => !t.isFree),
    }
  }, [reservations, currentTime, tables])
}
