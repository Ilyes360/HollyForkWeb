import { describe, it, expect } from "vitest"
import { getStockStatusInsight, getStockEmptyState } from "@/lib/copy/stock"

describe("getStockStatusInsight", () => {
  it("returns danger for rupture with impacted recipes", () => {
    const result = getStockStatusInsight("rupture", 3)
    expect(result.variant).toBe("danger")
    expect(result.text).toContain("3 recettes impactees")
  })

  it("returns danger for rupture with no recipes", () => {
    const result = getStockStatusInsight("rupture", 0)
    expect(result.variant).toBe("danger")
    expect(result.text).toContain("aucune recette liee")
  })

  it("returns warning for stock_faible", () => {
    const result = getStockStatusInsight("stock_faible", 2)
    expect(result.variant).toBe("warning")
    expect(result.text).toContain("commande a prevoir")
  })

  it("returns success for stock_ok", () => {
    const result = getStockStatusInsight("stock_ok", 0)
    expect(result.variant).toBe("success")
    expect(result.text).toBe("Stock OK")
  })

  it("returns warning for surstock", () => {
    const result = getStockStatusInsight("surstock", 0)
    expect(result.variant).toBe("warning")
    expect(result.text).toContain("gaspillage")
  })

  it("handles singular recipe count", () => {
    const result = getStockStatusInsight("rupture", 1)
    expect(result.text).toContain("1 recette impactee")
    expect(result.text).not.toContain("recettes")
  })
})

describe("getStockEmptyState", () => {
  it("returns filter message when filters active", () => {
    const result = getStockEmptyState(true)
    expect(result.title).toContain("Aucun produit")
    expect(result.actionLabel).toBeUndefined()
  })

  it("returns onboarding message without filters", () => {
    const result = getStockEmptyState(false)
    expect(result.title).toContain("Ton stock commence ici")
    expect(result.actionLabel).toBe("Ajouter un produit")
  })
})
