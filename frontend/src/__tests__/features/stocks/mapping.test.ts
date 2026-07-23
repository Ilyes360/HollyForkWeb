import { describe, it, expect } from "vitest"
import {
  apiStockToProduct,
  toProductUnit,
  type ApiStock,
} from "@/components/stock/mapping"

// ── toProductUnit ──

describe("toProductUnit", () => {
  it.each([
    ["kg", "kg"],
    ["L", "L"],
    ["btl", "btl"],
    ["unites", "unites"],
    ["pieces", "pieces"],
  ] as const)("passes through valid unit %s", (input, expected) => {
    expect(toProductUnit(input)).toBe(expected)
  })

  it.each([
    ["litre", "L"],
    ["l", "L"],
    ["bouteille", "btl"],
    ["piece", "pieces"],
    ["pièce", "pieces"],
    ["pcs", "pieces"],
    ["unite", "unites"],
    ["unité", "unites"],
  ] as const)("maps backend variant %s → %s", (input, expected) => {
    expect(toProductUnit(input)).toBe(expected)
  })

  it("falls back to kg for unrecognized units", () => {
    expect(toProductUnit("gramme")).toBe("kg")
    expect(toProductUnit("")).toBe("kg")
    expect(toProductUnit("unknown_unit")).toBe("kg")
  })
})

// ── apiStockToProduct ──

describe("apiStockToProduct", () => {
  const baseStock: ApiStock = {
    id: 1,
    restaurantId: 1,
    ingredientId: 10,
    ingredientName: "Tomates",
    ingredientUnit: "kg",
    ingredientUnitPrice: "3.80",
    quantityInStock: "12.00",
    alertThreshold: "5.00",
    weightedAverageCost: "3.50",
  }

  it("maps basic fields", () => {
    const product = apiStockToProduct(baseStock)

    expect(product.id).toBe("1")
    expect(product.name).toBe("Tomates")
    expect(product.quantity).toBe(12)
    expect(product.unit).toBe("kg")
    expect(product.unitPrice).toBe(3.8)
  })

  it("derives minStock from alertThreshold", () => {
    const product = apiStockToProduct(baseStock)
    expect(product.minStock).toBe(5)
  })

  it("derives maxStock as alertThreshold × 3", () => {
    const product = apiStockToProduct(baseStock)
    expect(product.maxStock).toBe(15) // 5 * 3
  })

  it("defaults maxStock to 100 when alertThreshold is 0", () => {
    const stock = { ...baseStock, alertThreshold: "0" }
    const product = apiStockToProduct(stock)
    expect(product.minStock).toBe(0)
    expect(product.maxStock).toBe(100)
  })

  it("prefers ingredientUnitPrice over weightedAverageCost", () => {
    const product = apiStockToProduct(baseStock)
    expect(product.unitPrice).toBe(3.8) // ingredientUnitPrice, not weightedAverageCost
  })

  it("falls back to weightedAverageCost when ingredientUnitPrice is 0", () => {
    const stock = { ...baseStock, ingredientUnitPrice: "0" }
    const product = apiStockToProduct(stock)
    expect(product.unitPrice).toBe(3.5) // weightedAverageCost
  })

  it("handles zero price gracefully", () => {
    const stock = {
      ...baseStock,
      ingredientUnitPrice: "0",
      weightedAverageCost: "0",
    }
    const product = apiStockToProduct(stock)
    expect(product.unitPrice).toBe(0)
  })

  it("handles non-numeric quantityInStock", () => {
    const stock = { ...baseStock, quantityInStock: "invalid" }
    const product = apiStockToProduct(stock)
    expect(product.quantity).toBe(0)
  })

  it("maps unit via toProductUnit", () => {
    const stock = { ...baseStock, ingredientUnit: "litre" }
    const product = apiStockToProduct(stock)
    expect(product.unit).toBe("L")
  })

  it("sets default category and storageZone", () => {
    const product = apiStockToProduct(baseStock)
    expect(product.category).toBe("epicerie")
    expect(product.storageZone).toBe("reserve_seche")
  })

  it("sets empty defaults for supplierId and notes", () => {
    const product = apiStockToProduct(baseStock)
    expect(product.supplierId).toBe("")
    expect(product.notes).toBe("")
  })

  it("converts id to string", () => {
    const stock = { ...baseStock, id: 42 }
    const product = apiStockToProduct(stock)
    expect(product.id).toBe("42")
    expect(typeof product.id).toBe("string")
  })
})
