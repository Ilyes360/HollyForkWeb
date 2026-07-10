import type { Department } from "../types"

/** Time range displayed on the gantt (09:00 → 23:30) */
export const PLANNING_GANTT_TIME_RANGE = {
  startMinute: 540, // 09:00
  endMinute: 1410, // 23:30
} as const

/** Minutes span of the visible time range */
export const PLANNING_GANTT_SPAN =
  PLANNING_GANTT_TIME_RANGE.endMinute - PLANNING_GANTT_TIME_RANGE.startMinute // 870

/** Pixels per minute in Jour (expanded) view — gives ~3480px total width (scrollable) */
export const PX_PER_MINUTE_DAY = 4

/** Employee row height in pixels — matches reservations gantt normal density */
export const ROW_HEIGHT = 56

/** Height of the time header row — matches reservations gantt */
export const HEADER_HEIGHT = 40

/** Width of the sticky employee label column */
export const EMPLOYEE_LABEL_WIDTH = 140

/** Grid lines interval in minutes */
export const TIME_SLOT_MINUTES = 30

/** Minimum shift duration in minutes (for resize) */
export const MIN_SHIFT_DURATION = 30

/** Snap interval for drag/resize in minutes */
export const SNAP_MINUTES = 15

/** Department colors for gantt blocks — uses /10 opacity to match reservations style */
export const DEPARTMENT_GANTT_COLORS: Record<
  Department,
  { bg: string; border: string; text: string }
> = {
  salle: {
    bg: "bg-blue-500/10",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
  },
  cuisine: {
    bg: "bg-orange-500/10",
    border: "border-orange-500",
    text: "text-orange-700 dark:text-orange-300",
  },
  bar: {
    bg: "bg-purple-500/10",
    border: "border-purple-500",
    text: "text-purple-700 dark:text-purple-300",
  },
  administration: {
    bg: "bg-gray-500/10",
    border: "border-gray-500",
    text: "text-gray-700 dark:text-gray-300",
  },
  plonge: {
    bg: "bg-teal-500/10",
    border: "border-teal-500",
    text: "text-teal-700 dark:text-teal-300",
  },
}
