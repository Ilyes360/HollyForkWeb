import type { Establishment, Employee } from "./types"

export function getEmployeeCount(employees: Employee[], establishmentId: string): number {
  return employees.filter((e) => e.establishmentId === establishmentId).length
}

export function formatAddress(establishment: Establishment): string {
  if (!establishment.address) return "—"
  const { city, postalCode } = establishment.address
  if (city && postalCode) return `${postalCode} ${city}`
  return establishment.address.fullAddress || "—"
}

export function formatServiceTime(startTime: string, endTime: string): string {
  const fmt = (t: string) => t.replace(":00", "h").replace(":", "h")
  return `${fmt(startTime)}-${fmt(endTime)}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
