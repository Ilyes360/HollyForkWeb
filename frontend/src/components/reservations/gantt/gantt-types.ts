import type { Reservation, RestaurantTable, ServiceType } from "../types"

export interface DepartureWindow {
  earlyMinute: number   // début fenêtre (optimiste)
  lateMinute: number    // fin fenêtre (pessimiste)
  label: string         // "13:15–13:30" ou "Table libre"
}

export interface GanttBlock {
  reservationId: string
  tableNumber: number
  startMinute: number
  endMinute: number
  isEstimated: boolean
  x: number
  width: number
  pipelineProgress: number  // 0–1
  departureWindow: DepartureWindow | null
  reservation: Reservation
}

export interface GanttLayout {
  blocks: GanttBlock[]
  timeRange: { startMinute: number; endMinute: number }
  totalWidth: number
  totalHeight: number
  rows: { table: RestaurantTable; y: number; blocks: GanttBlock[] }[]
}

export interface GanttTimelineProps {
  reservations: Reservation[]
  service: ServiceType
  onServiceChange: (service: ServiceType) => void
  onSelectReservation: (r: Reservation) => void
  onNewReservation: (prefill: { tableNumber: number; time: string }) => void
  onReschedule: (reservationId: string, newTime: string) => void
  onDurationChange: (reservationId: string, newDurationMinutes: number) => void
  selectedReservationId: string | null
}

export type ResizeSide = "left" | "right"
