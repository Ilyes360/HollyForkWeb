import { describe, it, expect } from "vitest"
import {
  getLimitingIngredientName,
  getPortionGaugeColor,
  getPortionGaugePercent,
} from "@/components/carte/utils"
import { formatPortionEquivalents } from "@/components/stock/utils"
import type { IngredientPortionInfo } from "@/components/carte/types"
import type { PortionEquivalent } from "@/components/stock/types"

describe("getLimitingIngredientName", () => {
  it("returns product name when provided", () => {
    const ing: IngredientPortionInfo = {
      productId: "p1",
      productName: "Saumon",
      portionsAllowed: 5,
      isLimiting: true,
    }
    expect(getLimitingIngredientName(ing)).toBe("Saumon")
  })

  it("returns dash when null", () => {
    expect(getLimitingIngredientName(null)).toBe("—")
  })
})

describe("getPortionGaugeColor", () => {
  it("returns destructive when 0 portions", () => {
    expect(getPortionGaugeColor(0)).toBe("bg-destructive")
  })

  it("returns amber when below threshold", () => {
    expect(getPortionGaugeColor(30)).toBe("bg-amber-500")
  })

  it("returns emerald when at or above threshold", () => {
    expect(getPortionGaugeColor(50)).toBe("bg-emerald-500")
    expect(getPortionGaugeColor(100)).toBe("bg-emerald-500")
  })

  it("respects custom threshold", () => {
    expect(getPortionGaugeColor(10, 20)).toBe("bg-amber-500")
    expect(getPortionGaugeColor(20, 20)).toBe("bg-emerald-500")
  })
})

describe("getPortionGaugePercent", () => {
  it("returns proportional percentage", () => {
    expect(getPortionGaugePercent(25)).toBe(50)
  })

  it("clamps at 100", () => {
    expect(getPortionGaugePercent(200)).toBe(100)
  })

  it("returns 0 when threshold is 0", () => {
    expect(getPortionGaugePercent(50, 0)).toBe(0)
  })

  it("returns 0 for 0 portions", () => {
    expect(getPortionGaugePercent(0)).toBe(0)
  })
})

describe("formatPortionEquivalents", () => {
  it("returns dash for empty array", () => {
    expect(formatPortionEquivalents([])).toBe("—")
  })

  it("formats single item", () => {
    const eq: PortionEquivalent[] = [
      { recipeId: "r1", recipeName: "Pavé saumon", portionsEnabled: 8 },
    ]
    expect(formatPortionEquivalents(eq)).toBe("Pavé saumon: 8")
  })

  it("formats two items without truncation", () => {
    const eq: PortionEquivalent[] = [
      { recipeId: "r1", recipeName: "Pavé saumon", portionsEnabled: 8 },
      { recipeId: "r2", recipeName: "Ceviche", portionsEnabled: 13 },
    ]
    expect(formatPortionEquivalents(eq)).toBe("Pavé saumon: 8 | Ceviche: 13")
  })

  it("truncates with +N autre(s) for 3+ items", () => {
    const eq: PortionEquivalent[] = [
      { recipeId: "r1", recipeName: "Pavé saumon", portionsEnabled: 8 },
      { recipeId: "r2", recipeName: "Ceviche", portionsEnabled: 13 },
      { recipeId: "r3", recipeName: "Tartare", portionsEnabled: 5 },
    ]
    expect(formatPortionEquivalents(eq)).toBe(
      "Pavé saumon: 8 | Ceviche: 13 | +1 autre"
    )
  })

  it("handles plural truncation", () => {
    const eq: PortionEquivalent[] = [
      { recipeId: "r1", recipeName: "A", portionsEnabled: 1 },
      { recipeId: "r2", recipeName: "B", portionsEnabled: 2 },
      { recipeId: "r3", recipeName: "C", portionsEnabled: 3 },
      { recipeId: "r4", recipeName: "D", portionsEnabled: 4 },
    ]
    expect(formatPortionEquivalents(eq)).toBe("A: 1 | B: 2 | +2 autres")
  })

  it("respects custom maxDisplay", () => {
    const eq: PortionEquivalent[] = [
      { recipeId: "r1", recipeName: "A", portionsEnabled: 1 },
      { recipeId: "r2", recipeName: "B", portionsEnabled: 2 },
      { recipeId: "r3", recipeName: "C", portionsEnabled: 3 },
    ]
    expect(formatPortionEquivalents(eq, 1)).toBe("A: 1 | +2 autres")
  })
})
