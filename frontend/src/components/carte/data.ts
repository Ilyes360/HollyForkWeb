import type { Recipe } from "./types"

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

export const MOCK_RECIPES: Recipe[] = [
  // ── Entrées ──
  {
    id: "r1",
    name: "Salade de tomates fraîches",
    icon: "salad",
    category: "entree",
    sellingPrice: 12,
    portions: 4,
    ingredients: [
      { productId: "p7", quantity: 0.5, unit: "kg" },   // Tomates
      { productId: "p10", quantity: 0.05, unit: "L" },   // Huile d'olive
      { productId: "p6", quantity: 0.02, unit: "kg" },   // Herbes fraîches
      { productId: "p11", quantity: 0.005, unit: "kg" },  // Sel
    ],
    allergens: [],
    isActive: true,
    notes: "Entrée phare de l'été",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
  },
  {
    id: "r2",
    name: "Tartare de saumon aux agrumes",
    icon: "fish",
    category: "entree",
    sellingPrice: 18,
    portions: 4,
    ingredients: [
      { productId: "p3", quantity: 0.2, unit: "kg" },    // Saumon frais
      { productId: "p2", quantity: 0.05, unit: "kg" },   // Citrons bio (RUPTURE)
      { productId: "p10", quantity: 0.03, unit: "L" },   // Huile d'olive
      { productId: "p6", quantity: 0.01, unit: "kg" },   // Herbes fraîches
      { productId: "p11", quantity: 0.003, unit: "kg" },  // Sel
    ],
    allergens: ["Poisson"],
    isActive: true,
    notes: "",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(10),
  },
  // ── Plats ──
  {
    id: "r3",
    name: "Filet de bœuf sauce au poivre",
    icon: "steak",
    category: "plat",
    sellingPrice: 34,
    portions: 4,
    ingredients: [
      { productId: "p1", quantity: 0.25, unit: "kg" },   // Filet de bœuf (RUPTURE)
      { productId: "p5", quantity: 0.05, unit: "kg" },   // Beurre AOP
      { productId: "p6", quantity: 0.01, unit: "kg" },   // Herbes fraîches
      { productId: "p11", quantity: 0.005, unit: "kg" },  // Sel
    ],
    allergens: ["Lait"],
    isActive: true,
    notes: "Plat signature",
    createdAt: daysAgo(90),
    updatedAt: daysAgo(3),
  },
  {
    id: "r4",
    name: "Côtes de porc grillées",
    icon: "bbq",
    category: "plat",
    sellingPrice: 22,
    portions: 4,
    ingredients: [
      { productId: "p16", quantity: 0.3, unit: "kg" },   // Côtes de porc
      { productId: "p8", quantity: 0.2, unit: "kg" },    // Pommes de terre
      { productId: "p9", quantity: 0.05, unit: "kg" },   // Oignons
      { productId: "p10", quantity: 0.03, unit: "L" },   // Huile d'olive
      { productId: "p11", quantity: 0.005, unit: "kg" },  // Sel
    ],
    allergens: [],
    isActive: true,
    notes: "",
    createdAt: daysAgo(50),
    updatedAt: daysAgo(7),
  },
  {
    id: "r5",
    name: "Saumon poêlé au beurre blanc",
    icon: "fish",
    category: "plat",
    sellingPrice: 28,
    portions: 4,
    ingredients: [
      { productId: "p3", quantity: 0.2, unit: "kg" },    // Saumon frais
      { productId: "p5", quantity: 0.08, unit: "kg" },   // Beurre AOP
      { productId: "p2", quantity: 0.03, unit: "kg" },   // Citrons bio (RUPTURE)
      { productId: "p6", quantity: 0.01, unit: "kg" },   // Herbes fraîches
      { productId: "p11", quantity: 0.005, unit: "kg" },  // Sel
    ],
    allergens: ["Poisson", "Lait"],
    isActive: true,
    notes: "",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(8),
  },
  // ── Desserts ──
  {
    id: "r6",
    name: "Gâteau au chocolat fondant",
    icon: "chocolate",
    category: "dessert",
    sellingPrice: 10,
    portions: 8,
    ingredients: [
      { productId: "p5", quantity: 0.1, unit: "kg" },    // Beurre AOP
      { productId: "p18", quantity: 0.15, unit: "kg" },  // Sucre en poudre
      { productId: "p12", quantity: 0.1, unit: "kg" },   // Farine T55
    ],
    allergens: ["Gluten", "Lait", "Oeufs"],
    isActive: true,
    notes: "",
    createdAt: daysAgo(70),
    updatedAt: daysAgo(15),
  },
  {
    id: "r7",
    name: "Tarte aux pommes caramélisées",
    icon: "cakeslice",
    category: "dessert",
    sellingPrice: 9,
    portions: 6,
    ingredients: [
      { productId: "p12", quantity: 0.15, unit: "kg" },  // Farine T55
      { productId: "p5", quantity: 0.08, unit: "kg" },   // Beurre AOP
      { productId: "p18", quantity: 0.1, unit: "kg" },   // Sucre en poudre
    ],
    allergens: ["Gluten", "Lait"],
    isActive: false,
    notes: "Recette saisonnière — retirée de la carte",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(30),
  },
  // ── Boissons ──
  {
    id: "r8",
    name: "Cocktail maison au citron",
    icon: "drink",
    category: "boisson",
    sellingPrice: 8,
    portions: 1,
    ingredients: [
      { productId: "p2", quantity: 0.1, unit: "kg" },    // Citrons bio (RUPTURE)
      { productId: "p18", quantity: 0.02, unit: "kg" },  // Sucre en poudre
    ],
    allergens: [],
    isActive: true,
    notes: "",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
  },
  {
    id: "r9",
    name: "Riz au lait caramélisé",
    icon: "cookie",
    category: "dessert",
    sellingPrice: 8,
    portions: 6,
    ingredients: [
      { productId: "p17", quantity: 0.15, unit: "kg" },  // Riz basmati
      { productId: "p18", quantity: 0.1, unit: "kg" },   // Sucre en poudre
      { productId: "p5", quantity: 0.03, unit: "kg" },   // Beurre AOP
    ],
    allergens: ["Lait"],
    isActive: false,
    notes: "Hors carte temporairement",
    createdAt: daysAgo(80),
    updatedAt: daysAgo(20),
  },
  {
    id: "r10",
    name: "Crevettes sautées à l'ail",
    icon: "serving",
    category: "plat",
    sellingPrice: 26,
    portions: 4,
    ingredients: [
      { productId: "p4", quantity: 0.2, unit: "kg" },    // Crevettes roses
      { productId: "p10", quantity: 0.04, unit: "L" },   // Huile d'olive
      { productId: "p5", quantity: 0.03, unit: "kg" },   // Beurre AOP
      { productId: "p6", quantity: 0.02, unit: "kg" },   // Herbes fraîches
      { productId: "p11", quantity: 0.005, unit: "kg" },  // Sel
    ],
    allergens: ["Crustacés", "Lait"],
    isActive: true,
    notes: "",
    createdAt: daysAgo(35),
    updatedAt: daysAgo(4),
  },
]
