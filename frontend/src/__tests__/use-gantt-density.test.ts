import { describe, it, expect } from "vitest"
import { computeAutoDensity } from "@/components/reservations/gantt/use-gantt-density"

describe("computeAutoDensity", () => {
  // HEADER_HEIGHT = 40
  // normal rowHeight = 56, compact = 28, ultra = 16

  it("returns normal when tables fit at 56px each", () => {
    // 10 tables: need 10*56 = 560px. Available = 700-40 = 660 → fits
    expect(computeAutoDensity(700, 10)).toBe("normal")
  })

  it("returns compact when too many tables for normal", () => {
    // 20 tables: need 20*56 = 1120 > 660. But 20*28 = 560 < 660 → compact
    expect(computeAutoDensity(700, 20)).toBe("compact")
  })

  it("returns ultra when too many tables for compact", () => {
    // 50 tables: need 50*28 = 1400 > 660. 50*16 = 800 > 660 → ultra
    expect(computeAutoDensity(700, 50)).toBe("ultra")
  })

  it("returns normal for few tables in small container", () => {
    // 3 tables, 240px: available = 200, need 3*56 = 168 → fits
    expect(computeAutoDensity(240, 3)).toBe("normal")
  })
})
