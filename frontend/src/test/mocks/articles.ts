/**
 * Article, category & ingredient fixtures in snake_case — matching real backend responses.
 */

export const mockArticles = [
  {
    id: 1,
    name: "Salade de tomates fraîches",
    categorie: { id: 1, name: "Entrées", display_order: 1, description: "Entrées froides et chaudes" },
    price: "12.00",
    description: "Entrée phare de l'été",
    available: true,
  },
  {
    id: 2,
    name: "Filet de bœuf sauce au poivre",
    categorie: { id: 2, name: "Plats", display_order: 2, description: "Plats principaux" },
    price: "34.00",
    description: "Plat signature",
    available: true,
  },
  {
    id: 3,
    name: "Gâteau au chocolat fondant",
    categorie: { id: 3, name: "Desserts", display_order: 3, description: "Desserts et pâtisseries" },
    price: "10.00",
    description: "Dessert maison",
    available: true,
  },
]

export const mockCategories = [
  {
    id: 1,
    name: "Entrées",
    display_order: 1,
    description: "Entrées froides et chaudes",
  },
  {
    id: 2,
    name: "Plats",
    display_order: 2,
    description: "Plats principaux",
  },
  {
    id: 3,
    name: "Desserts",
    display_order: 3,
    description: "Desserts et pâtisseries",
  },
]

export const mockIngredients = [
  {
    id: 1,
    name: "Tomates",
    unit: "kg",
    unit_price: "3.80",
  },
  {
    id: 2,
    name: "Filet de bœuf",
    unit: "kg",
    unit_price: "42.50",
  },
  {
    id: 3,
    name: "Chocolat noir 70%",
    unit: "kg",
    unit_price: "18.00",
  },
]

export const mockArticleIngredients = [
  { id: 1, article_id: 1, ingredient_id: 1, quantite: 0.5 },
  { id: 2, article_id: 2, ingredient_id: 2, quantite: 0.25 },
  { id: 3, article_id: 3, ingredient_id: 3, quantite: 0.15 },
]
