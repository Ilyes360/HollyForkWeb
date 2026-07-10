import { useMemo } from "react"
import type {
  Reservation,
  RestaurantTable,
  ServiceType,
  PipelineStageDefinition,
} from "../types"
import type { GanttBlock, GanttLayout, DepartureWindow } from "./gantt-types"
import type { GanttDensity } from "./gantt-constants"
import {
  SERVICE_TIME_RANGES,
  DEFAULT_MEAL_DURATION,
  PIXELS_PER_MINUTE,
  GANTT_DENSITY_CONFIG,
} from "./gantt-constants"

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Round minutes to nearest 5-minute increment */
function roundTo5(min: number): number {
  return Math.round(min / 5) * 5
}

/**
 * Compute departure window based on progress.
 * Uncertainty starts at ±15min and narrows as progress increases.
 * At 100% or terminal status → null (table libre / no window needed).
 */
function computeDepartureWindow(
  estimatedEndMinute: number,
  progress: number,
  isTerminal: boolean
): DepartureWindow | null {
  if (isTerminal) return null

  // Uncertainty shrinks linearly: ±15min at 0% → ±0min at 100%
  const maxUncertainty = 15
  const uncertainty = maxUncertainty * (1 - progress)

  // Round to 5min for clean display
  const halfWidth = roundTo5(uncertainty)

  if (halfWidth === 0) {
    // Very close to done, show single time
    const t = roundTo5(estimatedEndMinute)
    return { earlyMinute: t, lateMinute: t, label: `~${minutesToTime(t)}` }
  }

  const early = roundTo5(estimatedEndMinute - halfWidth)
  const late = roundTo5(estimatedEndMinute + halfWidth)

  return {
    earlyMinute: early,
    lateMinute: late,
    label: `${minutesToTime(early)}–${minutesToTime(late)}`,
  }
}

export function useGanttLayout(
  reservations: Reservation[],
  tables: RestaurantTable[],
  pipelineStages: PipelineStageDefinition[],
  service: ServiceType,
  density: GanttDensity,
  zoom: number
): GanttLayout {
  return useMemo(() => {
    const config = GANTT_DENSITY_CONFIG[density]
    const defaultRange = SERVICE_TIME_RANGES[service]

    // Compute start/end minute for each reservation
    const resaData = reservations.map((r) => {
      const startMinute = timeToMinutes(r.time)
      let endMinute: number
      let isEstimated = true

      if (r.status === "annulee" || r.status === "no_show") {
        endMinute = startMinute + 15
        isEstimated = false
      } else if (
        r.status === "arrivee" &&
        r.pipeline &&
        pipelineStages.length > 0
      ) {
        const currentIdx = pipelineStages.findIndex(
          (s) => s.id === r.pipeline!.currentStageId
        )
        if (currentIdx >= 0 && currentIdx < pipelineStages.length - 1) {
          const lastStageAvg =
            pipelineStages[pipelineStages.length - 1].avgDurationMinutes
          endMinute = startMinute + lastStageAvg + 10
        } else if (currentIdx === pipelineStages.length - 1) {
          endMinute =
            startMinute +
            (r.estimatedDurationMinutes ?? DEFAULT_MEAL_DURATION[service])
        } else {
          endMinute =
            startMinute +
            (r.estimatedDurationMinutes ?? DEFAULT_MEAL_DURATION[service])
        }
        isEstimated = true
      } else {
        endMinute =
          startMinute +
          (r.estimatedDurationMinutes ?? DEFAULT_MEAL_DURATION[service])
        isEstimated = true
      }

      // Pipeline progress (0–1)
      let pipelineProgress = 0
      if (r.pipeline && pipelineStages.length > 0) {
        const currentIdx = pipelineStages.findIndex(
          (s) => s.id === r.pipeline!.currentStageId
        )
        if (currentIdx >= 0) {
          pipelineProgress = (currentIdx + 1) / pipelineStages.length
        }
      }

      // Departure window
      const isTerminal = r.status === "annulee" || r.status === "no_show"
      const departureWindow = computeDepartureWindow(
        endMinute,
        pipelineProgress,
        isTerminal
      )

      return {
        reservation: r,
        startMinute,
        endMinute,
        isEstimated,
        pipelineProgress,
        departureWindow,
      }
    })

    // Time range: expand if reservations fall outside default range
    let startMinute = defaultRange.startMinute
    let endMinute = defaultRange.endMinute
    for (const rd of resaData) {
      if (rd.startMinute < startMinute) startMinute = rd.startMinute - 15
      if (rd.endMinute > endMinute) endMinute = rd.endMinute + 15
    }

    // Build blocks
    const blocks: GanttBlock[] = resaData.map((rd) => {
      const x = (rd.startMinute - startMinute) * PIXELS_PER_MINUTE * zoom
      const rawWidth =
        (rd.endMinute - rd.startMinute) * PIXELS_PER_MINUTE * zoom
      const width = Math.max(rawWidth, config.minBlockWidth)

      return {
        reservationId: rd.reservation.id,
        tableNumber: rd.reservation.tableNumber ?? -1,
        startMinute: rd.startMinute,
        endMinute: rd.endMinute,
        isEstimated: rd.isEstimated,
        x,
        width,
        pipelineProgress: rd.pipelineProgress,
        departureWindow: rd.departureWindow,
        reservation: rd.reservation,
      }
    })

    // Build rows
    const sortedTables = [...tables].sort((a, b) => a.number - b.number)
    const hasUnassigned = blocks.some((b) => b.tableNumber === -1)

    const rows = sortedTables.map((table, index) => ({
      table,
      y: index * config.rowHeight,
      blocks: blocks.filter((b) => b.tableNumber === table.number),
    }))

    if (hasUnassigned) {
      rows.push({
        table: { id: -1, number: -1, label: "?", seats: 0 },
        y: rows.length * config.rowHeight,
        blocks: blocks.filter((b) => b.tableNumber === -1),
      })
    }

    const totalWidth = (endMinute - startMinute) * PIXELS_PER_MINUTE * zoom
    const totalHeight = rows.length * config.rowHeight

    return {
      blocks,
      timeRange: { startMinute, endMinute },
      totalWidth,
      totalHeight,
      rows,
    }
  }, [reservations, tables, pipelineStages, service, density, zoom])
}
