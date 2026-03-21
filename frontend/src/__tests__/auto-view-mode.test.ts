import { describe, it, expect } from "vitest"
import { getAutoViewMode } from "@/components/reservations/gantt/auto-view-mode"

describe("getAutoViewMode", () => {
  // midi: 660-930 (11:00-15:30)

  it("returns table when outside service window with no arrivees", () => {
    expect(getAutoViewMode(540, "midi", false)).toBe("table") // 9:00
  })

  it("returns gantt when within service window", () => {
    expect(getAutoViewMode(720, "midi", false)).toBe("gantt") // 12:00
  })

  it("returns gantt when within 30min buffer before service", () => {
    expect(getAutoViewMode(635, "midi", false)).toBe("gantt") // 10:35 (30min before 11:00)
  })

  it("returns gantt when outside window but has arrivees", () => {
    expect(getAutoViewMode(540, "midi", true)).toBe("gantt") // 9:00 but people arrived
  })

  it("returns table when outside soir window", () => {
    expect(getAutoViewMode(720, "soir", false)).toBe("table") // 12:00, soir starts 18:00
  })

  it("returns gantt during soir service", () => {
    expect(getAutoViewMode(1200, "soir", false)).toBe("gantt") // 20:00
  })
})
