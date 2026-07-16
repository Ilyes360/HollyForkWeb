import type { DayOfWeek, Shift, Employee, PlanningCostConfig } from "./types"
import { DAYS } from "./constants"

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

export function calculateHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(":").map(Number)
  const [endH, endM] = endTime.split(":").map(Number)
  let hours = endH - startH + (endM - startM) / 60
  if (hours < 0) hours += 24 // overnight shift
  return hours
}

export function getWeeklyHours(shifts: Shift[], employeeId: string): number {
  return shifts
    .filter((s) => s.employeeId === employeeId)
    .reduce((total, s) => total + calculateHours(s.startTime, s.endTime), 0)
}

export function getShiftsForDayAndService(
  shifts: Shift[],
  day: DayOfWeek,
  service: "midi" | "soir"
): Shift[] {
  return shifts.filter((s) => s.day === day && s.service === service)
}

export function getEmployeeById(
  employees: Employee[],
  id: string
): Employee | undefined {
  return employees.find((e) => e.id === id)
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6)
  const startLabel = monday.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })
  const endLabel = sunday.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })
  return `${startLabel} — ${endLabel}`
}

export function getDayDate(monday: Date, day: DayOfWeek): Date {
  const index = DAYS.indexOf(day)
  return addDays(monday, index)
}

export function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

export function isPast(date: Date): boolean {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime() < now.getTime()
}

export interface DayRecapData {
  totalHours: number
  uniqueEmployees: number
  overtimeHours: number
  estimatedCost: number
  coverageCurrent: number
  coverageRequired: number
}

export function getDayRecap(
  midiShifts: Shift[],
  soirShifts: Shift[],
  requiredMidi: number,
  requiredSoir: number,
  costConfig: PlanningCostConfig
): DayRecapData {
  const allShifts = [...midiShifts, ...soirShifts]
  const totalHours = allShifts.reduce(
    (sum, s) => sum + calculateHours(s.startTime, s.endTime),
    0
  )

  const employeeIds = new Set(allShifts.map((s) => s.employeeId))
  const uniqueEmployees = employeeIds.size

  // Calculate overtime: per employee, hours above threshold
  let overtimeHours = 0
  for (const empId of employeeIds) {
    const empShifts = allShifts.filter((s) => s.employeeId === empId)
    const empHours = empShifts.reduce(
      (sum, s) => sum + calculateHours(s.startTime, s.endTime),
      0
    )
    if (empHours > costConfig.dailyOvertimeThreshold) {
      overtimeHours += empHours - costConfig.dailyOvertimeThreshold
    }
  }

  const normalHours = totalHours - overtimeHours
  const estimatedCost = Math.round(
    normalHours * costConfig.hourlyRate +
      overtimeHours * costConfig.hourlyRate * costConfig.overtimeMultiplier
  )

  const coverageCurrent = midiShifts.length + soirShifts.length
  const coverageRequired = requiredMidi + requiredSoir

  return {
    totalHours,
    uniqueEmployees,
    overtimeHours,
    estimatedCost,
    coverageCurrent,
    coverageRequired,
  }
}
