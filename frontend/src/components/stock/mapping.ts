import type { Product, ProductUnit } from "./types"

/** API response shape (flat, after camelizeKeys) */
export type ApiStock = {
  id: number
  restaurantId: number
  ingredientId: number
  ingredientName: string
  ingredientUnit: string
  ingredientUnitPrice: string
  quantityInStock: string
  alertThreshold: string
  weightedAverageCost: string
}

const VALID_UNITS: Set<string> = new Set<string>([
  "kg",
  "L",
  "btl",
  "unites",
  "pieces",
])

/**
 * Maps raw backend unit string to ProductUnit.
 * Handles common variants: "litre"→"L", "bouteille"→"btl", etc.
 * Falls back to "kg" for unrecognized values.
 */
export function toProductUnit(raw: string): ProductUnit {
  if (VALID_UNITS.has(raw)) return raw as ProductUnit
  if (raw === "litre" || raw === "l") return "L"
  if (raw === "bouteille") return "btl"
  if (raw === "piece" || raw === "pièce" || raw === "pcs") return "pieces"
  if (raw === "unite" || raw === "unité") return "unites"
  return "kg"
}

/**
 * Maps a backend ApiStock to the frontend Product domain type.
 *
 * - Parses numeric strings to numbers
 * - Maps unit via toProductUnit
 * - Uses ingredientUnitPrice with weightedAverageCost as fallback
 * - Derives maxStock as alertThreshold × 3 (or 100 if alertThreshold is 0)
 * - Defaults category to "epicerie", storageZone to "reserve_seche"
 */
export function apiStockToProduct(s: ApiStock): Product {
  const quantity = parseFloat(s.quantityInStock) || 0
  const minStock = parseFloat(s.alertThreshold) || 0
  const unitPrice =
    parseFloat(s.ingredientUnitPrice) || parseFloat(s.weightedAverageCost) || 0
  return {
    id: String(s.id),
    name: s.ingredientName,
    quantity,
    unit: toProductUnit(s.ingredientUnit),
    minStock,
    maxStock: minStock * 3 || 100,
    unitPrice,
    supplierId: "",
    category: "epicerie",
    storageZone: "reserve_seche",
    notes: "",
  }
}
