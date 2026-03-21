export type ProductStatus = "rupture" | "stock_faible" | "stock_ok" | "surstock"
export type ProductCategory = string
export type StorageZone = string
export type ProductUnit = "kg" | "L" | "btl" | "unites" | "pieces"

export interface Supplier {
  id: string
  name: string
}

export interface OrderHistory {
  id: string
  date: string
  quantity: number
  supplier: string
  unitPrice: number
}

export interface Product {
  id: string
  name: string
  icon?: string
  supplierId: string
  category: ProductCategory
  quantity: number
  unit: ProductUnit
  minStock: number
  maxStock: number
  unitPrice: number
  rotation: number
  lastOrderDate: string
  expirationDate: string
  storageZone: StorageZone
  notes: string
  orderHistory: OrderHistory[]
}

export const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; variant: "destructive" | "warning" | "success" | "outline" }
> = {
  rupture: { label: "Rupture", variant: "destructive" },
  stock_faible: { label: "Stock faible", variant: "warning" },
  stock_ok: { label: "Stock OK", variant: "success" },
  surstock: { label: "Surstock", variant: "outline" },
}

export const CATEGORY_LABELS: Record<string, string> = {
  viandes: "Viandes",
  poissons: "Poissons",
  legumes: "Légumes",
  epicerie: "Épicerie",
  boissons: "Boissons",
  autres: "Autres",
}

export const UNIT_LABELS: Record<ProductUnit, string> = {
  kg: "kg",
  L: "L",
  btl: "btl",
  unites: "unités",
  pieces: "pièces",
}

export const ZONE_LABELS: Record<string, string> = {
  chambre_froide_a: "Chambre froide A",
  chambre_froide_b: "Chambre froide B",
  reserve_legumes: "Réserve légumes",
  reserve_seche: "Réserve sèche",
  cave: "Cave",
}

export const STATUS_FILTER_OPTIONS = [
  { value: "tous", label: "Tous" },
  { value: "rupture", label: "Rupture" },
  { value: "stock_faible", label: "Stock faible" },
  { value: "stock_ok", label: "Stock OK" },
  { value: "surstock", label: "Surstock" },
] as const

export const CATEGORY_FILTER_OPTIONS = [
  { value: "toutes", label: "Toutes catégories" },
  { value: "viandes", label: "Viandes" },
  { value: "poissons", label: "Poissons" },
  { value: "legumes", label: "Légumes" },
  { value: "epicerie", label: "Épicerie" },
  { value: "boissons", label: "Boissons" },
  { value: "autres", label: "Autres" },
] as const

// ── Portion equivalents types ──

export interface PortionEquivalent {
  recipeId: string
  recipeName: string
  portionsEnabled: number
}

export interface ProductPortionSummary {
  productId: string
  productName: string
  currentStock: number
  unit: ProductUnit
  portionEquivalents: PortionEquivalent[]
  totalPortionsEnabled: number
  status: ProductStatus
}
