import type { Product, ProductStatus, ProductPortionSummary, PortionEquivalent, Supplier, UrgencyCategory } from "./types"
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

export function formatPortionEquivalents(
  equivalents: PortionEquivalent[],
  maxDisplay: number = 2
): string {
  if (equivalents.length === 0) return "—"
  const shown = equivalents.slice(0, maxDisplay)
  const parts = shown.map((e) => `${e.recipeName}: ${e.portionsEnabled}`)
  const remaining = equivalents.length - maxDisplay
  if (remaining > 0) {
    parts.push(`+${remaining} autre${remaining > 1 ? "s" : ""}`)
  }
  return parts.join(" | ")
}

// ── Nouvelles fonctions pour la refonte ──

export function getDaysUntilExpiration(product: Product): number {
  const exp = new Date(product.expirationDate)
  const now = new Date()
  return Math.ceil((exp.getTime() - now.getTime()) / 86400000)
}

export function getUrgencyCategory(product: Product): UrgencyCategory {
  const status = getProductStatus(product)
  if (status === "rupture" || status === "stock_faible") return "a_commander"

  const daysUntilExp = getDaysUntilExpiration(product)
  if (daysUntilExp <= 3) return "a_surveiller"

  if (product.quantity < product.minStock * 1.5) return "a_surveiller"

  return "stock_ok"
}

export function getZoneHealth(
  products: Product[]
): "ok" | "warning" | "danger" {
  if (products.some((p) => getProductStatus(p) === "rupture")) return "danger"
  if (products.some((p) => getProductStatus(p) === "stock_faible")) return "warning"
  return "ok"
}

export function getZoneFillPercent(products: Product[]): number {
  if (products.length === 0) return 0
  const total = products.reduce(
    (sum, p) => sum + (p.maxStock > 0 ? Math.min(p.quantity / p.maxStock, 1) : 1),
    0
  )
  return Math.round((total / products.length) * 100)
}

export function sortProductsByUrgency(
  products: Product[],
  portionSummaries: Map<string, ProductPortionSummary>
): Product[] {
  const statusPriority: Record<ProductStatus, number> = {
    rupture: 0,
    stock_faible: 1,
    stock_ok: 2,
    surstock: 3,
  }
  return [...products].sort((a, b) => {
    const sa = statusPriority[getProductStatus(a)]
    const sb = statusPriority[getProductStatus(b)]
    if (sa !== sb) return sa - sb
    const ra = portionSummaries.get(a.id)?.portionEquivalents.length ?? 0
    const rb = portionSummaries.get(b.id)?.portionEquivalents.length ?? 0
    if (ra !== rb) return rb - ra
    return a.name.localeCompare(b.name, "fr")
  })
}

export function getTotalStockValue(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)
}
