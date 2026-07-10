import type { ServiceConfig, StaffingRequirement } from "./types"

export const serviceConfig: ServiceConfig = {
  midi: { start: "10:00", end: "15:00" },
  soir: { start: "18:00", end: "23:00" },
  journee: { start: "10:00", end: "23:00" },
}

export const DAILY_BUDGET = 400 // €/jour cible

// Restaurant fermé le dimanche (openingDays dans admin-mock-data)
export const staffingRequirements: StaffingRequirement = {
  lundi: { midi: 3, soir: 3 },
  mardi: { midi: 3, soir: 3 },
  mercredi: { midi: 3, soir: 3 },
  jeudi: { midi: 3, soir: 3 },
  vendredi: { midi: 4, soir: 4 },
  samedi: { midi: 4, soir: 5 },
}
