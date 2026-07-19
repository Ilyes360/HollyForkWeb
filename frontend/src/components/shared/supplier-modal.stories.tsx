import type { Meta, StoryObj } from "@storybook/react"

import { SupplierModal } from "./supplier-modal"
import type { SupplierFull, Order } from "@/components/commandes/types"
import type { Product } from "@/components/stock/types"
import type { ProductPortionSummary } from "@/components/stock/types"
import type { Recipe } from "@/components/carte/types"

const mockSupplier: SupplierFull = {
  id: "s1",
  name: "Ferme Bio du Luberon",
  category: "legumes",
  phone: "04 90 12 34 56",
  email: "contact@ferme.fr",
  address: "Route des Ocres, Apt 84400",
  averageDeliveryDays: 2,
  notes: "Livraison mardi et vendredi uniquement.",
}

const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Tomates cerises",
    supplierId: "s1",
    category: "legumes",
    quantity: 3,
    unit: "kg",
    minStock: 5,
    maxStock: 20,
    unitPrice: 4.5,
    storageZone: "chambre_froide_a",
    notes: "",
  },
  {
    id: "p2",
    name: "Courgettes",
    supplierId: "s1",
    category: "legumes",
    quantity: 10,
    unit: "kg",
    minStock: 3,
    maxStock: 15,
    unitPrice: 2.8,
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
  {
    id: "o2",
    supplierId: "s1",
    items: [{ productId: "p2", quantity: 5, unitPrice: 2.8 }],
    date: "2025-01-15",
    status: "pending",
    totalAmount: 14,
    expectedDelivery: "2025-01-17",
    notes: "",
  },
]

const mockSummaries: ProductPortionSummary[] = [
  {
    productId: "p1",
    productName: "Tomates cerises",
    currentStock: 3,
    unit: "kg",
    portionEquivalents: [
      { recipeId: "r1", recipeName: "Salade Caprese", portionsEnabled: 12 },
    ],
    totalPortionsEnabled: 12,
    status: "stock_faible",
  },
]

const mockRecipes = [
  {
    id: "r1",
    name: "Salade Caprese",
    categorieId: 1,
    category: "entree",
    sellingPrice: 12,
    portions: 4,
    ingredients: [{ productId: "p1", quantity: 0.2, unit: "kg" }],
    allergens: [],
    isActive: true,
    notes: "",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
] as Recipe[]

const meta = {
  title: "Shared/SupplierModal",
  component: SupplierModal,
  tags: ["autodocs"],
} satisfies Meta<typeof SupplierModal>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    supplier: mockSupplier,
    products: mockProducts,
    orders: mockOrders,
    productPortionSummaries: mockSummaries,
    recipes: mockRecipes,
    open: true,
    onOpenChange: () => {},
    onOrder: () => alert("Commander"),
    onEdit: () => alert("Modifier"),
    onDelete: () => alert("Supprimer"),
  },
}
