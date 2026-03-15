import type { Product, ProductStatus, Supplier } from "./types"
import type { StorageZoneConfig, CategoryConfig } from "@/stores/inventory-store"

export function getProductStatus(product: Product): ProductStatus {
  if (product.quantity === 0) return "rupture"
  if (product.quantity < product.minStock) return "stock_faible"
  if (product.quantity > product.maxStock) return "surstock"
  return "stock_ok"
}

export function getStockPercentage(product: Product): number {
  if (product.maxStock === 0) return 0
  return Math.min(100, Math.round((product.quantity / product.maxStock) * 100))
}

export function getProductValue(product: Product): number {
  return product.quantity * product.unitPrice
}

export function getSupplierName(supplierId: string, suppliers: Supplier[]): string {
  const supplier = suppliers.find((s) => s.id === supplierId)
  return supplier ? supplier.name : "—"
}

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function getCategoryLabel(id: string, categories: CategoryConfig[]): string {
  return categories.find((c) => c.id === id)?.label ?? id
}

export function getZoneLabel(id: string, zones: StorageZoneConfig[]): string {
  return zones.find((z) => z.id === id)?.label ?? id
}
