import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { initialShifts, employees as mockEmployees } from "@/components/planning/data"

type ApiShift = {
  id: number
  employeId: number
  restaurantId: number
  date: string
  debut: string
  fin: string
  type: string
}

type ApiEmploiDuTemps = {
  restaurant: { id: number; nom: string }
  semaine: { debut: string; fin: string }
  jours: Array<{
    date: string
    jour: string
    creneaux: Array<{ debut: string; fin: string }>
    totalHeures: number
  }>
  totalSemaineHeures: number
}

const keys = {
  all: ["planning"] as const,
  shifts: (restaurantId: number, week?: string) =>
    [...keys.all, "shifts", restaurantId, week] as const,
  schedule: (restaurantId: number, week?: string) =>
    [...keys.all, "schedule", restaurantId, week] as const,
}

/**
 * Fetch the weekly schedule (emploi du temps) for a restaurant.
 * Dev mode: returns mock shifts from planning/data.ts.
 * User mode: fetches from API.
 */
export function useWeeklySchedule(restaurantId: number | null, week?: string) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.schedule(restaurantId ?? 0, week),
    queryFn: () =>
      apiGet<ApiEmploiDuTemps>("planning/shifts/emploi-du-temps/", {
        restaurantId: restaurantId!,
        semaine: week,
      }),
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 60 * 1000,
  })

  if (isDevMode) {
    return {
      data: null, // Dev mode uses initialShifts directly in the page
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
 * Fetch individual shifts for a restaurant/week.
 * Dev mode: returns mock shifts. User mode: fetches from API.
 */
export function useShifts(restaurantId: number | null, week?: string) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.shifts(restaurantId ?? 0, week),
    queryFn: async () => {
      const res = await apiGet<{ results: ApiShift[] }>("planning/shifts/", {
        restaurantId: restaurantId!,
        semaine: week,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 60 * 1000,
  })

  if (isDevMode) {
    return {
      data: initialShifts,
      employees: mockEmployees,
      isLoading: false,
      source: "mock" as const,
    }
  }

  return {
    data: query.data ?? [],
    employees: [], // In user mode, employees come from useEmployees hook
    isLoading: query.isLoading,
    source: "api" as const,
  }
}

/**
 * Create shift mutation.
 */
export function useCreateShift() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiShift>("planning/shifts/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })
}

/**
 * Update shift mutation.
 */
export function useUpdateShift() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiShift>(`planning/shifts/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })
}

/**
 * Delete shift mutation.
 */
export function useDeleteShift() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => apiDelete(`planning/shifts/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })
}
