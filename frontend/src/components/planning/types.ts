export type DayOfWeek =
  | "lundi"
  | "mardi"
  | "mercredi"
  | "jeudi"
  | "vendredi"
  | "samedi"
  | "dimanche"

export type ServiceType = "midi" | "soir"

export type DropServiceType = "midi" | "soir" | "journee"

export type Department =
  | "salle"
  | "cuisine"
  | "bar"
  | "administration"
  | "plonge"

export interface Employee {
  id: string
  firstName: string
  lastName: string
  role: string
  department: Department
  contractHours: number
  avatarColor: string
}

export interface Shift {
  id: string
  employeeId: string
  day: DayOfWeek
  service: ServiceType
  startTime: string
  endTime: string
  isFullDay: boolean
}

export interface ServiceConfig {
  midi: { start: string; end: string }
  soir: { start: string; end: string }
  journee: { start: string; end: string }
}

export interface StaffingRequirement {
  [key: string]: { midi: number; soir: number }
}

export type PlanningViewMode = "grille" | "gantt"
