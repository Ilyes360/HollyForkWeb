import type { SupplierFull, Order } from "./types"

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

export const MOCK_SUPPLIERS_FULL: SupplierFull[] = [
  {
    id: "s1",
    name: "Boucherie Moderne",
    category: "viandes",
    phone: "01 42 36 78 90",
    email: "contact@boucherie-moderne.fr",
    address: "12 rue du Faubourg Saint-Antoine, 75012 Paris",
    averageDeliveryDays: 1,
    notes: "Livraison tous les matins avant 7h. Qualité constante.",
  },
  {
    id: "s2",
    name: "Océan Frais",
    category: "poissons",
    phone: "01 43 55 12 34",
    email: "commandes@ocean-frais.fr",
    address: "8 quai de la Mégisserie, 75001 Paris",
    averageDeliveryDays: 2,
    notes: "Arrivage Rungis. Prévenir 48h à l'avance pour les gros volumes.",
  },
  {
    id: "s3",
    name: "Potager Local",
    category: "legumes",
    phone: "06 12 34 56 78",
    email: "potager.local@email.fr",
    address: "Ferme des Lilas, 93260 Les Lilas",
    averageDeliveryDays: 1,
    notes: "Producteur local, bio. Livraison mardi et vendredi.",
  },
  {
    id: "s4",
    name: "Épicerie Fine",
    category: "epicerie",
    phone: "01 45 67 89 01",
    email: "info@epicerie-fine.fr",
    address: "45 boulevard Haussmann, 75009 Paris",
    averageDeliveryDays: 3,
    notes: "Large gamme. Minimum de commande 150 €.",
  },
  {
    id: "s5",
    name: "Cave Sélection",
    category: "boissons",
    phone: "01 47 23 45 67",
    email: "cave.selection@email.fr",
    address: "22 rue de Bercy, 75012 Paris",
    averageDeliveryDays: 5,
    notes: "Délai plus long pour les grands crus. Tarifs dégressifs à partir de 24 bouteilles.",
  },
]

