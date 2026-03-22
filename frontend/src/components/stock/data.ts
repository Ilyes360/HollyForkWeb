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
    lastOrderDate: daysAgo(5),
    expirationDate: daysFromNow(120),
    storageZone: "reserve_seche",
    notes: "Commande double reçue par erreur",
    orderHistory: [
      { id: "oh35", date: daysAgo(2), quantity: 25, supplier: "Épicerie Fine", unitPrice: 3.2 },
      { id: "oh36", date: daysAgo(5), quantity: 20, supplier: "Épicerie Fine", unitPrice: 3.2 },
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
    lastOrderDate: daysAgo(5),
    expirationDate: daysFromNow(365),
    storageZone: "reserve_seche",
    notes: "",
    orderHistory: [
      { id: "oh38", date: daysAgo(2), quantity: 10, supplier: "Épicerie Fine", unitPrice: 1.8 },
    ],
  },
  // ── Produits supplémentaires pour densité réaliste ──
  {
    id: "p19", name: "Poulet fermier", icon: "chicken", supplierId: "s1", category: "viandes",
    quantity: 6, unit: "kg", minStock: 4, maxStock: 20, unitPrice: 9.5, rotation: 4,
    lastOrderDate: daysAgo(3), expirationDate: daysFromNow(3), storageZone: "chambre_froide_a",
    notes: "", orderHistory: [{ id: "oh40", date: daysAgo(3), quantity: 10, supplier: "Boucherie Moderne", unitPrice: 9.5 }],
  },
  {
    id: "p20", name: "Agneau épaule", icon: "steak", supplierId: "s1", category: "viandes",
    quantity: 4, unit: "kg", minStock: 3, maxStock: 12, unitPrice: 18.0, rotation: 5,
    lastOrderDate: daysAgo(4), expirationDate: daysFromNow(4), storageZone: "chambre_froide_a",
    notes: "", orderHistory: [{ id: "oh41", date: daysAgo(4), quantity: 8, supplier: "Boucherie Moderne", unitPrice: 18.0 }],
  },
  {
    id: "p21", name: "Lard fumé", icon: "bbq", supplierId: "s1", category: "viandes",
    quantity: 3, unit: "kg", minStock: 2, maxStock: 8, unitPrice: 14.0, rotation: 10,
    lastOrderDate: daysAgo(6), expirationDate: daysFromNow(12), storageZone: "chambre_froide_a",
    notes: "", orderHistory: [{ id: "oh42", date: daysAgo(6), quantity: 5, supplier: "Boucherie Moderne", unitPrice: 14.0 }],
  },
  {
    id: "p22", name: "Canard magret", icon: "chicken", supplierId: "s1", category: "viandes",
    quantity: 0, unit: "kg", minStock: 2, maxStock: 10, unitPrice: 24.0, rotation: 4,
    lastOrderDate: daysAgo(1), expirationDate: daysAgo(1), storageZone: "chambre_froide_a",
    notes: "Rupture — commander en urgence", orderHistory: [{ id: "oh43", date: daysAgo(7), quantity: 5, supplier: "Boucherie Moderne", unitPrice: 24.0 }],
  },
  {
    id: "p23", name: "Crème fraîche", icon: "milk", supplierId: "s4", category: "epicerie",
    quantity: 8, unit: "L", minStock: 3, maxStock: 15, unitPrice: 4.5, rotation: 7,
    lastOrderDate: daysAgo(4), expirationDate: daysFromNow(5), storageZone: "chambre_froide_b",
    notes: "", orderHistory: [{ id: "oh44", date: daysAgo(4), quantity: 10, supplier: "Épicerie Fine", unitPrice: 4.5 }],
  },
  {
    id: "p24", name: "Fromage comté", icon: "cheese", supplierId: "s4", category: "epicerie",
    quantity: 3, unit: "kg", minStock: 2, maxStock: 8, unitPrice: 22.0, rotation: 14,
    lastOrderDate: daysAgo(10), expirationDate: daysFromNow(20), storageZone: "chambre_froide_b",
    notes: "18 mois d'affinage", orderHistory: [{ id: "oh45", date: daysAgo(10), quantity: 5, supplier: "Épicerie Fine", unitPrice: 22.0 }],
  },
  {
    id: "p25", name: "Lait entier", icon: "milk", supplierId: "s4", category: "epicerie",
    quantity: 12, unit: "L", minStock: 5, maxStock: 20, unitPrice: 1.5, rotation: 5,
    lastOrderDate: daysAgo(3), expirationDate: daysFromNow(4), storageZone: "chambre_froide_b",
    notes: "", orderHistory: [{ id: "oh46", date: daysAgo(3), quantity: 15, supplier: "Épicerie Fine", unitPrice: 1.5 }],
  },
  {
    id: "p26", name: "Œufs fermiers", icon: "egg", supplierId: "s3", category: "legumes",
    quantity: 60, unit: "unites", minStock: 24, maxStock: 90, unitPrice: 0.4, rotation: 7,
    lastOrderDate: daysAgo(3), expirationDate: daysFromNow(14), storageZone: "chambre_froide_b",
    notes: "", orderHistory: [{ id: "oh47", date: daysAgo(3), quantity: 60, supplier: "Potager Local", unitPrice: 0.4 }],
  },
  {
    id: "p27", name: "Carottes", icon: "carrot", supplierId: "s3", category: "legumes",
    quantity: 10, unit: "kg", minStock: 5, maxStock: 20, unitPrice: 2.0, rotation: 10,
    lastOrderDate: daysAgo(5), expirationDate: daysFromNow(8), storageZone: "reserve_legumes",
    notes: "", orderHistory: [{ id: "oh48", date: daysAgo(5), quantity: 15, supplier: "Potager Local", unitPrice: 2.0 }],
  },
  {
    id: "p28", name: "Poireaux", icon: "organic", supplierId: "s3", category: "legumes",
    quantity: 5, unit: "kg", minStock: 3, maxStock: 12, unitPrice: 3.0, rotation: 7,
    lastOrderDate: daysAgo(4), expirationDate: daysFromNow(5), storageZone: "reserve_legumes",
    notes: "", orderHistory: [{ id: "oh49", date: daysAgo(4), quantity: 8, supplier: "Potager Local", unitPrice: 3.0 }],
  },
  {
    id: "p29", name: "Champignons", icon: "mushroom", supplierId: "s3", category: "legumes",
    quantity: 2, unit: "kg", minStock: 2, maxStock: 8, unitPrice: 8.5, rotation: 3,
    lastOrderDate: daysAgo(2), expirationDate: daysFromNow(2), storageZone: "reserve_legumes",
    notes: "Paris + shiitake", orderHistory: [{ id: "oh50", date: daysAgo(2), quantity: 4, supplier: "Potager Local", unitPrice: 8.5 }],
  },
  {
    id: "p30", name: "Ail", icon: "organic", supplierId: "s3", category: "legumes",
    quantity: 1, unit: "kg", minStock: 0.5, maxStock: 3, unitPrice: 12.0, rotation: 21,
    lastOrderDate: daysAgo(10), expirationDate: daysFromNow(30), storageZone: "reserve_legumes",
    notes: "", orderHistory: [{ id: "oh51", date: daysAgo(10), quantity: 2, supplier: "Potager Local", unitPrice: 12.0 }],
  },
  {
    id: "p31", name: "Échalotes", icon: "organic", supplierId: "s3", category: "legumes",
    quantity: 2, unit: "kg", minStock: 1, maxStock: 5, unitPrice: 6.0, rotation: 14,
    lastOrderDate: daysAgo(8), expirationDate: daysFromNow(18), storageZone: "reserve_legumes",
    notes: "", orderHistory: [{ id: "oh52", date: daysAgo(8), quantity: 3, supplier: "Potager Local", unitPrice: 6.0 }],
  },
  {
    id: "p32", name: "Salade mêlée", icon: "salad", supplierId: "s3", category: "legumes",
    quantity: 1.5, unit: "kg", minStock: 2, maxStock: 6, unitPrice: 9.0, rotation: 2,
    lastOrderDate: daysAgo(1), expirationDate: daysFromNow(1), storageZone: "reserve_legumes",
    notes: "", orderHistory: [{ id: "oh53", date: daysAgo(1), quantity: 4, supplier: "Potager Local", unitPrice: 9.0 }],
  },
  {
    id: "p33", name: "Avocat", icon: "avocado", supplierId: "s3", category: "legumes",
    quantity: 8, unit: "unites", minStock: 6, maxStock: 20, unitPrice: 1.8, rotation: 3,
    lastOrderDate: daysAgo(2), expirationDate: daysFromNow(3), storageZone: "reserve_legumes",
    notes: "", orderHistory: [{ id: "oh54", date: daysAgo(2), quantity: 12, supplier: "Potager Local", unitPrice: 1.8 }],
  },
  {
    id: "p34", name: "Poivre noir", icon: "naturalfood", supplierId: "s4", category: "epicerie",
    quantity: 0.8, unit: "kg", minStock: 0.3, maxStock: 2, unitPrice: 35.0, rotation: 60,
    lastOrderDate: daysAgo(30), expirationDate: daysFromNow(365), storageZone: "reserve_seche",
    notes: "Kampot", orderHistory: [{ id: "oh55", date: daysAgo(30), quantity: 1, supplier: "Épicerie Fine", unitPrice: 35.0 }],
  },
  {
    id: "p35", name: "Vinaigre balsamique", icon: "naturalfood", supplierId: "s4", category: "epicerie",
    quantity: 3, unit: "L", minStock: 1, maxStock: 5, unitPrice: 12.0, rotation: 30,
    lastOrderDate: daysAgo(20), expirationDate: daysFromNow(365), storageZone: "reserve_seche",
    notes: "", orderHistory: [{ id: "oh56", date: daysAgo(20), quantity: 3, supplier: "Épicerie Fine", unitPrice: 12.0 }],
  },
  {
    id: "p36", name: "Moutarde de Dijon", icon: "naturalfood", supplierId: "s4", category: "epicerie",
    quantity: 2, unit: "kg", minStock: 1, maxStock: 5, unitPrice: 8.0, rotation: 30,
    lastOrderDate: daysAgo(15), expirationDate: daysFromNow(120), storageZone: "reserve_seche",
    notes: "", orderHistory: [{ id: "oh57", date: daysAgo(15), quantity: 3, supplier: "Épicerie Fine", unitPrice: 8.0 }],
  },
  {
    id: "p37", name: "Pâtes sèches", icon: "noodles", supplierId: "s4", category: "epicerie",
    quantity: 12, unit: "kg", minStock: 5, maxStock: 25, unitPrice: 3.5, rotation: 14,
    lastOrderDate: daysAgo(8), expirationDate: daysFromNow(180), storageZone: "reserve_seche",
    notes: "Tagliatelle + penne", orderHistory: [{ id: "oh58", date: daysAgo(8), quantity: 15, supplier: "Épicerie Fine", unitPrice: 3.5 }],
  },
  {
    id: "p38", name: "Chocolat noir 70%", icon: "chocolate", supplierId: "s4", category: "epicerie",
    quantity: 4, unit: "kg", minStock: 2, maxStock: 10, unitPrice: 18.0, rotation: 14,
    lastOrderDate: daysAgo(12), expirationDate: daysFromNow(180), storageZone: "reserve_seche",
    notes: "Valrhona", orderHistory: [{ id: "oh59", date: daysAgo(12), quantity: 5, supplier: "Épicerie Fine", unitPrice: 18.0 }],
  },
  {
    id: "p39", name: "Vanille gousse", icon: "naturalfood", supplierId: "s4", category: "epicerie",
    quantity: 10, unit: "unites", minStock: 5, maxStock: 20, unitPrice: 4.0, rotation: 30,
    lastOrderDate: daysAgo(20), expirationDate: daysFromNow(90), storageZone: "reserve_seche",
    notes: "Madagascar", orderHistory: [{ id: "oh60", date: daysAgo(20), quantity: 15, supplier: "Épicerie Fine", unitPrice: 4.0 }],
  },
  {
    id: "p40", name: "Café en grain", icon: "coffee", supplierId: "s4", category: "boissons",
    quantity: 5, unit: "kg", minStock: 2, maxStock: 10, unitPrice: 22.0, rotation: 14,
    lastOrderDate: daysAgo(7), expirationDate: daysFromNow(90), storageZone: "reserve_seche",
    notes: "Arabica blend", orderHistory: [{ id: "oh61", date: daysAgo(7), quantity: 5, supplier: "Épicerie Fine", unitPrice: 22.0 }],
  },
  {
    id: "p41", name: "Thé vert", icon: "tea", supplierId: "s4", category: "boissons",
    quantity: 1, unit: "kg", minStock: 0.5, maxStock: 3, unitPrice: 45.0, rotation: 30,
    lastOrderDate: daysAgo(15), expirationDate: daysFromNow(180), storageZone: "reserve_seche",
    notes: "", orderHistory: [{ id: "oh62", date: daysAgo(15), quantity: 1, supplier: "Épicerie Fine", unitPrice: 45.0 }],
  },
  {
    id: "p42", name: "Vin blanc Bourgogne", icon: "drink", supplierId: "s5", category: "boissons",
    quantity: 12, unit: "btl", minStock: 6, maxStock: 24, unitPrice: 16.0, rotation: 14,
    lastOrderDate: daysAgo(14), expirationDate: daysFromNow(730), storageZone: "cave",
    notes: "Chablis 2022", orderHistory: [{ id: "oh63", date: daysAgo(14), quantity: 12, supplier: "Cave Sélection", unitPrice: 16.0 }],
  },
  {
    id: "p43", name: "Rosé Provence", icon: "drink", supplierId: "s5", category: "boissons",
    quantity: 6, unit: "btl", minStock: 6, maxStock: 24, unitPrice: 11.0, rotation: 10,
    lastOrderDate: daysAgo(10), expirationDate: daysFromNow(365), storageZone: "cave",
    notes: "", orderHistory: [{ id: "oh64", date: daysAgo(10), quantity: 12, supplier: "Cave Sélection", unitPrice: 11.0 }],
  },
  {
    id: "p44", name: "Bar de ligne", icon: "fish", supplierId: "s2", category: "poissons",
    quantity: 3, unit: "kg", minStock: 2, maxStock: 10, unitPrice: 32.0, rotation: 3,
    lastOrderDate: daysAgo(1), expirationDate: daysFromNow(2), storageZone: "chambre_froide_b",
    notes: "", orderHistory: [{ id: "oh65", date: daysAgo(1), quantity: 5, supplier: "Océan Frais", unitPrice: 32.0 }],
  },
  {
    id: "p45", name: "Moules", icon: "fish", supplierId: "s2", category: "poissons",
    quantity: 5, unit: "kg", minStock: 3, maxStock: 15, unitPrice: 6.5, rotation: 2,
    lastOrderDate: daysAgo(1), expirationDate: daysFromNow(1), storageZone: "chambre_froide_b",
    notes: "De bouchot", orderHistory: [{ id: "oh66", date: daysAgo(1), quantity: 10, supplier: "Océan Frais", unitPrice: 6.5 }],
  },
  {
    id: "p46", name: "Pain de mie", icon: "bread", supplierId: "s4", category: "epicerie",
    quantity: 3, unit: "kg", minStock: 2, maxStock: 8, unitPrice: 4.0, rotation: 3,
    lastOrderDate: daysAgo(2), expirationDate: daysFromNow(2), storageZone: "reserve_seche",
    notes: "", orderHistory: [{ id: "oh67", date: daysAgo(2), quantity: 5, supplier: "Épicerie Fine", unitPrice: 4.0 }],
  },
  {
    id: "p47", name: "Miel d'acacia", icon: "honey", supplierId: "s4", category: "epicerie",
    quantity: 2, unit: "kg", minStock: 1, maxStock: 5, unitPrice: 15.0, rotation: 30,
    lastOrderDate: daysAgo(25), expirationDate: daysFromNow(365), storageZone: "reserve_seche",
    notes: "", orderHistory: [{ id: "oh68", date: daysAgo(25), quantity: 3, supplier: "Épicerie Fine", unitPrice: 15.0 }],
  },
  {
    id: "p48", name: "Brocoli", icon: "broccoli", supplierId: "s3", category: "legumes",
    quantity: 3, unit: "kg", minStock: 2, maxStock: 8, unitPrice: 4.5, rotation: 5,
    lastOrderDate: daysAgo(3), expirationDate: daysFromNow(3), storageZone: "reserve_legumes",
    notes: "", orderHistory: [{ id: "oh69", date: daysAgo(3), quantity: 5, supplier: "Potager Local", unitPrice: 4.5 }],
  },
]
