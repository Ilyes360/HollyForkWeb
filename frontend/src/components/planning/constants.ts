import type { DayOfWeek, Department, DropServiceType } from "./types"

export const DAYS: DayOfWeek[] = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
}

export const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
}

export const SERVICE_LABELS: Record<DropServiceType, string> = {
  midi: "Midi",
  soir: "Soir",
  journee: "Journée",
}

export const DEPARTMENT_LABELS: Record<Department, string> = {
  salle: "Salle",
  cuisine: "Cuisine",
  bar: "Bar",
  administration: "Administration",
  plonge: "Plonge",
}

export const DEPARTMENT_COLORS: Record<Department, string> = {
  salle: "bg-blue-500",
  cuisine: "bg-orange-500",
  bar: "bg-purple-500",
  administration: "bg-gray-500",
  plonge: "bg-teal-500",
}
