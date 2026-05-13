import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { initialShifts, employees as mockEmployees } from "@/components/planning/data"
import type { Shift, Employee, DayOfWeek, ServiceType } from "@/components/planning/types"
import type { PaginatedResponse } from "@/api/types"

// ── API types (after camelizeKeys) ──

type ApiShift = {
  id: number
  employe: {
    id: number
    firstName: string
    lastName: string
    typeEmploye: { id: number; typeName: string }
  }
  restaurant: { restaurantId: number; name: string }
  startDate: string // "2026-04-14T10:00:00+02:00"
  endDate: string
  shiftType: string // "MORNING" | "AFTERNOON" | "EVENING"
  notes: string | null
}

type ApiRestaurantEmploye = {
  id: number
  employe: {
    id: number
    firstName: string
    lastName: string
    typeEmploye: { id: number; typeName: string }
    salary: string
    hireDate: string
  }
}

// ── Mappers ──

const DAYS_FR: DayOfWeek[] = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]

function mapApiShiftToFront(api: ApiShift): Shift {
  const start = new Date(api.startDate)
  const end = new Date(api.endDate)
  const dayIndex = start.getDay() // 0=dimanche
  const day = DAYS_FR[dayIndex]

  const startHour = start.getHours()
  const service: ServiceType = startHour < 16 ? "midi" : "soir"

  const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
  const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`

  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

  return {
    id: String(api.id),
    employeeId: String(api.employe.id),
    day,
    service,
    startTime,
    endTime,
    isFullDay: diffHours >= 10,
  }
}

const DEPARTMENT_MAP: Record<string, Employee["department"]> = {
  "Chef Cuisinier": "cuisine",
  "Second de cuisine": "cuisine",
  "Commis": "cuisine",
  "Serveur": "salle",
  "Chef de rang": "salle",
  "Manager Salle": "salle",
  "Responsable Salle": "salle",
  "Barman": "bar",
  "Plongeur": "plonge",
}

const COLORS = [
  "bg-blue-500", "bg-pink-500", "bg-orange-500", "bg-emerald-500",
  "bg-purple-500", "bg-rose-500", "bg-amber-500", "bg-teal-500",
  "bg-indigo-500", "bg-violet-500", "bg-cyan-500", "bg-lime-500",
]

function mapApiEmployeeToFront(api: ApiRestaurantEmploye, index: number): Employee {
  const typeName = api.employe.typeEmploye?.typeName ?? ""
  return {
    id: String(api.employe.id),
    firstName: api.employe.firstName || "Employé",
    lastName: api.employe.lastName || "",
    role: typeName,
    department: DEPARTMENT_MAP[typeName] ?? "salle",
    contractHours: 35,
    avatarColor: COLORS[index % COLORS.length],
  }
}

// ── Query keys ──

const keys = {
  all: ["planning"] as const,
  shifts: (restaurantId: number, week?: string) =>
    [...keys.all, "shifts", restaurantId, week] as const,
  employees: (restaurantId: number) =>
    [...keys.all, "employees", restaurantId] as const,
}

// ── Hooks ──

/**
 * Fetch shifts + employees for a restaurant.
 * Dev mode: returns mock data. User mode: fetches from API and maps to front types.
 */
export function useShifts(restaurantId: number | null, week?: string) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const shiftsQuery = useQuery({
    queryKey: keys.shifts(restaurantId ?? 0, week),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiShift>>("planning/shifts/", {
        restaurantId: restaurantId!,
      })
      return res.results.map(mapApiShiftToFront)
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 60 * 1000,
  })

  const employeesQuery = useQuery({
    queryKey: keys.employees(restaurantId ?? 0),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiRestaurantEmploye>>("restaurant-employes/", {
        restaurantId: restaurantId!,
      })
      // Deduplicate by employe.id (API might return duplicates)
      const seen = new Set<number>()
      const unique = res.results.filter((r) => {
        if (seen.has(r.employe.id)) return false
        seen.add(r.employe.id)
        return true
      })
      return unique.map(mapApiEmployeeToFront)
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 5 * 60 * 1000,
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
    data: shiftsQuery.data ?? [],
    employees: employeesQuery.data ?? [],
    isLoading: shiftsQuery.isLoading || employeesQuery.isLoading,
    source: "api" as const,
  }
}

/**
 * Create shift mutation.
 */
export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      employeId: number
      restaurantId: number
      startDate: string
      endDate: string
      shiftType?: string
      notes?: string
    }) => apiPost<ApiShift>("planning/shifts/", data),
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
