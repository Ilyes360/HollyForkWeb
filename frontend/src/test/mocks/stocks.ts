/**
 * Stock fixtures in snake_case — matching real backend responses.
 */

export const mockStocks = [
  {
    id: 1,
    restaurant: { restaurant_id: 1, name: "Holly Fork — Marais" },
    ingredient: { id: 1, name: "Tomates", unit: "kg", unit_price: "3.80" },
    quantity_in_stock: "12.00",
    alert_threshold: "5.00",
    weighted_average_cost: "3.50",
  },
  {
    id: 2,
    restaurant: { restaurant_id: 1, name: "Holly Fork — Marais" },
    ingredient: { id: 2, name: "Filet de bœuf", unit: "kg", unit_price: "42.50" },
    quantity_in_stock: "0.00",
    alert_threshold: "5.00",
    weighted_average_cost: "40.00",
  },
  {
    id: 3,
    restaurant: { restaurant_id: 1, name: "Holly Fork — Marais" },
    ingredient: { id: 3, name: "Chocolat noir 70%", unit: "kg", unit_price: "18.00" },
    quantity_in_stock: "4.00",
    alert_threshold: "2.00",
    weighted_average_cost: "17.00",
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
