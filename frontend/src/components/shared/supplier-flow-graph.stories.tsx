import type { Meta, StoryObj } from "@storybook/react"

import { SupplierFlowGraph } from "./supplier-flow-graph"
import type { SupplierFull } from "@/components/commandes/types"
import type { Product } from "@/components/stock/types"
import type { ProductPortionSummary } from "@/components/stock/types"
import type { Recipe } from "@/components/carte/types"

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
  {
    productId: "p2",
    productName: "Courgettes",
    currentStock: 10,
    unit: "kg",
    portionEquivalents: [
      { recipeId: "r2", recipeName: "Ratatouille", portionsEnabled: 8 },
    ],
    totalPortionsEnabled: 8,
    status: "stock_ok",
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
  {
    id: "r2",
    name: "Ratatouille",
    categorieId: 2,
    category: "plat",
    sellingPrice: 18,
    portions: 6,
    ingredients: [{ productId: "p2", quantity: 0.3, unit: "kg" }],
    allergens: [],
    isActive: true,
    notes: "",
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
] as Recipe[]

const meta = {
  title: "Shared/SupplierFlowGraph",
  component: SupplierFlowGraph,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[700px] p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SupplierFlowGraph>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    supplier: mockSupplier,
    products: mockProducts,
    productPortionSummaries: mockSummaries,
    recipes: mockRecipes,
  },
}

export const NoRecipes: Story = {
  args: {
    supplier: mockSupplier,
    products: mockProducts,
    productPortionSummaries: [],
    recipes: [],
  },
}
