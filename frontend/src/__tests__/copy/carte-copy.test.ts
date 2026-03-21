import { describe, it, expect } from "vitest"
import { getFeasibilityInsight, getCarteKpiInsight, getCarteEmptyState } from "@/lib/copy/carte"

describe("getFeasibilityInsight", () => {
  it("returns danger for 0 portions with limiting ingredient", () => {
    const result = getFeasibilityInsight(0, "Saumon")
    expect(result?.variant).toBe("danger")
    expect(result?.text).toContain("Saumon en rupture")
  })

  it("returns danger for 0 portions without ingredient info", () => {
    const result = getFeasibilityInsight(0)
    expect(result?.variant).toBe("danger")
    expect(result?.text).toContain("ingredients manquants")
  })

  it("returns warning for < 10 portions", () => {
    const result = getFeasibilityInsight(5, "Tomates")
    expect(result?.variant).toBe("warning")
    expect(result?.text).toContain("Tomates")
  })

  it("returns null for normal portions", () => {
    expect(getFeasibilityInsight(50)).toBeNull()
  })
})

describe("getCarteKpiInsight", () => {
  it("returns success for 100% feasible", () => {
    const result = getCarteKpiInsight("feasible", 10, 10)
    expect(result?.variant).toBe("success")
  })

  it("returns info for > 80% feasible", () => {
    const result = getCarteKpiInsight("feasible", 9, 10)
    expect(result?.variant).toBe("info")
  })

  it("returns warning for < 50% feasible", () => {
    const result = getCarteKpiInsight("feasible", 3, 10)
    expect(result?.variant).toBe("warning")
  })

  it("returns null when no total", () => {
    expect(getCarteKpiInsight("feasible", 5)).toBeNull()
  })

  it("returns success for low food cost", () => {
    const result = getCarteKpiInsight("averageFoodCost", 22)
    expect(result?.variant).toBe("success")
  })

  it("returns danger for high food cost", () => {
    const result = getCarteKpiInsight("averageFoodCost", 38)
    expect(result?.variant).toBe("danger")
  })
})

describe("getCarteEmptyState", () => {
  it("returns filter message with filters", () => {
    const result = getCarteEmptyState(true)
    expect(result.title).toContain("Aucune recette")
    expect(result.actionLabel).toBeUndefined()
  })

  it("returns onboarding message without filters", () => {
    const result = getCarteEmptyState(false)
    expect(result.title).toContain("Ta carte commence ici")
    expect(result.actionLabel).toBeDefined()
  })
})
