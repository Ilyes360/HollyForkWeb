/**
 * Dashboard fixtures in snake_case — matching real backend responses.
 */

export const mockDashboardKpis = {
  restaurant_id: 1,
  restaurant_name: "Holly Fork — Marais",
  date: "2026-05-05",
  kpis: {
    daily_revenue: 4250.5,
    monthly_revenue: 89000.0,
    occupancy_rate: 78.5,
    covers: 142,
    food_cost: 31.2,
    satisfaction: 4.6,
  },
}

export const mockDashboardMap = {
  restaurants: [
    {
      restaurant_id: 1,
      name: "Holly Fork — Marais",
      type: "restaurant",
      lat: 48.8566,
      lng: 2.3522,
      city: "Paris",
    },
    {
      restaurant_id: 2,
      name: "Holly Fork — Opéra",
      type: "restaurant",
      lat: 48.8711,
      lng: 2.3316,
      city: "Paris",
    },
  ],
  suppliers: [],
}
