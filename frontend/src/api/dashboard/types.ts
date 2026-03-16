/**
 * Types pour GET /api/dashboard/kpis/
 * et GET /api/dashboard/map/
 */

export type DashboardKpis = {
  restaurantId: number
  restaurantName: string
  date: string
  kpis: {
    dailyRevenue: number
    monthlyRevenue: number
    occupancyRate: number
    covers: number
    foodCost: number
    satisfaction: number | null
  }
}

export type DashboardKpisParams = {
  restaurantId: number
  date?: string // YYYY-MM-DD
}

export type MapRestaurant = {
  restaurantId: number
  name: string
  type: string
  lat: number
  lng: number
  city: string
}

export type DashboardMapResponse = {
  restaurants: MapRestaurant[]
  suppliers: unknown[]
}

export type DashboardMapParams = {
  restaurantId?: number
}
