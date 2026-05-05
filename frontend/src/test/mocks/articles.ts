/**
 * Article, category & ingredient fixtures in snake_case — matching real backend responses.
 */

export const mockArticles = [
  {
    id: 1,
    nom: "Salade de tomates fraîches",
    prix: 12,
    description: "Entrée phare de l'été",
    categorie_id: 1,
    disponible: true,
  },
  {
    id: 2,
    nom: "Filet de bœuf sauce au poivre",
    prix: 34,
    description: "Plat signature",
    categorie_id: 2,
    disponible: true,
  },
  {
    id: 3,
    nom: "Gâteau au chocolat fondant",
    prix: 10,
    description: "Dessert maison",
    categorie_id: 3,
    disponible: true,
  },
]

export const mockCategories = [
  {
    id: 1,
    nom: "Entrées",
    display_order: 1,
    description: "Entrées froides et chaudes",
  },
  {
    id: 2,
    nom: "Plats",
    display_order: 2,
    description: "Plats principaux",
  },
  {
    id: 3,
    nom: "Desserts",
    display_order: 3,
    description: "Desserts et pâtisseries",
  },
]

export const mockIngredients = [
  {
    id: 1,
    nom: "Tomates",
    unite: "kg",
    prix_unitaire: 3.8,
  },
  {
    id: 2,
    nom: "Filet de bœuf",
    unite: "kg",
    prix_unitaire: 42.5,
  },
  {
    id: 3,
    nom: "Chocolat noir 70%",
    unite: "kg",
    prix_unitaire: 18.0,
  },
]

export const mockArticleIngredients = [
  { id: 1, article_id: 1, ingredient_id: 1, quantite: 0.5 },
  { id: 2, article_id: 2, ingredient_id: 2, quantite: 0.25 },
  { id: 3, article_id: 3, ingredient_id: 3, quantite: 0.15 },
]
