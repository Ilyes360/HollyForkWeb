import type { Product, Supplier } from "./types"

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toLocalDateString(d)
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toLocalDateString(d)
}

export const SUPPLIERS: Supplier[] = [
  { id: "s1", name: "Boucherie Moderne" },
  { id: "s2", name: "Océan Frais" },
  { id: "s3", name: "Potager Local" },
  { id: "s4", name: "Épicerie Fine" },
  { id: "s5", name: "Cave Sélection" },
]

// ────────────────────────────────────────────────────────────────────────────
// Order history dates = delivery/reception dates (when stock was received).
// These align with deliveredDate in fournisseurs/data.ts MOCK_ORDERS.
// lastOrderDate = date the most recent order was *placed* (may still be pending).
// ────────────────────────────────────────────────────────────────────────────
export const MOCK_PRODUCTS: Product[] = [
  // ── Rupture (2) ──
  {
    id: "p1",
    name: "Filet de bœuf",
    icon: "steak",
    supplierId: "s1",
    category: "viandes",
    quantity: 0,
    unit: "kg",
    minStock: 5,
    maxStock: 25,
    unitPrice: 42.5,
    rotation: 5,
    lastOrderDate: daysAgo(1),          // ord-1 (pending)
    expirationDate: daysAgo(1),
    storageZone: "chambre_froide_a",
    notes: "Commande urgente passée",
    orderHistory: [
      { id: "oh1", date: daysAgo(9), quantity: 10, supplier: "Boucherie Moderne", unitPrice: 42.5 },   // ord-12
      { id: "oh2", date: daysAgo(25), quantity: 15, supplier: "Boucherie Moderne", unitPrice: 41.0 },
    ],
  },
  {
    id: "p2",
    name: "Citrons bio",
    icon: "lemon",
    supplierId: "s3",
    category: "legumes",
    quantity: 0,
    unit: "kg",
    minStock: 3,
    maxStock: 15,
    unitPrice: 4.2,
    rotation: 7,
    lastOrderDate: daysAgo(0),          // ord-3 (pending, placed today)
    expirationDate: daysAgo(2),
    storageZone: "reserve_legumes",
    notes: "",
    orderHistory: [
      { id: "oh3", date: daysAgo(12), quantity: 8, supplier: "Potager Local", unitPrice: 4.2 },
      { id: "oh4", date: daysAgo(22), quantity: 10, supplier: "Potager Local", unitPrice: 4.0 },
    ],
  },
  // ── Stock faible (4) ──
  {
    id: "p3",
    name: "Saumon frais",
    icon: "fish",
    supplierId: "s2",
    category: "poissons",
    quantity: 2,
    unit: "kg",
    minStock: 5,
    maxStock: 20,
    unitPrice: 28.0,
    rotation: 4,
    lastOrderDate: daysAgo(1),          // ord-2 (pending)
    expirationDate: daysFromNow(2),
    storageZone: "chambre_froide_b",
    notes: "Vérifier qualité à réception",
    orderHistory: [
      { id: "oh5", date: daysAgo(5), quantity: 8, supplier: "Océan Frais", unitPrice: 28.0 },     // ord-6
      { id: "oh6", date: daysAgo(16), quantity: 10, supplier: "Océan Frais", unitPrice: 27.5 },
    ],
  },
  {
    id: "p4",
    name: "Crevettes roses",
    icon: "fish",
    supplierId: "s2",
    category: "poissons",
    quantity: 1,
    unit: "kg",
    minStock: 3,
    maxStock: 12,
    unitPrice: 35.0,
    rotation: 3,
    lastOrderDate: daysAgo(1),          // ord-2 (pending)
    expirationDate: daysFromNow(1),
    storageZone: "chambre_froide_b",
    notes: "",
    orderHistory: [
      { id: "oh7", date: daysAgo(5), quantity: 6, supplier: "Océan Frais", unitPrice: 34.0 },     // ord-6
      { id: "oh8", date: daysAgo(14), quantity: 5, supplier: "Océan Frais", unitPrice: 35.0 },
      { id: "oh9", date: daysAgo(22), quantity: 4, supplier: "Océan Frais", unitPrice: 35.0 },
    ],
  },
  {
    id: "p5",
    name: "Beurre AOP",
    icon: "cheese",
    supplierId: "s4",
    category: "epicerie",
    quantity: 2,
    unit: "kg",
    minStock: 5,
    maxStock: 20,
    unitPrice: 12.0,
    rotation: 10,
    lastOrderDate: daysAgo(5),          // ord-9
    expirationDate: daysFromNow(5),
    storageZone: "chambre_froide_a",
    notes: "",
    orderHistory: [
      { id: "oh10", date: daysAgo(2), quantity: 10, supplier: "Épicerie Fine", unitPrice: 12.0 },   // ord-9 delivered
      { id: "oh11", date: daysAgo(20), quantity: 10, supplier: "Épicerie Fine", unitPrice: 11.5 },
    ],
  },
  {
    id: "p6",
    name: "Herbes fraîches",
    icon: "organic",
    supplierId: "s3",
    category: "legumes",
    quantity: 0.5,
    unit: "kg",
    minStock: 1,
    maxStock: 5,
    unitPrice: 18.0,
    rotation: 3,
    lastOrderDate: daysAgo(0),          // ord-3 (pending)
    expirationDate: daysFromNow(1),
    storageZone: "reserve_legumes",
    notes: "Basilic, ciboulette, persil",
    orderHistory: [
      { id: "oh12", date: daysAgo(8), quantity: 2, supplier: "Potager Local", unitPrice: 18.0 },
      { id: "oh13", date: daysAgo(15), quantity: 2, supplier: "Potager Local", unitPrice: 18.0 },
    ],
  },
  // ── Stock OK (10) ──
  {
    id: "p7",
    name: "Tomates",
    icon: "naturalfood",
    supplierId: "s3",
    category: "legumes",
    quantity: 12,
    unit: "kg",
    minStock: 5,
    maxStock: 25,
    unitPrice: 3.8,
    rotation: 5,
    lastOrderDate: daysAgo(5),          // ord-7
    expirationDate: daysFromNow(4),
    storageZone: "reserve_legumes",
    notes: "",
    orderHistory: [
      { id: "oh14", date: daysAgo(4), quantity: 15, supplier: "Potager Local", unitPrice: 3.8 },    // ord-7 delivered
      { id: "oh15", date: daysAgo(18), quantity: 12, supplier: "Potager Local", unitPrice: 3.5 },
    ],
  },
  {
    id: "p8",
    name: "Pommes de terre",
    icon: "carrot",
    supplierId: "s3",
    category: "legumes",
    quantity: 30,
    unit: "kg",
    minStock: 10,
    maxStock: 50,
    unitPrice: 1.8,
    rotation: 14,
    lastOrderDate: daysAgo(5),          // ord-7
    expirationDate: daysFromNow(20),
    storageZone: "reserve_legumes",
    notes: "",
    orderHistory: [
      { id: "oh16", date: daysAgo(4), quantity: 25, supplier: "Potager Local", unitPrice: 1.8 },    // ord-7 delivered
      { id: "oh17", date: daysAgo(22), quantity: 30, supplier: "Potager Local", unitPrice: 1.7 },
    ],
  },
  {
    id: "p9",
    name: "Oignons",
    icon: "organic",
    supplierId: "s3",
    category: "legumes",
    quantity: 8,
    unit: "kg",
    minStock: 3,
    maxStock: 15,
    unitPrice: 2.2,
    rotation: 14,
    lastOrderDate: daysAgo(5),          // ord-7
    expirationDate: daysFromNow(25),
    storageZone: "reserve_legumes",
    notes: "",
    orderHistory: [
      { id: "oh18", date: daysAgo(4), quantity: 10, supplier: "Potager Local", unitPrice: 2.2 },    // ord-7 delivered
      { id: "oh19", date: daysAgo(25), quantity: 8, supplier: "Potager Local", unitPrice: 2.0 },
    ],
  },
  {
    id: "p10",
    name: "Huile d'olive",
    icon: "naturalfood",
    supplierId: "s4",
    category: "epicerie",
    quantity: 10,
    unit: "L",
    minStock: 5,
    maxStock: 20,
    unitPrice: 8.5,
    rotation: 30,
    lastOrderDate: daysAgo(10),         // ord-8
    expirationDate: daysFromNow(180),
    storageZone: "reserve_seche",
    notes: "Extra vierge, origine Italie",
    orderHistory: [
      { id: "oh20", date: daysAgo(7), quantity: 12, supplier: "Épicerie Fine", unitPrice: 8.5 },    // ord-8 delivered
      { id: "oh21", date: daysAgo(45), quantity: 10, supplier: "Épicerie Fine", unitPrice: 8.0 },
    ],
  },
  {
    id: "p11",
    name: "Sel de Guérande",
    icon: "naturalfood",
    supplierId: "s4",
    category: "epicerie",
    quantity: 5,
    unit: "kg",
    minStock: 2,
    maxStock: 10,
    unitPrice: 6.0,
    rotation: 45,
    lastOrderDate: daysAgo(30),
    expirationDate: daysFromNow(365),
    storageZone: "reserve_seche",
    notes: "",
    orderHistory: [
      { id: "oh22", date: daysAgo(30), quantity: 5, supplier: "Épicerie Fine", unitPrice: 6.0 },
      { id: "oh23", date: daysAgo(75), quantity: 5, supplier: "Épicerie Fine", unitPrice: 5.5 },
    ],
  },
  {
    id: "p12",
    name: "Farine T55",
    icon: "wheat",
    supplierId: "s4",
    category: "epicerie",
    quantity: 15,
    unit: "kg",
    minStock: 5,
    maxStock: 30,
    unitPrice: 1.5,
    rotation: 30,
    lastOrderDate: daysAgo(10),         // ord-8
    expirationDate: daysFromNow(90),
    storageZone: "reserve_seche",
    notes: "",
    orderHistory: [
      { id: "oh24", date: daysAgo(7), quantity: 20, supplier: "Épicerie Fine", unitPrice: 1.5 },    // ord-8 delivered
      { id: "oh25", date: daysAgo(40), quantity: 15, supplier: "Épicerie Fine", unitPrice: 1.4 },
    ],
  },
  {
    id: "p13",
    name: "Vin rouge Bordeaux",
    icon: "drink",
    supplierId: "s5",
    category: "boissons",
    quantity: 18,
    unit: "btl",
    minStock: 10,
    maxStock: 36,
    unitPrice: 14.0,
    rotation: 14,
    lastOrderDate: daysAgo(2),          // ord-4 (pending)
    expirationDate: daysFromNow(730),
    storageZone: "cave",
    notes: "Château Larose 2019",
    orderHistory: [
      { id: "oh26", date: daysAgo(14), quantity: 24, supplier: "Cave Sélection", unitPrice: 13.5 },  // ord-10 delivered
      { id: "oh27", date: daysAgo(40), quantity: 12, supplier: "Cave Sélection", unitPrice: 14.0 },
    ],
  },
  {
    id: "p14",
    name: "Champagne",
    icon: "drink",
    supplierId: "s5",
    category: "boissons",
    quantity: 8,
    unit: "btl",
    minStock: 4,
    maxStock: 18,
    unitPrice: 32.0,
    rotation: 21,
    lastOrderDate: daysAgo(18),         // ord-10
    expirationDate: daysFromNow(365),
    storageZone: "cave",
    notes: "Brut, Maison Perrier",
    orderHistory: [
      { id: "oh28", date: daysAgo(14), quantity: 12, supplier: "Cave Sélection", unitPrice: 31.0 },  // ord-10 delivered
      { id: "oh29", date: daysAgo(50), quantity: 12, supplier: "Cave Sélection", unitPrice: 31.0 },
    ],
  },
  {
    id: "p15",
    name: "Eau minérale",
    icon: "water",
    supplierId: "s4",
    category: "boissons",
    quantity: 48,
    unit: "btl",
    minStock: 24,
    maxStock: 96,
    unitPrice: 1.2,
    rotation: 7,
    lastOrderDate: daysAgo(9),          // ord-11
    expirationDate: daysFromNow(180),
    storageZone: "reserve_seche",
    notes: "",
    orderHistory: [
      { id: "oh30", date: daysAgo(6), quantity: 48, supplier: "Épicerie Fine", unitPrice: 1.2 },    // ord-11 delivered
      { id: "oh31", date: daysAgo(20), quantity: 48, supplier: "Épicerie Fine", unitPrice: 1.2 },
    ],
  },
  {
    id: "p16",
    name: "Côtes de porc",
    icon: "steak",
    supplierId: "s1",
    category: "viandes",
    quantity: 8,
    unit: "kg",
    minStock: 3,
    maxStock: 15,
    unitPrice: 12.5,
    rotation: 5,
    lastOrderDate: daysAgo(1),          // ord-1 (pending)
    expirationDate: daysFromNow(3),
    storageZone: "chambre_froide_a",
    notes: "",
    orderHistory: [
      { id: "oh32", date: daysAgo(5), quantity: 10, supplier: "Boucherie Moderne", unitPrice: 12.5 },  // ord-5 delivered
      { id: "oh33", date: daysAgo(9), quantity: 8, supplier: "Boucherie Moderne", unitPrice: 12.0 },   // ord-12 delivered
      { id: "oh34", date: daysAgo(20), quantity: 10, supplier: "Boucherie Moderne", unitPrice: 12.5 },
    ],
  },
  // ── Surstock (2) ──
  {
    id: "p17",
    name: "Riz basmati",
    icon: "rice",
    supplierId: "s4",
    category: "epicerie",
    quantity: 40,
    unit: "kg",
    minStock: 5,
    maxStock: 25,
    unitPrice: 3.2,
    rotation: 30,
    lastOrderDate: daysAgo(5),          // ord-9
    expirationDate: daysFromNow(120),
    storageZone: "reserve_seche",
    notes: "Commande double reçue par erreur",
    orderHistory: [
      { id: "oh35", date: daysAgo(2), quantity: 25, supplier: "Épicerie Fine", unitPrice: 3.2 },    // ord-9 delivered
      { id: "oh36", date: daysAgo(5), quantity: 20, supplier: "Épicerie Fine", unitPrice: 3.2 },    // double order (mistake)
      { id: "oh37", date: daysAgo(35), quantity: 10, supplier: "Épicerie Fine", unitPrice: 3.0 },
    ],
  },
  {
    id: "p18",
    name: "Sucre en poudre",
    icon: "candy",
    supplierId: "s4",
    category: "epicerie",
    quantity: 18,
    unit: "kg",
    minStock: 3,
    maxStock: 12,
    unitPrice: 1.8,
    rotation: 30,
    lastOrderDate: daysAgo(5),          // ord-9
    expirationDate: daysFromNow(365),
    storageZone: "reserve_seche",
    notes: "",
    orderHistory: [
      { id: "oh38", date: daysAgo(2), quantity: 10, supplier: "Épicerie Fine", unitPrice: 1.8 },    // ord-9 delivered
      { id: "oh39", date: daysAgo(35), quantity: 10, supplier: "Épicerie Fine", unitPrice: 1.7 },
    ],
  },
]
