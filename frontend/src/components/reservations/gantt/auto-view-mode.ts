import type { ServiceType } from "../types"
import { SERVICE_TIME_RANGES } from "./gantt-constants"

/**
 * Determines if gantt view should be the default based on current time and service.
 * Returns "gantt" during service window (±30min), "table" otherwise.
 */
export function getAutoViewMode(
  currentMinutes: number,
  service: ServiceType,
  hasArrivees: boolean
): "table" | "gantt" {
  const range = SERVICE_TIME_RANGES[service]
  const bufferMinutes = 30

  // Within service window (with 30min buffer before)
  if (currentMinutes >= range.startMinute - bufferMinutes && currentMinutes <= range.endMinute) {
    return "gantt"
  }

  // Client already arrived = service is active regardless of clock
  if (hasArrivees) {
    return "gantt"
  }

  return "table"
}
