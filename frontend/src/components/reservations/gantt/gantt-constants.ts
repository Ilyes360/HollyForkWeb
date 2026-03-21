import type { ReservationStatus } from "../types"

export type GanttDensity = "normal" | "compact" | "ultra"

export interface GanttDensityConfig {
  rowHeight: number
  blockPadding: number
  fontSize: number
  showClientName: boolean
  showCovers: boolean
  showPipeline: boolean
  minBlockWidth: number
}

export const GANTT_DENSITY_CONFIG: Record<GanttDensity, GanttDensityConfig> = {
  normal: {
    rowHeight: 56,
    blockPadding: 4,
    fontSize: 13,
    showClientName: true,
    showCovers: true,
    showPipeline: true,
    minBlockWidth: 80,
  },
  compact: {
    rowHeight: 28,
    blockPadding: 2,
    fontSize: 11,
    showClientName: false,
    showCovers: true,
    showPipeline: true,
    minBlockWidth: 40,
  },
  ultra: {
    rowHeight: 16,
    blockPadding: 1,
    fontSize: 0,
    showClientName: false,
    showCovers: false,
    showPipeline: false,
    minBlockWidth: 20,
  },
}

export const TIME_SLOT_MINUTES = 15
export const PIXELS_PER_MINUTE = 4
export const ZOOM_RANGE = { min: 0.5, max: 3 }
export const TABLE_LABEL_WIDTH = 64
export const HEADER_HEIGHT = 40

export const SERVICE_TIME_RANGES = {
  midi: { startMinute: 660, endMinute: 930 },   // 11:00–15:30
  soir: { startMinute: 1080, endMinute: 1410 },  // 18:00–23:30
}

export const DEFAULT_MEAL_DURATION = { midi: 75, soir: 105 }

export const GANTT_STATUS_COLORS: Record<
  ReservationStatus,
  { bg: string; border: string; text: string; bar: string }
> = {
  confirmee: { bg: "bg-blue-500/10", border: "border-blue-500", text: "text-blue-700 dark:text-blue-300", bar: "bg-blue-500" },
  en_attente: { bg: "bg-amber-500/10", border: "border-amber-500", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-500" },
  arrivee: { bg: "bg-emerald-500/10", border: "border-emerald-500", text: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500" },
  annulee: { bg: "bg-red-500/10", border: "border-red-500", text: "text-red-700 dark:text-red-300", bar: "bg-red-500" },
  no_show: { bg: "bg-red-500/10", border: "border-red-500", text: "text-red-700 dark:text-red-300", bar: "bg-red-500" },
}
