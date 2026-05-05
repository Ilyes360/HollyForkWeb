/**
 * Stock fixtures in snake_case — matching real backend responses.
 */

export const mockStocks = [
  {
    id: 1,
    ingredient_id: 1,
    ingredient_nom: "Tomates",
    quantite: 12,
    unite: "kg",
    seuil_min: 5,
    zone_stockage: "reserve_legumes",
    restaurant_id: 1,
  },
  {
    id: 2,
    ingredient_id: 2,
    ingredient_nom: "Filet de bœuf",
    quantite: 0,
    unite: "kg",
    seuil_min: 5,
    zone_stockage: "chambre_froide_a",
    restaurant_id: 1,
  },
  {
    id: 3,
    ingredient_id: 3,
    ingredient_nom: "Chocolat noir 70%",
    quantite: 4,
    unite: "kg",
    seuil_min: 2,
    zone_stockage: "reserve_seche",
    restaurant_id: 1,
  },
]

export const mockReapprovisionnements = [
  {
    id: 1,
    stock_id: 2,
    quantite: 10,
    date: "2026-05-04",
    fournisseur_id: 1,
    restaurant_id: 1,
  },
  {
    id: 2,
    stock_id: 1,
    quantite: 15,
    date: "2026-05-03",
    fournisseur_id: 3,
    restaurant_id: 1,
  },
]
