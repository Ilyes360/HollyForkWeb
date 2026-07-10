import type { Department, DayOfWeek, Employee, Shift } from "../types"

/** Sub-view inside the gantt: week overview or single day expanded */
export type PlanningGanttViewMode = "semaine" | "jour"

/** View mode at the page level: grid (existing) or gantt (new) */
export type PlanningViewMode = "grille" | "gantt"

/** A shift block positioned on the gantt timeline */
export interface PlanningGanttBlock {
  shiftId: string
  employeeId: string
  day: DayOfWeek
  startMinute: number
  endMinute: number
  /** Pixel offset from left edge of the time area */
  x: number
  /** Pixel width of the block */
  width: number
  department: Department
  employee: Employee
  shift: Shift
}

/** One row in the gantt = one employee */
export interface PlanningGanttRow {
  employee: Employee
  /** Pixel offset from top of the gantt body */
  y: number
  /** Blocks for this employee (filtered to the visible day(s)) */
  blocks: PlanningGanttBlock[]
}

/** Complete layout computation result */
export interface PlanningGanttLayout {
  rows: PlanningGanttRow[]
  totalWidth: number
  totalHeight: number
  startMinute: number
  endMinute: number
}
