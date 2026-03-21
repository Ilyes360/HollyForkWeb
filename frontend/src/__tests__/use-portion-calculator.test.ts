import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { usePortionCalculator } from "@/hooks/use-portion-calculator"
import type { Recipe } from "@/components/carte/types"
import type { Product } from "@/components/stock/types"
import type { SupplierFull } from "@/components/commandes/types"

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Saumon",
    supplierId: "s1",
    category: "poissons",
    quantity: 10,
    unit: "kg",
    minStock: 2,
    maxStock: 20,
    unitPrice: 25,
    rotation: 3,
    lastOrderDate: "2026-03-15",
    expirationDate: "2026-03-25",
    storageZone: "chambre_froide_a",
    notes: "",
    orderHistory: [],
    ...overrides,
  }
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "r1",
    name: "Pavé saumon",
    category: "plat",
    sellingPrice: 24,
    portions: 1,
    ingredients: [{ productId: "p1", quantity: 0.2, unit: "kg" }],
    allergens: [],
    isActive: true,
    notes: "",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
    ...overrides,
  }
}

const EMPTY_SUPPLIERS: SupplierFull[] = []

describe("usePortionCalculator — recipePortions", () => {
  it("computes maxPortions as min of all ingredients", () => {
    const products = [
      makeProduct({ id: "p1", quantity: 10 }),
      makeProduct({ id: "p2", name: "Citron", quantity: 3, unitPrice: 2 }),
    ]
    const recipes = [
      makeRecipe({
        ingredients: [
          { productId: "p1", quantity: 2, unit: "kg" },
          { productId: "p2", quantity: 1, unit: "kg" },
        ],
      }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    // p1: floor(10/2) = 5, p2: floor(3/1) = 3 → min = 3
    expect(result.current.recipePortions[0].maxPortions).toBe(3)
  })

  it("identifies the limiting ingredient", () => {
    const products = [
      makeProduct({ id: "p1", quantity: 10 }),
      makeProduct({ id: "p2", name: "Citron", quantity: 3, unitPrice: 2 }),
    ]
    const recipes = [
      makeRecipe({
        ingredients: [
          { productId: "p1", quantity: 2, unit: "kg" },
          { productId: "p2", quantity: 1, unit: "kg" },
        ],
      }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    const limiting = result.current.recipePortions[0].limitingIngredient
    expect(limiting?.productId).toBe("p2")
    expect(limiting?.isLimiting).toBe(true)
  })

  it("returns 0 when product is out of stock", () => {
    const products = [makeProduct({ id: "p1", quantity: 0 })]
    const recipes = [makeRecipe()]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.recipePortions[0].maxPortions).toBe(0)
  })

  it("returns 0 when recipe has no ingredients", () => {
    const products = [makeProduct()]
    const recipes = [makeRecipe({ ingredients: [] })]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.recipePortions[0].maxPortions).toBe(0)
    expect(result.current.recipePortions[0].limitingIngredient).toBeNull()
  })

  it("computes foodCostPercent correctly", () => {
    const products = [makeProduct({ id: "p1", unitPrice: 25, quantity: 10 })]
    // ingredient quantity 0.2 × unitPrice 25 = 5 → 5/24 * 100 ≈ 20.83
    const recipes = [makeRecipe({ sellingPrice: 24 })]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.recipePortions[0].foodCostPercent).toBeCloseTo(20.83, 1)
  })

  it("passes through isActive", () => {
    const products = [makeProduct()]
    const recipes = [makeRecipe({ isActive: false })]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.recipePortions[0].isActive).toBe(false)
  })

  it("returns 0 when ingredient productId is unknown", () => {
    const products = [makeProduct({ id: "p1", quantity: 10 })]
    const recipes = [
      makeRecipe({
        ingredients: [{ productId: "p999", quantity: 1, unit: "kg" }],
      }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.recipePortions[0].maxPortions).toBe(0)
  })

  it("handles ingredient with quantity 0 (division by zero)", () => {
    const products = [makeProduct({ id: "p1", quantity: 10 })]
    const recipes = [
      makeRecipe({
        ingredients: [{ productId: "p1", quantity: 0, unit: "kg" }],
      }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.recipePortions[0].maxPortions).toBe(0)
  })

  it("returns foodCostPercent 0 when sellingPrice is 0", () => {
    const products = [makeProduct({ id: "p1", unitPrice: 10, quantity: 10 })]
    const recipes = [
      makeRecipe({
        sellingPrice: 0,
        ingredients: [{ productId: "p1", quantity: 1, unit: "kg" }],
      }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.recipePortions[0].foodCostPercent).toBe(0)
    expect(Number.isFinite(result.current.recipePortions[0].foodCostPercent)).toBe(true)
  })

  it("identifies non-limiting ingredient correctly", () => {
    const products = [
      makeProduct({ id: "p1", quantity: 10 }),
      makeProduct({ id: "p2", name: "Citron", quantity: 100, unitPrice: 2 }),
    ]
    const recipes = [
      makeRecipe({
        ingredients: [
          { productId: "p1", quantity: 2, unit: "kg" },
          { productId: "p2", quantity: 1, unit: "kg" },
        ],
      }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    const details = result.current.recipePortions[0].ingredientDetails
    const p2Detail = details.find((d) => d.productId === "p2")
    expect(p2Detail?.isLimiting).toBe(false)
  })
})

describe("usePortionCalculator — productPortionSummaries", () => {
  it("lists recipes that use the product", () => {
    const products = [makeProduct({ id: "p1", quantity: 10 })]
    const recipes = [
      makeRecipe({ id: "r1", name: "Pavé saumon" }),
      makeRecipe({ id: "r2", name: "Tartare", ingredients: [{ productId: "p1", quantity: 0.5, unit: "kg" }] }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    const summary = result.current.productPortionSummaries[0]
    expect(summary.portionEquivalents).toHaveLength(2)
    expect(summary.portionEquivalents[0].recipeName).toBe("Pavé saumon")
    expect(summary.portionEquivalents[1].recipeName).toBe("Tartare")
  })

  it("computes portionsEnabled per recipe", () => {
    const products = [makeProduct({ id: "p1", quantity: 10 })]
    const recipes = [
      makeRecipe({ ingredients: [{ productId: "p1", quantity: 2, unit: "kg" }] }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    // floor(10/2) = 5
    expect(result.current.productPortionSummaries[0].portionEquivalents[0].portionsEnabled).toBe(5)
  })

  it("returns empty equivalents for unused product", () => {
    const products = [makeProduct({ id: "p1" })]
    const recipes = [
      makeRecipe({ ingredients: [{ productId: "p99", quantity: 1, unit: "kg" }] }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.productPortionSummaries[0].portionEquivalents).toHaveLength(0)
    expect(result.current.productPortionSummaries[0].totalPortionsEnabled).toBe(0)
  })

  it("sums totalPortionsEnabled across recipes", () => {
    const products = [makeProduct({ id: "p1", quantity: 10 })]
    const recipes = [
      makeRecipe({ id: "r1", ingredients: [{ productId: "p1", quantity: 2, unit: "kg" }] }),
      makeRecipe({ id: "r2", name: "R2", ingredients: [{ productId: "p1", quantity: 5, unit: "kg" }] }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    // floor(10/2) + floor(10/5) = 5 + 2 = 7
    expect(result.current.productPortionSummaries[0].totalPortionsEnabled).toBe(7)
  })
})

describe("usePortionCalculator — aggregates", () => {
  it("computes totalFeasibleRecipes", () => {
    const products = [
      makeProduct({ id: "p1", quantity: 10 }),
      makeProduct({ id: "p2", name: "Vide", quantity: 0 }),
    ]
    const recipes = [
      makeRecipe({ id: "r1", ingredients: [{ productId: "p1", quantity: 1, unit: "kg" }] }),
      makeRecipe({ id: "r2", name: "Impossible", ingredients: [{ productId: "p2", quantity: 1, unit: "kg" }] }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.totalFeasibleRecipes).toBe(1)
  })

  it("computes totalActiveRecipes", () => {
    const products = [makeProduct()]
    const recipes = [
      makeRecipe({ id: "r1", isActive: true }),
      makeRecipe({ id: "r2", name: "Inactive", isActive: false }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.totalActiveRecipes).toBe(1)
  })

  it("computes averageFoodCost only for feasible active recipes", () => {
    const products = [
      makeProduct({ id: "p1", quantity: 10, unitPrice: 10 }),
      makeProduct({ id: "p2", name: "Empty", quantity: 0, unitPrice: 5 }),
    ]
    const recipes = [
      makeRecipe({
        id: "r1",
        sellingPrice: 20,
        isActive: true,
        ingredients: [{ productId: "p1", quantity: 1, unit: "kg" }],
      }),
      makeRecipe({
        id: "r2",
        name: "Zero stock",
        sellingPrice: 20,
        isActive: true,
        ingredients: [{ productId: "p2", quantity: 1, unit: "kg" }],
      }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    // Only r1 feasible: cost = 1*10 = 10, foodCost = 10/20*100 = 50%
    expect(result.current.averageFoodCost).toBe(50)
  })

  it("returns 0 averageFoodCost when no feasible recipes", () => {
    const products = [makeProduct({ id: "p1", quantity: 0 })]
    const recipes = [makeRecipe()]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    expect(result.current.averageFoodCost).toBe(0)
  })

  it("computes totalPortions across all recipes", () => {
    const products = [makeProduct({ id: "p1", quantity: 10 })]
    const recipes = [
      makeRecipe({ id: "r1", ingredients: [{ productId: "p1", quantity: 2, unit: "kg" }] }),
      makeRecipe({ id: "r2", name: "R2", ingredients: [{ productId: "p1", quantity: 5, unit: "kg" }] }),
    ]

    const { result } = renderHook(() =>
      usePortionCalculator(recipes, products, EMPTY_SUPPLIERS)
    )
    // floor(10/2) + floor(10/5) = 5 + 2 = 7
    expect(result.current.totalPortions).toBe(7)
  })
})
