import { describe, it, expect } from "vitest"
import { mapApiReservation } from "@/components/reservations/mapping"
import type { ApiReservation } from "@/hooks/use-reservations"

const tables = [
  { id: 10, numero: 1 },
  { id: 20, numero: 5 },
  { id: 30, numero: 12 },
]

function makeApi(overrides: Partial<ApiReservation> = {}): ApiReservation {
  return {
    id: 1,
    clientName: "Jean Dupont",
    partySize: 4,
    datetime: "2026-07-21T12:30:00",
    phoneNumber: "+33612345678",
    salleId: 1,
    tableId: 10,
    noteServeur: null,
    noteClient: null,
    allergie: null,
    ...overrides,
  }
}

describe("mapApiReservation", () => {
  // ── Datetime splitting ──

  it("splits datetime into date and time", () => {
    const r = mapApiReservation(makeApi(), tables)
    expect(r.date).toBe("2026-07-21")
    expect(r.time).toBe("12:30")
  })

  it("handles midnight datetime", () => {
    const r = mapApiReservation(
      makeApi({ datetime: "2026-12-31T00:00:00" }),
      tables
    )
    expect(r.date).toBe("2026-12-31")
    expect(r.time).toBe("00:00")
  })

  it("handles empty datetime gracefully", () => {
    const r = mapApiReservation(
      makeApi({ datetime: undefined as unknown as string }),
      tables
    )
    expect(r.date).toBe("")
    expect(r.time).toBe("")
  })

  // ── Service inference ──

  it("infers midi for hours before 16:00", () => {
    expect(
      mapApiReservation(makeApi({ datetime: "2026-07-21T11:00:00" }), tables)
        .service
    ).toBe("midi")
    expect(
      mapApiReservation(makeApi({ datetime: "2026-07-21T15:59:00" }), tables)
        .service
    ).toBe("midi")
  })

  it("infers soir for hours 16:00 and after", () => {
    expect(
      mapApiReservation(makeApi({ datetime: "2026-07-21T16:00:00" }), tables)
        .service
    ).toBe("soir")
    expect(
      mapApiReservation(makeApi({ datetime: "2026-07-21T20:30:00" }), tables)
        .service
    ).toBe("soir")
  })

  it("boundary: 14:30 is midi", () => {
    const r = mapApiReservation(
      makeApi({ datetime: "2026-07-21T14:30:00" }),
      tables
    )
    expect(r.service).toBe("midi")
  })

  // ── Table resolution ──

  it("resolves table PK to display number", () => {
    const r = mapApiReservation(makeApi({ tableId: 20 }), tables)
    expect(r.tableId).toBe(20)
    expect(r.tableNumber).toBe(5)
  })

  it("returns null tableNumber when table not found", () => {
    const r = mapApiReservation(makeApi({ tableId: 999 }), tables)
    expect(r.tableId).toBe(999)
    expect(r.tableNumber).toBeNull()
  })

  it("returns null tableNumber when tableId is null", () => {
    const r = mapApiReservation(makeApi({ tableId: null }), tables)
    expect(r.tableId).toBeNull()
    expect(r.tableNumber).toBeNull()
  })

  it("works with empty tables array", () => {
    const r = mapApiReservation(makeApi({ tableId: 10 }), [])
    expect(r.tableNumber).toBeNull()
  })

  // ── Field mapping ──

  it("converts id to string", () => {
    expect(mapApiReservation(makeApi({ id: 42 }), tables).id).toBe("42")
  })

  it("maps partySize to covers", () => {
    expect(mapApiReservation(makeApi({ partySize: 8 }), tables).covers).toBe(8)
  })

  it("prefers noteServeur over noteClient", () => {
    const r = mapApiReservation(
      makeApi({ noteServeur: "Serveur note", noteClient: "Client note" }),
      tables
    )
    expect(r.notes).toBe("Serveur note")
  })

  it("falls back to noteClient when noteServeur is null", () => {
    const r = mapApiReservation(
      makeApi({ noteServeur: null, noteClient: "Client note" }),
      tables
    )
    expect(r.notes).toBe("Client note")
  })

  it("returns empty notes when both are null", () => {
    const r = mapApiReservation(
      makeApi({ noteServeur: null, noteClient: null }),
      tables
    )
    expect(r.notes).toBe("")
  })

  // ── Defaults for non-persisted fields ──

  it("defaults status to confirmee (not persisted by backend)", () => {
    expect(mapApiReservation(makeApi(), tables).status).toBe("confirmee")
  })

  it("defaults canal to telephone (not persisted by backend)", () => {
    expect(mapApiReservation(makeApi(), tables).canal).toBe("telephone")
  })

  // ── Allergies and diet types ──

  it("maps allergies array", () => {
    const r = mapApiReservation(
      makeApi({
        allergies: [{ id: 1, code: "arachides", label: "Arachides" }],
      }),
      tables
    )
    expect(r.allergies).toEqual([
      { id: 1, code: "arachides", label: "Arachides" },
    ])
  })

  it("returns empty arrays when allergies/dietTypes are undefined", () => {
    const r = mapApiReservation(makeApi(), tables)
    expect(r.allergies).toEqual([])
    expect(r.dietTypes).toEqual([])
  })
})
