import type { Supplier, ProductCategory } from "@/components/stock/types"

export interface SupplierFull extends Supplier {
  category: ProductCategory
  phone: string
  email: string
  address: string
  averageDeliveryDays: number
  notes: string
}

export interface OrderItem {
  productId: string
  quantity: number
  unitPrice: number
}

export type OrderStatus = "pending" | "delivered" | "cancelled"

export interface Order {
  id: string
  supplierId: string
  items: OrderItem[]
  date: string
  status: OrderStatus
  totalAmount: number
  expectedDelivery: string
  deliveredDate?: string
  notes: string
}

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: "warning" | "success" | "destructive" }
> = {
  pending: { label: "En cours", variant: "warning" },
  delivered: { label: "Livrée", variant: "success" },
  cancelled: { label: "Annulée", variant: "destructive" },
}

export const STOCK_STATUS_FILTER_OPTIONS = [
  { value: "tous", label: "Tous" },
  { value: "rupture", label: "Rupture" },
  { value: "stock_faible", label: "Stock faible" },
  { value: "stock_ok", label: "Stock OK" },
  { value: "surstock", label: "Surstock" },
] as const
