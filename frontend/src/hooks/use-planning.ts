import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { initialShifts, employees as mockEmployees } from "@/components/planning/data"
import type { Shift, Employee, DayOfWeek, ServiceType } from "@/components/planning/types"
import { fetchAllPages } from "@/api/pagination"

// ── API types (flat, after camelizeKeys from snake_case response) ──

type ApiShift = {
  id: number
  employeId: number
  restaurantId: number
  startDate: string // "2026-04-14T16:00:00+02:00"
  endDate: string
  typeShift: string // "MORNING" | "AFTERNOON" | "EVENING"
  notes: string | null
}

type ApiRestaurantEmploye = {
  id: number
  restaurantId: number
  employeId: number
}

type ApiEmploye = {
  id: number
  lastName: string
  firstName: string
  typeEmployeId: number
  typeEmployeName: string
  salary: string
  hireDate: string
  phoneNumber: string | null
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
    employeeId: String(api.employeId),
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
  "Cuisinier": "cuisine",
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

function mapEmployeToFront(emp: ApiEmploye, index: number): Employee {
  const typeName = emp.typeEmployeName ?? ""
  return {
    id: String(emp.id),
    firstName: emp.firstName || "Employé",
    lastName: emp.lastName || "",
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

export function useShifts(restaurantId: number | null, week?: string) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const shiftsQuery = useQuery({
    queryKey: keys.shifts(restaurantId ?? 0, week),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        restaurantId: restaurantId!,
      }
      if (week) params.week = week
      const all = await fetchAllPages<ApiShift>("planning/shifts/", params)
      return all.map(mapApiShiftToFront)
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 60 * 1000,
  })

  const linksQuery = useQuery({
    queryKey: [...keys.employees(restaurantId ?? 0), "links"],
    queryFn: async () => {
      const all = await fetchAllPages<ApiRestaurantEmploye>("restaurant-employes/", {
        restaurant: restaurantId!,
      })
      return all.map((r) => r.employeId)
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 5 * 60 * 1000,
  })

  const allEmployeesQuery = useQuery({
    queryKey: ["employees", "all"],
    queryFn: async () => {
      const all = await fetchAllPages<ApiEmploye>("employes/", {})
      return all
    },
    enabled: !isDevMode && hasToken,
    staleTime: 10 * 60 * 1000,
  })

  if (isDevMode) {
    return {
      data: initialShifts,
      employees: mockEmployees,
      isLoading: false,
      source: "mock" as const,
    }
  }

  // Step 3: cross-reference to build employee list for this restaurant
  const employeeIds = new Set(linksQuery.data ?? [])
  const allEmps = allEmployeesQuery.data ?? []
  const restaurantEmployees = allEmps
    .filter((e) => employeeIds.has(e.id))
    .map(mapEmployeToFront)

  return {
    data: shiftsQuery.data ?? [],
    employees: restaurantEmployees,
    isLoading: shiftsQuery.isLoading || linksQuery.isLoading || allEmployeesQuery.isLoading,
    source: "api" as const,
  }
}

/**
 * Create shift mutation.
 * API expects: { employe_id, restaurant_id, start_date, end_date, type_shift, notes }
 */
export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      employeId: number
      restaurantId: number
      startDate: string
      endDate: string
      typeShift?: string
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
