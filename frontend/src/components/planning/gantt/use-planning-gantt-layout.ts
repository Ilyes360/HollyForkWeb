import { useMemo } from "react"
import type { DayOfWeek, Employee, Shift } from "../types"
import type {
  PlanningGanttBlock,
  PlanningGanttLayout,
  PlanningGanttRow,
} from "./gantt-types"
import { PLANNING_GANTT_TIME_RANGE, ROW_HEIGHT } from "./gantt-constants"

/** Convert "HH:MM" to minutes since midnight */
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/**
 * Compute the gantt layout for a set of shifts and employees.
 *
 * @param shifts - shifts to display (pre-filtered to the visible day(s))
 * @param employees - all employees (rows are created for those with at least one shift, or all if showAll)
 * @param pxPerMinute - pixels per minute (varies between semaine and jour views)
 * @param days - which day(s) to include (e.g. ["lundi"] for jour, all 7 for semaine)
 * @param showAllEmployees - if true, show rows even for employees with no shifts
 */
export function usePlanningGanttLayout(
  shifts: Shift[],
  employees: Employee[],
  pxPerMinute: number,
  days: DayOfWeek[],
  showAllEmployees = false
): PlanningGanttLayout {
  return useMemo(() => {
    const { startMinute, endMinute } = PLANNING_GANTT_TIME_RANGE
    const totalWidth = (endMinute - startMinute) * pxPerMinute

    // Determine which employees to show as rows
    const employeeIdsWithShifts = new Set(shifts.map((s) => s.employeeId))
    const visibleEmployees = showAllEmployees
      ? employees
      : employees.filter((e) => employeeIdsWithShifts.has(e.id))

    // Sort: by department then by last name
    const sorted = [...visibleEmployees].sort((a, b) => {
      if (a.department !== b.department)
        return a.department.localeCompare(b.department)
      return a.lastName.localeCompare(b.lastName)
    })

    const rows: PlanningGanttRow[] = sorted.map((employee, index) => {
      const employeeShifts = shifts.filter(
        (s) => s.employeeId === employee.id && days.includes(s.day)
      )

      const blocks: PlanningGanttBlock[] = employeeShifts.map((shift) => {
        const sm = timeToMinutes(shift.startTime)
        const em = timeToMinutes(shift.endTime)
        // Clamp to visible range
        const clampedStart = Math.max(sm, startMinute)
        const clampedEnd = Math.min(em, endMinute)
        const x = (clampedStart - startMinute) * pxPerMinute
        const width = Math.max((clampedEnd - clampedStart) * pxPerMinute, 2)

        return {
          shiftId: shift.id,
          employeeId: employee.id,
          day: shift.day,
          startMinute: sm,
          endMinute: em,
          x,
          width,
          department: employee.department,
          employee,
          shift,
        }
      })

      return {
        employee,
        y: index * ROW_HEIGHT,
        blocks,
      }
    })

    return {
      rows,
      totalWidth,
      totalHeight: rows.length * ROW_HEIGHT,
      startMinute,
      endMinute,
    }
  }, [shifts, employees, pxPerMinute, days, showAllEmployees])
}
