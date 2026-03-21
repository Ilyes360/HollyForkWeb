import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useGanttLayout } from "@/components/reservations/gantt/use-gantt-layout"
import type { Reservation, RestaurantTable, PipelineStageDefinition } from "@/components/reservations/types"

const TABLES: RestaurantTable[] = [
  { number: 1, label: "T1", seats: 4 },
  { number: 2, label: "T2", seats: 2 },
]

const STAGES: PipelineStageDefinition[] = [
  { id: "installe", label: "Installé", shortLabel: "Inst.", color: "text-blue-500", avgDurationMinutes: 0, order: 0 },
  { id: "commande", label: "Commande", shortLabel: "Cmd", color: "text-amber-500", avgDurationMinutes: 8, order: 1 },
  { id: "plat", label: "Plat", shortLabel: "Plat", color: "text-orange-500", avgDurationMinutes: 35, order: 2 },
  { id: "addition", label: "Addition", shortLabel: "Add.", color: "text-emerald-500", avgDurationMinutes: 65, order: 3 },
]

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "r1",
    clientName: "Test Client",
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

describe("useGanttLayout", () => {
  it("computes correct startMinute and endMinute for a confirmed reservation", () => {
    const resa = makeReservation({ estimatedDurationMinutes: 75 })
    const { result } = renderHook(() =>
      useGanttLayout([resa], TABLES, STAGES, "midi", "normal", 1)
    )
    const block = result.current.blocks[0]
    expect(block.startMinute).toBe(720) // 12:00
    expect(block.endMinute).toBe(795)   // 13:15
    expect(block.isEstimated).toBe(true)
  })

  it("uses DEFAULT_MEAL_DURATION when no estimatedDurationMinutes", () => {
    const resa = makeReservation({ estimatedDurationMinutes: undefined })
    const { result } = renderHook(() =>
      useGanttLayout([resa], TABLES, STAGES, "midi", "normal", 1)
    )
    const block = result.current.blocks[0]
    expect(block.endMinute).toBe(720 + 75) // DEFAULT_MEAL_DURATION.midi = 75
  })

  it("sets annulee blocks to 15min wide and not estimated", () => {
    const resa = makeReservation({ status: "annulee" })
    const { result } = renderHook(() =>
      useGanttLayout([resa], TABLES, STAGES, "midi", "normal", 1)
    )
    const block = result.current.blocks[0]
    expect(block.endMinute - block.startMinute).toBe(15)
    expect(block.isEstimated).toBe(false)
  })

  it("sets no_show blocks to 15min wide", () => {
    const resa = makeReservation({ status: "no_show" })
    const { result } = renderHook(() =>
      useGanttLayout([resa], TABLES, STAGES, "midi", "normal", 1)
    )
    const block = result.current.blocks[0]
    expect(block.endMinute - block.startMinute).toBe(15)
    expect(block.isEstimated).toBe(false)
  })

  it("expands timeRange if reservation is outside default service range", () => {
    const resa = makeReservation({ time: "10:30" }) // before midi default (11:00)
    const { result } = renderHook(() =>
      useGanttLayout([resa], TABLES, STAGES, "midi", "normal", 1)
    )
    expect(result.current.timeRange.startMinute).toBeLessThanOrEqual(630) // 10:30
  })

  it("scales x and width correctly with zoom", () => {
    const resa = makeReservation({ time: "12:00", estimatedDurationMinutes: 60 })
    const { result: r1 } = renderHook(() =>
      useGanttLayout([resa], TABLES, STAGES, "midi", "normal", 1)
    )
    const { result: r2 } = renderHook(() =>
      useGanttLayout([resa], TABLES, STAGES, "midi", "normal", 2)
    )
    expect(r2.current.blocks[0].x).toBe(r1.current.blocks[0].x * 2)
    expect(r2.current.blocks[0].width).toBeGreaterThanOrEqual(r1.current.blocks[0].width * 2 - 1)
  })

  it("computes pipelineProgress for arrivee with pipeline", () => {
    const resa = makeReservation({
      status: "arrivee",
      pipeline: {
        currentStageId: "plat",
        history: [
          { stageId: "installe", enteredAt: "2026-03-21T12:00:00" },
          { stageId: "commande", enteredAt: "2026-03-21T12:08:00" },
          { stageId: "plat", enteredAt: "2026-03-21T12:30:00" },
        ],
      },
    })
    const { result } = renderHook(() =>
      useGanttLayout([resa], TABLES, STAGES, "midi", "normal", 1)
    )
    expect(result.current.blocks[0].pipelineProgress).toBe(3 / 4) // stage index 2+1 / 4 stages
  })

  it("creates virtual row for unassigned tables", () => {
    const resa = makeReservation({ tableNumber: null })
    const { result } = renderHook(() =>
      useGanttLayout([resa], TABLES, STAGES, "midi", "normal", 1)
    )
    const lastRow = result.current.rows[result.current.rows.length - 1]
    expect(lastRow.table.number).toBe(-1)
    expect(lastRow.table.label).toBe("?")
    expect(lastRow.blocks.length).toBe(1)
  })

  it("computes departureWindow that narrows with progress", () => {
    const resaNoProgress = makeReservation({
      status: "confirmee",
      estimatedDurationMinutes: 75,
    })
    const { result: r1 } = renderHook(() =>
      useGanttLayout([resaNoProgress], TABLES, STAGES, "midi", "normal", 1)
    )
    // At 0% progress, window should be wide (~±15min)
    const w1 = r1.current.blocks[0].departureWindow!
    expect(w1.lateMinute - w1.earlyMinute).toBeGreaterThanOrEqual(20)

    const resaHighProgress = makeReservation({
      status: "arrivee",
      estimatedDurationMinutes: 75,
      pipeline: {
        currentStageId: "addition",
        history: [
          { stageId: "installe", enteredAt: "2026-03-21T12:00:00" },
          { stageId: "commande", enteredAt: "2026-03-21T12:08:00" },
          { stageId: "plat", enteredAt: "2026-03-21T12:30:00" },
          { stageId: "addition", enteredAt: "2026-03-21T12:50:00" },
        ],
      },
    })
    const { result: r2 } = renderHook(() =>
      useGanttLayout([resaHighProgress], TABLES, STAGES, "midi", "normal", 1)
    )
    // At 100% progress (4/4), window should be very narrow
    const w2 = r2.current.blocks[0].departureWindow!
    expect(w2.lateMinute - w2.earlyMinute).toBeLessThanOrEqual(5)
  })
})
