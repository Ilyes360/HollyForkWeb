import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useTableAvailability } from "@/hooks/use-table-availability"
import type { Reservation, RestaurantTable } from "@/components/reservations/types"

const TABLES: RestaurantTable[] = [
  { number: 1, label: "T1", seats: 4 },
  { number: 2, label: "T2", seats: 2 },
]

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "r1",
    clientName: "Test",
    clientPhone: "0600000000",
    date: "2026-03-21",
    time: "12:00",
    service: "midi",
    covers: 2,
    tableNumber: 1,
    canal: "site",
    status: "confirmee",
    notes: "",
    createdAt: "2026-03-21T10:00:00",
    ...overrides,
  }
}

describe("useTableAvailability", () => {
  it("marks table as free when no reservations", () => {
    const now = new Date("2026-03-21T12:00:00")
    const { result } = renderHook(() => useTableAvailability([], now, TABLES))
    expect(result.current.freeTables.length).toBe(2)
    expect(result.current.occupiedTables.length).toBe(0)
  })

  it("marks table as occupied when arrivee reservation exists", () => {
    const resa = makeReservation({ status: "arrivee", tableNumber: 1 })
    const now = new Date("2026-03-21T12:30:00")
    const { result } = renderHook(() => useTableAvailability([resa], now, TABLES))

    const t1 = result.current.tables.find(t => t.table.number === 1)!
    expect(t1.isFree).toBe(false)
    expect(t1.currentReservation?.id).toBe("r1")
  })

  it("marks table with annulee reservation as free", () => {
    const resa = makeReservation({ status: "annulee", tableNumber: 1 })
    const now = new Date("2026-03-21T12:30:00")
    const { result } = renderHook(() => useTableAvailability([resa], now, TABLES))

    const t1 = result.current.tables.find(t => t.table.number === 1)!
    expect(t1.isFree).toBe(true)
  })

  it("finds next reservation for a free table", () => {
    const resa = makeReservation({
      status: "confirmee",
      tableNumber: 1,
      time: "13:00"
    })
    const now = new Date("2026-03-21T12:00:00")
    const { result } = renderHook(() => useTableAvailability([resa], now, TABLES))

    const t1 = result.current.tables.find(t => t.table.number === 1)!
    expect(t1.isFree).toBe(true)
    expect(t1.freeUntil).toBe("13:00")
  })

  it("ignores past reservations for nextReservation", () => {
    const resa = makeReservation({
      status: "confirmee",
      tableNumber: 1,
      time: "11:00"
    })
    const now = new Date("2026-03-21T12:00:00")
    const { result } = renderHook(() => useTableAvailability([resa], now, TABLES))

    const t1 = result.current.tables.find(t => t.table.number === 1)!
    expect(t1.nextReservation).toBeNull()
  })
})
