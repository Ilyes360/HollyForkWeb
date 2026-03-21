import type { Product } from "@/components/stock/types"
import type { SupplierFull, Order } from "./types"

export function getSupplierProductCount(supplierId: string, products: Product[]): number {
  return products.filter((p) => p.supplierId === supplierId).length
}

export function getSupplierTotalSpend(supplierId: string, orders: Order[]): number {
  return orders
    .filter((o) => o.supplierId === supplierId && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0)
}

export function getSupplierMonthlySpend(supplierId: string, orders: Order[]): number {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return orders
    .filter(
      (o) =>
        o.supplierId === supplierId &&
        o.status === "delivered" &&
        new Date(o.date) >= startOfMonth
    )
    .reduce((sum, o) => sum + o.totalAmount, 0)
}

export function getSupplierLastOrderDate(supplierId: string, orders: Order[]): string | null {
  const supplierOrders = orders
    .filter((o) => o.supplierId === supplierId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return supplierOrders.length > 0 ? supplierOrders[0].date : null
}

export function getTotalMonthlySpend(orders: Order[]): number {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return orders
    .filter((o) => o.status === "delivered" && new Date(o.date) >= startOfMonth)
    .reduce((sum, o) => sum + o.totalAmount, 0)
}

export function getPendingOrderCount(orders: Order[]): number {
  return orders.filter((o) => o.status === "pending").length
}

export function getGlobalAvgDeliveryDays(suppliers: SupplierFull[]): number {
  if (suppliers.length === 0) return 0
  const total = suppliers.reduce((sum, s) => sum + s.averageDeliveryDays, 0)
  return Math.round((total / suppliers.length) * 10) / 10
}

export function getSupplierProducts(supplierId: string, products: Product[]): Product[] {
  return products.filter((p) => p.supplierId === supplierId)
}

export function getSupplierOrders(supplierId: string, orders: Order[]): Order[] {
  return orders
    .filter((o) => o.supplierId === supplierId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
