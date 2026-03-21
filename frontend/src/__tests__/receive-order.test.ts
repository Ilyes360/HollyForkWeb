import { describe, it, expect, beforeEach } from "vitest"
import { useInventoryStore } from "@/stores/inventory-store"
import type { Order } from "@/components/commandes/types"
import type { Product } from "@/components/stock/types"

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Saumon",
    supplierId: "s1",
    category: "poissons",
    quantity: 5,
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

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord-test",
    supplierId: "s1",
    items: [
      { productId: "p1", quantity: 10, unitPrice: 25 },
    ],
    date: "2026-03-20",
    status: "pending",
    totalAmount: 250,
    expectedDelivery: "2026-03-22",
    notes: "",
    ...overrides,
  }
}

describe("markOrderDelivered", () => {
  beforeEach(() => {
    // Reset the store to a known state before each test
    useInventoryStore.setState({
      products: [
        makeProduct({ id: "p1", quantity: 5 }),
        makeProduct({ id: "p2", name: "Citron", quantity: 3, unitPrice: 4 }),
      ],
      suppliers: [{ id: "s1", name: "Océan Frais", category: "poissons", phone: "", email: "", address: "", averageDeliveryDays: 2, notes: "" }],
      orders: [
        makeOrder({
          id: "ord-1",
          items: [
            { productId: "p1", quantity: 10, unitPrice: 25 },
            { productId: "p2", quantity: 5, unitPrice: 4 },
          ],
          totalAmount: 270,
        }),
      ],
    })
  })

  it("increments stock by ordered quantity when no receivedQuantities", () => {
    const { markOrderDelivered } = useInventoryStore.getState()
    markOrderDelivered("ord-1")

    const { products, orders } = useInventoryStore.getState()
    const p1 = products.find((p) => p.id === "p1")!
    const p2 = products.find((p) => p.id === "p2")!

    expect(p1.quantity).toBe(5 + 10) // 15
    expect(p2.quantity).toBe(3 + 5)  // 8
    expect(orders.find((o) => o.id === "ord-1")!.status).toBe("delivered")
  })

  it("increments stock by received quantity when receivedQuantities provided", () => {
    const { markOrderDelivered } = useInventoryStore.getState()
    markOrderDelivered("ord-1", { p1: 7, p2: 5 })

    const { products } = useInventoryStore.getState()
    const p1 = products.find((p) => p.id === "p1")!
    const p2 = products.find((p) => p.id === "p2")!

    expect(p1.quantity).toBe(5 + 7)  // 12 (partial)
    expect(p2.quantity).toBe(3 + 5)  // 8 (full)
  })

  it("does not modify stock for items with received quantity 0", () => {
    const { markOrderDelivered } = useInventoryStore.getState()
    markOrderDelivered("ord-1", { p1: 0, p2: 5 })

    const { products } = useInventoryStore.getState()
    const p1 = products.find((p) => p.id === "p1")!
    const p2 = products.find((p) => p.id === "p2")!

    expect(p1.quantity).toBe(5)      // unchanged
    expect(p2.quantity).toBe(3 + 5)  // 8
  })

  it("records received quantity in order history", () => {
    const { markOrderDelivered } = useInventoryStore.getState()
    markOrderDelivered("ord-1", { p1: 7, p2: 3 })

    const { products } = useInventoryStore.getState()
    const p1 = products.find((p) => p.id === "p1")!
    const p2 = products.find((p) => p.id === "p2")!

    expect(p1.orderHistory[0].quantity).toBe(7)
    expect(p2.orderHistory[0].quantity).toBe(3)
  })

  it("rejects non-pending orders", () => {
    // Set order to delivered first
    useInventoryStore.setState((s) => ({
      orders: s.orders.map((o) =>
        o.id === "ord-1" ? { ...o, status: "delivered" as const } : o
      ),
    }))

    const { markOrderDelivered } = useInventoryStore.getState()
    markOrderDelivered("ord-1", { p1: 10, p2: 5 })

    const { products } = useInventoryStore.getState()
    const p1 = products.find((p) => p.id === "p1")!
    // Stock should be unchanged
    expect(p1.quantity).toBe(5)
  })

  it("rejects unknown order id", () => {
    const { markOrderDelivered } = useInventoryStore.getState()
    markOrderDelivered("ord-unknown", { p1: 10 })

    const { products } = useInventoryStore.getState()
    const p1 = products.find((p) => p.id === "p1")!
    expect(p1.quantity).toBe(5)
  })

  it("sets deliveredDate on the order", () => {
    const { markOrderDelivered } = useInventoryStore.getState()
    markOrderDelivered("ord-1")

    const { orders } = useInventoryStore.getState()
    const order = orders.find((o) => o.id === "ord-1")!
    expect(order.deliveredDate).toBeDefined()
    expect(order.status).toBe("delivered")
  })
})
