import { useDashboardKpis, useDashboardMap } from "@/api/dashboard/queries"
import type { DashboardKpisParams } from "@/api/dashboard/types"

/**
 * Dashboard KPIs.
 */
export function useDashboard(params: DashboardKpisParams | null) {
  const query = useDashboardKpis(params)

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

/**
 * Dashboard map data.
 * Fetches ALL restaurants with coordinates (no restaurant filter).
 */
export function useDashboardMapData() {
  const query = useDashboardMap()

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
  }
}
