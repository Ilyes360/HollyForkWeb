import type { ApiReservation } from "@/hooks/use-reservations"
import type { Reservation, ServiceType } from "./types"

/**
 * Maps a backend ApiReservation to the frontend Reservation domain type.
 *
 * - Splits datetime "2026-05-16T12:00:00" → date "2026-05-16" + time "12:00"
 * - Infers service from hour: < 16 = "midi", >= 16 = "soir"
 * - Resolves table PK → display number via tables lookup
 * - Defaults status to "confirmee" (backend does not persist status yet)
 * - Defaults canal to "telephone" (backend does not persist canal yet)
 */
export function mapApiReservation(
  api: ApiReservation,
  tables: { id: number; numero: number }[]
): Reservation {
  const dt = api.datetime ?? ""
  const date = dt.slice(0, 10) // "YYYY-MM-DD"
  const time = dt.slice(11, 16) // "HH:MM"
  const hour = parseInt(time.split(":")[0] ?? "12", 10)
  const service: ServiceType = hour < 16 ? "midi" : "soir"

  const tableId = api.tableId ?? null
  const matchedTable =
    tableId !== null ? tables.find((t) => t.id === tableId) : null
  const tableNumber = matchedTable ? matchedTable.numero : null

  return {
    id: String(api.id),
    clientName: api.clientName ?? "",
    clientPhone: api.phoneNumber ?? "",
    clientEmail: undefined,
    date,
    time,
    service,
    covers: api.partySize ?? 0,
    tableId,
    tableNumber,
    canal: "telephone",
    status: "confirmee",
    notes: api.noteServeur ?? api.noteClient ?? "",
    allergies: (api.allergies ?? []).map((a) => ({
      id: a.id,
      code: a.code,
      label: a.label,
    })),
    dietTypes: (api.dietTypes ?? []).map((d) => ({
      id: d.id,
      code: d.code,
      label: d.label,
    })),
    createdAt: "",
  }
}
