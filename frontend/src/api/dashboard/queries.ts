import { useQuery } from "@tanstack/react-query"
import { apiGet, MOCK_MODE } from "../client"
import type {
  DashboardKpis,
  DashboardKpisParams,
  DashboardMapResponse,
  DashboardMapParams,
} from "./types"

export const dashboardKeys = {
  all: (restaurantId: number | null) => ["dashboard", restaurantId] as const,
  kpis: (restaurantId: number, date?: string) =>
    [...dashboardKeys.all(restaurantId), "kpis", date] as const,
  map: (restaurantId?: number) =>
    ["dashboard", "map", restaurantId] as const,
}

/**
 * Fetch KPIs for a specific restaurant and date.
 * `GET /api/dashboard/kpis/?restaurant_id=X&date=YYYY-MM-DD`
 */
export function useDashboardKpis(params: DashboardKpisParams | null) {
  return useQuery({
    queryKey: dashboardKeys.kpis(params?.restaurantId ?? 0, params?.date),
    queryFn: () =>
      apiGet<DashboardKpis>("dashboard/kpis/", {
        restaurantId: params!.restaurantId,
        date: params?.date,
      }),
    enabled: !MOCK_MODE && !!params?.restaurantId,
    staleTime: 2 * 60 * 1000, // 2 min — dashboard data refreshes often
  })
}

/**
 * Fetch map data for the dashboard.
 * `GET /api/dashboard/map/?restaurant_id=X`
 */
export function useDashboardMap(params?: DashboardMapParams) {
  return useQuery({
    queryKey: dashboardKeys.map(params?.restaurantId),
    queryFn: () =>
      apiGet<DashboardMapResponse>("dashboard/map/", {
        restaurantId: params?.restaurantId,
      }),
    enabled: !MOCK_MODE,
    staleTime: 10 * 60 * 1000, // 10 min — map data is stable
  })
}
