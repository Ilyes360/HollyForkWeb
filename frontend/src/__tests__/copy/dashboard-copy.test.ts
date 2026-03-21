import { describe, it, expect } from "vitest"
import { getGreeting, getDashboardKpiInsight } from "@/lib/copy/dashboard"

describe("getGreeting", () => {
  it("returns Bonjour before noon", () => {
    const result = getGreeting(9, "Marie")
    expect(result.title).toBe("Bonjour Marie")
  })

  it("returns Bon apres-midi in the afternoon", () => {
    const result = getGreeting(15, "Marie")
    expect(result.title).toBe("Bon apres-midi Marie")
  })

  it("returns Bonsoir in the evening", () => {
    const result = getGreeting(20, "Marie")
    expect(result.title).toBe("Bonsoir Marie")
  })

  it("works without firstName", () => {
    const result = getGreeting(9, null)
    expect(result.title).toBe("Bonjour")
  })

  it("returns fallback subtitle without data", () => {
    const result = getGreeting(10, "Marie")
    expect(result.subtitle).toBe("Pilote ta journee, tout est la.")
  })

  it("returns midi prep subtitle (9-11h) with data", () => {
    const result = getGreeting(10, "Marie", { reservationCount: 12, covers: 30 })
    expect(result.subtitle).toContain("Le midi se prepare")
    expect(result.subtitle).toContain("12 resas")
    expect(result.subtitle).toContain("30 couverts")
  })

  it("returns service en cours subtitle (11-15h)", () => {
    const result = getGreeting(12, "Marie", { activeTables: 8 })
    expect(result.subtitle).toContain("Service en cours")
    expect(result.subtitle).toContain("8 tables actives")
  })

  it("returns entre les services subtitle (15-18h)", () => {
    const result = getGreeting(16, "Marie", { covers: 45, eveningReservations: 10, eveningBusy: true })
    expect(result.subtitle).toContain("Le midi est boucle")
    expect(result.subtitle).toContain("45 couverts servis")
    expect(result.subtitle).toContain("charge")
  })

  it("returns soir prep subtitle (18-19h)", () => {
    const result = getGreeting(18, "Marie", { eveningReservations: 15 })
    expect(result.subtitle).toContain("Le soir se prepare")
    expect(result.subtitle).toContain("15 resas")
  })

  it("returns soir service subtitle (19-23h)", () => {
    const result = getGreeting(21, "Marie", { activeTables: 12 })
    expect(result.subtitle).toContain("Service du soir en cours")
    expect(result.subtitle).toContain("12 tables actives")
  })

  it("returns fin de journee subtitle (23h+)", () => {
    const result = getGreeting(23, "Marie", { covers: 90, revenue: 3200 })
    expect(result.subtitle).toContain("Belle journee")
    expect(result.subtitle).toContain("90 couverts")
    expect(result.subtitle).toContain("3200")
  })
})

describe("getDashboardKpiInsight", () => {
  it("returns null for null value", () => {
    expect(getDashboardKpiInsight("occupancyRate", null)).toBeNull()
  })

  describe("occupancyRate", () => {
    it("returns success when > 85%", () => {
      const result = getDashboardKpiInsight("occupancyRate", 90)
      expect(result?.variant).toBe("success")
      expect(result?.text).toContain("walk-in")
    })

    it("returns info when 60-85%", () => {
      const result = getDashboardKpiInsight("occupancyRate", 70)
      expect(result?.variant).toBe("info")
    })

    it("returns neutral when < 40%", () => {
      const result = getDashboardKpiInsight("occupancyRate", 30)
      expect(result?.variant).toBe("neutral")
    })
  })

  describe("covers", () => {
    it("returns success when change > 15%", () => {
      const result = getDashboardKpiInsight("covers", 100, 20)
      expect(result?.variant).toBe("success")
    })

    it("returns warning when change < -10%", () => {
      const result = getDashboardKpiInsight("covers", 100, -15)
      expect(result?.variant).toBe("warning")
    })

    it("returns null for moderate change", () => {
      expect(getDashboardKpiInsight("covers", 100, 5)).toBeNull()
    })
  })

  describe("foodCost", () => {
    it("returns success when < 28%", () => {
      const result = getDashboardKpiInsight("foodCost", 25)
      expect(result?.variant).toBe("success")
    })

    it("returns info when 28-32%", () => {
      const result = getDashboardKpiInsight("foodCost", 30)
      expect(result?.variant).toBe("info")
    })

    it("returns warning when 32-35%", () => {
      const result = getDashboardKpiInsight("foodCost", 34)
      expect(result?.variant).toBe("warning")
    })

    it("returns danger when > 35%", () => {
      const result = getDashboardKpiInsight("foodCost", 38)
      expect(result?.variant).toBe("danger")
    })
  })

  describe("satisfaction", () => {
    it("returns success when > 4.5", () => {
      const result = getDashboardKpiInsight("satisfaction", 4.7)
      expect(result?.variant).toBe("success")
      expect(result?.text).toContain("conquis")
    })

    it("returns info when 4.0-4.5", () => {
      const result = getDashboardKpiInsight("satisfaction", 4.2)
      expect(result?.variant).toBe("info")
    })

    it("returns danger when < 3.5", () => {
      const result = getDashboardKpiInsight("satisfaction", 3.2)
      expect(result?.variant).toBe("danger")
    })
  })
})
