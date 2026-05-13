import { useDevModeStore } from "@/stores/dev-mode-store"
import { useDashboardKpis, useDashboardMap } from "@/api/dashboard/queries"
import type { DashboardKpis, DashboardKpisParams, DashboardMapResponse } from "@/api/dashboard/types"

const MOCK_KPIS: DashboardKpis = {
  restaurantId: 1,
  restaurantName: "Holly Fork — Marais",
  date: new Date().toISOString().split("T")[0],
  kpis: {
    dailyRevenue: 4250.5,
    monthlyRevenue: 89000,
    occupancyRate: 78.5,
    covers: 142,
    foodCost: 31.2,
    satisfaction: 4.6,
  },
}

const MOCK_MAP: DashboardMapResponse = {
  restaurants: [
    { restaurantId: 1, name: "Holly Fork — Marais", type: "restaurant", lat: 48.8566, lng: 2.3522, city: "Paris" },
    { restaurantId: 2, name: "Holly Fork — Opéra", type: "restaurant", lat: 48.8711, lng: 2.3316, city: "Paris" },
  ],
  suppliers: [],
}

/**
 * Dashboard KPIs with dev mode fallback.
 */
export function useDashboard(params: DashboardKpisParams | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const query = useDashboardKpis(isDevMode ? null : params)

  if (isDevMode) {
    return {
      data: MOCK_KPIS,
      isLoading: false,
      source: "mock" as const,
    }
  }

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    source: "api" as const,
  }
}

/**
 * Dashboard map with dev mode fallback.
 * Fetches ALL restaurants with coordinates (no restaurant filter).
 */
export function useDashboardMapData() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const query = useDashboardMap()

  if (isDevMode) {
    return {
      data: MOCK_MAP,
      isLoading: false,
      source: "mock" as const,
    }
  }

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    source: "api" as const,
  }
}
