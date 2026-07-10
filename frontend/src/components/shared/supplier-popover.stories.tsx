import type { Meta, StoryObj } from "@storybook/react"

import { SupplierPopover } from "./supplier-popover"
import type { SupplierFull, Order } from "@/components/commandes/types"
import type { Product } from "@/components/stock/types"

const mockSupplier: SupplierFull = {
  id: "s1",
  name: "Ferme Bio du Luberon",
  category: "legumes",
  phone: "04 90 12 34 56",
  email: "contact@ferme.fr",
  address: "Apt, 84400",
  averageDeliveryDays: 2,
  notes: "",
}

const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Tomates",
    supplierId: "s1",
    category: "legumes",
    quantity: 5,
    unit: "kg",
    minStock: 3,
    maxStock: 20,
    unitPrice: 4.5,
    storageZone: "chambre_froide_a",
    notes: "",
  },
]

const mockOrders: Order[] = [
  {
    id: "o1",
    supplierId: "s1",
    items: [{ productId: "p1", quantity: 10, unitPrice: 4.5 }],
    date: "2025-01-10",
    status: "delivered",
    totalAmount: 45,
    expectedDelivery: "2025-01-12",
    notes: "",
  },
]

const meta = {
  title: "Shared/SupplierPopover",
  component: SupplierPopover,
  tags: ["autodocs"],
} satisfies Meta<typeof SupplierPopover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    supplier: mockSupplier,
    products: mockProducts,
    orders: mockOrders,
    onOrder: () => alert("Commander"),
    onOpenSheet: () => alert("Voir fiche"),
    children: (
      <button className="rounded border px-3 py-1.5 text-sm hover:bg-muted">
        Cliquer pour voir le popover
      </button>
    ),
  },
}
