import type { ServiceConfig, PlanningConfig } from "./types"

export const serviceConfig: ServiceConfig = {
  midi: { start: "10:00", end: "15:00" },
  soir: { start: "18:00", end: "23:00" },
  journee: { start: "10:00", end: "23:00" },
}

/**
 * Default planning config — used as fallback until the backend provides
 * per-restaurant staffing requirements and cost parameters.
 */
export const DEFAULT_PLANNING_CONFIG: PlanningConfig = {
  staffingRequirements: {
    lundi: { midi: 3, soir: 3 },
    mardi: { midi: 3, soir: 3 },
    mercredi: { midi: 3, soir: 3 },
    jeudi: { midi: 3, soir: 3 },
    vendredi: { midi: 4, soir: 4 },
    samedi: { midi: 4, soir: 5 },
    dimanche: { midi: 0, soir: 0 },
  },
  cost: {
    dailyBudget: 400,
    hourlyRate: 12,
    overtimeMultiplier: 1.25,
    dailyOvertimeThreshold: 7,
  },
}
