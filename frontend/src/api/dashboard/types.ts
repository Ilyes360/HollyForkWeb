/**
 * Types pour GET /api/dashboard/kpis/ (alias of /api/dashboard/overview/)
 * et GET /api/dashboard/map/
 *
 * Aligned with DashboardOverviewKpis in swagger.json.
 */

export type DashboardKpis = {
  restaurantId: number
  restaurantName: string
  date: string
  period?: {
    start: string
    end: string
    days: number
  }
  kpis: {
    dailyRevenue: number
    weeklyRevenue: number
    monthlyRevenue: number
    validatedOrders: number
    averageTicket: number
    grossMargin: number
    foodCostRate: number
    occupancyRate: number
    covers: number
    stockAlerts: number
    scheduledStaffToday: number
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
