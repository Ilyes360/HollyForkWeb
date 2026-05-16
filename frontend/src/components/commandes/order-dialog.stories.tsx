import type { Meta, StoryObj } from "@storybook/react"

import { OrderDialog } from "./order-dialog"
import type { SupplierFull } from "@/components/commandes/types"
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
    name: "Tomates cerises",
    supplierId: "s1",
    icon: "tomato",
    category: "legumes",
    quantity: 3,
    unit: "kg",
    minStock: 5,
    maxStock: 20,
    unitPrice: 4.5,
    rotation: 12,
    lastOrderDate: "2025-01-10",
    expirationDate: "2025-01-20",
    storageZone: "chambre_froide_a",
    notes: "",
    orderHistory: [],
  },
  {
    id: "p2",
    name: "Courgettes",
    supplierId: "s1",
    icon: "vegetable",
    category: "legumes",
    quantity: 10,
    unit: "kg",
    minStock: 3,
    maxStock: 15,
    unitPrice: 2.8,
    rotation: 8,
    lastOrderDate: "2025-01-08",
    expirationDate: "2025-01-25",
    storageZone: "chambre_froide_a",
    notes: "",
    orderHistory: [],
  },
]

const meta = {
  title: "Feature/Commandes/OrderDialog",
  component: OrderDialog,
  tags: ["autodocs"],
} satisfies Meta<typeof OrderDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    supplier: mockSupplier,
    products: mockProducts,
    open: true,
    onOpenChange: () => {},
    onSubmit: (data) => console.log("Submit", data),
  },
}

export const WithPreselectedProduct: Story = {
  args: {
    supplier: mockSupplier,
    products: mockProducts,
    open: true,
    onOpenChange: () => {},
    onSubmit: (data) => console.log("Submit", data),
    preSelectedProductId: "p1",
  },
}