export const MOCK_ORDERS: Order[] = [
  // ── Pending (4) ──
  {
    id: "ord-1",
    supplierId: "s1",
    items: [
      { productId: "p1", quantity: 15, unitPrice: 42.5 },
      { productId: "p16", quantity: 10, unitPrice: 12.5 },
    ],
    date: daysAgo(1),
    status: "pending",
    totalAmount: 15 * 42.5 + 10 * 12.5,
    expectedDelivery: daysFromNow(0),
    notes: "Commande urgente filet de bœuf",
  },
  {
    id: "ord-2",
    supplierId: "s2",
    items: [
      { productId: "p3", quantity: 10, unitPrice: 28.0 },
      { productId: "p4", quantity: 5, unitPrice: 35.0 },
    ],
    date: daysAgo(1),
    status: "pending",
    totalAmount: 10 * 28.0 + 5 * 35.0,
    expectedDelivery: daysFromNow(1),
    notes: "",
  },
  {
    id: "ord-3",
    supplierId: "s3",
    items: [
      { productId: "p2", quantity: 10, unitPrice: 4.2 },
      { productId: "p6", quantity: 3, unitPrice: 18.0 },
    ],
    date: daysAgo(0),
    status: "pending",
    totalAmount: 10 * 4.2 + 3 * 18.0,
    expectedDelivery: daysFromNow(1),
    notes: "Herbes fraîches urgentes",
  },
  {
    id: "ord-4",
    supplierId: "s5",
    items: [{ productId: "p13", quantity: 12, unitPrice: 14.0 }],
    date: daysAgo(2),
    status: "pending",
    totalAmount: 12 * 14.0,
    expectedDelivery: daysFromNow(3),
    notes: "",
  },
  // ── Delivered (8) ──
  {
    id: "ord-5",
    supplierId: "s1",
    items: [{ productId: "p16", quantity: 10, unitPrice: 12.5 }],
    date: daysAgo(6),
    status: "delivered",
    totalAmount: 10 * 12.5,
    expectedDelivery: daysAgo(5),
    deliveredDate: daysAgo(5),
    notes: "",
  },
  {
    id: "ord-6",
    supplierId: "s2",
    items: [
      { productId: "p3", quantity: 8, unitPrice: 28.0 },
      { productId: "p4", quantity: 6, unitPrice: 34.0 },
    ],
    date: daysAgo(7),
    status: "delivered",
    totalAmount: 8 * 28.0 + 6 * 34.0,
    expectedDelivery: daysAgo(5),
    deliveredDate: daysAgo(5),
    notes: "",
  },
  {
    id: "ord-7",
    supplierId: "s3",
    items: [
      { productId: "p7", quantity: 15, unitPrice: 3.8 },
      { productId: "p8", quantity: 25, unitPrice: 1.8 },
      { productId: "p9", quantity: 10, unitPrice: 2.2 },
    ],
    date: daysAgo(5),
    status: "delivered",
    totalAmount: 15 * 3.8 + 25 * 1.8 + 10 * 2.2,
    expectedDelivery: daysAgo(4),
    deliveredDate: daysAgo(4),
    notes: "",
  },
  {
    id: "ord-8",
    supplierId: "s4",
    items: [
      { productId: "p10", quantity: 12, unitPrice: 8.5 },
      { productId: "p12", quantity: 20, unitPrice: 1.5 },
    ],
    date: daysAgo(10),
    status: "delivered",
    totalAmount: 12 * 8.5 + 20 * 1.5,
    expectedDelivery: daysAgo(7),
    deliveredDate: daysAgo(7),
    notes: "",
  },
  {
    id: "ord-9",
    supplierId: "s4",
    items: [
      { productId: "p5", quantity: 10, unitPrice: 12.0 },
      { productId: "p17", quantity: 25, unitPrice: 3.2 },
      { productId: "p18", quantity: 10, unitPrice: 1.8 },
    ],
    date: daysAgo(5),
    status: "delivered",
    totalAmount: 10 * 12.0 + 25 * 3.2 + 10 * 1.8,
    expectedDelivery: daysAgo(2),
    deliveredDate: daysAgo(2),
    notes: "",
  },
  {
    id: "ord-10",
    supplierId: "s5",
    items: [
      { productId: "p13", quantity: 24, unitPrice: 13.5 },
      { productId: "p14", quantity: 12, unitPrice: 31.0 },
    ],
    date: daysAgo(18),
    status: "delivered",
    totalAmount: 24 * 13.5 + 12 * 31.0,
    expectedDelivery: daysAgo(13),
    deliveredDate: daysAgo(14),
    notes: "",
  },
  {
    id: "ord-11",
    supplierId: "s4",
    items: [{ productId: "p15", quantity: 48, unitPrice: 1.2 }],
    date: daysAgo(9),
    status: "delivered",
    totalAmount: 48 * 1.2,
    expectedDelivery: daysAgo(6),
    deliveredDate: daysAgo(6),
    notes: "",
  },
  {
    id: "ord-12",
    supplierId: "s1",
    items: [
      { productId: "p1", quantity: 10, unitPrice: 42.5 },
      { productId: "p16", quantity: 8, unitPrice: 12.0 },
    ],
    date: daysAgo(10),
    status: "delivered",
    totalAmount: 10 * 42.5 + 8 * 12.0,
    expectedDelivery: daysAgo(9),
    deliveredDate: daysAgo(9),
    notes: "",
  },
  // ── Cancelled (2) ──
  {
    id: "ord-13",
    supplierId: "s3",
    items: [{ productId: "p2", quantity: 15, unitPrice: 4.0 }],
    date: daysAgo(12),
    status: "cancelled",
    totalAmount: 15 * 4.0,
    expectedDelivery: daysAgo(11),
    notes: "Annulée — stock suffisant finalement",
  },
  {
    id: "ord-14",
    supplierId: "s5",
    items: [{ productId: "p14", quantity: 6, unitPrice: 32.0 }],
    date: daysAgo(20),
    status: "cancelled",
    totalAmount: 6 * 32.0,
    expectedDelivery: daysAgo(15),
    notes: "Annulée — changement de carte",
  },
]
