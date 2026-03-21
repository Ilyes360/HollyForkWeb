import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product } from "@/components/stock/types"
import type { SupplierFull, Order } from "@/components/commandes/types"
import { MOCK_PRODUCTS } from "@/components/stock/data"
import { MOCK_SUPPLIERS_FULL, MOCK_ORDERS } from "@/components/commandes/data"
import { CATEGORY_LABELS, ZONE_LABELS } from "@/components/stock/types"

// ── Config types ──

export interface StorageZoneConfig {
  id: string
  label: string
  icon?: string
  description?: string
}

export interface CategoryConfig {
  id: string
  label: string
}

// ── Seed data ──

const INITIAL_STORAGE_ZONES: StorageZoneConfig[] = Object.entries(ZONE_LABELS).map(
  ([id, label]) => ({ id, label })
)

const INITIAL_CATEGORIES: CategoryConfig[] = Object.entries(CATEGORY_LABELS).map(
  ([id, label]) => ({ id, label })
)

// ── Store interface ──

interface InventoryStore {
  products: Product[]
  suppliers: SupplierFull[]
  orders: Order[]
  storageZones: StorageZoneConfig[]
  categories: CategoryConfig[]

  // Product actions
  addProduct: (product: Product) => void
  deleteProduct: (id: string) => void
  updateProduct: (id: string, updates: Partial<Product>) => void

  // Supplier actions
  addSupplier: (supplier: SupplierFull) => void
  updateSupplier: (id: string, updates: Partial<SupplierFull>) => void
  deleteSupplier: (id: string) => void

  // Order actions
  addOrder: (order: Order) => void
  markOrderDelivered: (orderId: string, receivedQuantities?: Record<string, number>) => void
  cancelOrder: (orderId: string) => void

  // Config actions
  addStorageZone: (zone: StorageZoneConfig) => void
  updateStorageZone: (id: string, updates: Partial<StorageZoneConfig>) => void
  deleteStorageZone: (id: string) => void
  addCategory: (cat: CategoryConfig) => void
  updateCategory: (id: string, updates: Partial<CategoryConfig>) => void
  deleteCategory: (id: string) => void
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set) => ({
      products: MOCK_PRODUCTS,
      suppliers: MOCK_SUPPLIERS_FULL,
      orders: MOCK_ORDERS,
      storageZones: INITIAL_STORAGE_ZONES,
      categories: INITIAL_CATEGORIES,

      // ── Product actions ──

      addProduct: (product) =>
        set((state) => ({ products: [...state.products, product] })),

      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      // ── Supplier actions ──

      addSupplier: (supplier) =>
        set((state) => ({ suppliers: [...state.suppliers, supplier] })),

      updateSupplier: (id, updates) =>
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSupplier: (id) =>
        set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) })),

      // ── Order actions ──

      addOrder: (order) =>
        set((state) => ({ orders: [order, ...state.orders] })),

      markOrderDelivered: (orderId, receivedQuantities) =>
        set((state) => {
          const today = toLocalDateString(new Date())
          const order = state.orders.find((o) => o.id === orderId)
          if (!order || order.status !== "pending") return state

          // Update order status
          const updatedOrders = state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: "delivered" as const, deliveredDate: today }
              : o
          )

          // Update product quantities
          const updatedProducts = state.products.map((p) => {
            const orderItem = order.items.find((item) => item.productId === p.id)
            if (!orderItem) return p

            const receivedQty = receivedQuantities?.[p.id] ?? orderItem.quantity
            const supplier = state.suppliers.find((s) => s.id === order.supplierId)
            const historyEntry = {
              id: `oh-${Date.now()}-${p.id}`,
              date: today,
              quantity: receivedQty,
              supplier: supplier?.name ?? "—",
              unitPrice: orderItem.unitPrice,
            }

            return {
              ...p,
              quantity: p.quantity + receivedQty,
              lastOrderDate: today,
              orderHistory: [historyEntry, ...p.orderHistory],
            }
          })

          return { orders: updatedOrders, products: updatedProducts }
        }),

      cancelOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId && o.status === "pending"
              ? { ...o, status: "cancelled" as const }
              : o
          ),
        })),

      // ── Config actions ──

      addStorageZone: (zone) =>
        set((state) => ({ storageZones: [...state.storageZones, zone] })),

      updateStorageZone: (id, updates) =>
        set((state) => ({
          storageZones: state.storageZones.map((z) =>
            z.id === id ? { ...z, ...updates } : z
          ),
        })),

      deleteStorageZone: (id) =>
        set((state) => ({
          storageZones: state.storageZones.filter((z) => z.id !== id),
        })),

      addCategory: (cat) =>
        set((state) => ({ categories: [...state.categories, cat] })),

      updateCategory: (id, updates) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),
    }),
    {
      name: "holly-fork-inventory",
    }
  )
)
