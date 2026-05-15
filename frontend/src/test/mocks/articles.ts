/**
 * Article, category & ingredient fixtures in snake_case — matching real backend responses.
 * camelizeKeys converts these to the ApiArticle type fields.
 */

export const mockArticles = [
  {
    id: 1,
    name: "Salade de tomates fraîches",
    restaurant_id: null,
    categorie_id: 1,
    categorie_name: "Entrées",
    price: "12.00",
    description: "Entrée phare de l'été",
    available: true,
    ingredients: [],
    allergens: [],
    diet_types: [],
  },
  {
    id: 2,
    name: "Filet de boeuf sauce au poivre",
    restaurant_id: null,
    categorie_id: 2,
    categorie_name: "Plats",
    price: "34.00",
    description: "Plat signature",
    available: true,
    ingredients: [],
    allergens: [],
    diet_types: [],
  },
  {
    id: 3,
    name: "Gâteau au chocolat fondant",
    restaurant_id: null,
    categorie_id: 3,
    categorie_name: "Desserts",
    price: "10.00",
    description: "Dessert maison",
    available: true,
    ingredients: [],
    allergens: [],
    diet_types: [],
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
    name: "Filet de boeuf",
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
