import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiPost, apiPut, apiPatch, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useAdminStore } from "@/stores/admin-store"
import { fetchAllPages } from "@/api/pagination"
import type { Employee } from "@/stores/admin-types"

// API response (flat, after camelizeKeys from snake_case)
export type ApiEmploye = {
  id: number
  userId: number | null
  lastName: string
  firstName: string
  typeEmployeId: number
  typeEmployeName: string
  salary: string
  hireDate: string
  phoneNumber: string | null
}

export type ApiTypeEmploye = {
  id: number
  typeName: string
  description: string
}

const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899",
]

function apiEmployeToEmployee(e: ApiEmploye): Employee {
  return {
    id: String(e.id),
    firstName: e.firstName ?? "",
    lastName: e.lastName ?? "",
    email: "",
    phone: e.phoneNumber ?? "",
    dateOfBirth: "",
    address: "",
    position: "serveur",
    department: "salle",
    establishmentId: "",
    contractType: "cdi",
    hireDate: e.hireDate ?? "",
    weeklyHours: 35,
    hourlyRate: parseFloat(e.salary) / 151.67 || 0, // approximate from monthly salary
    roleId: String(e.typeEmployeId),
    loginEmail: "",
    accountStatus: "active",
    avatarColor: AVATAR_COLORS[e.id % AVATAR_COLORS.length],
    createdAt: "",
    updatedAt: "",
  }
}

const keys = {
  all: ["employees"] as const,
  list: () => [...keys.all, "list"] as const,
  detail: (id: number) => [...keys.all, "detail", id] as const,
  types: () => ["employee-types"] as const,
}

export function useEmployees() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const storeData = useAdminStore((s) => s.employees)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.list(),
    queryFn: () => fetchAllPages<ApiEmploye>("employes/", {}),
    enabled: !isDevMode && hasToken,
    staleTime: 2 * 60 * 1000,
  })

  const employees = useMemo(
    () => (query.data ?? []).map(apiEmployeToEmployee),
    [query.data],
  )

  if (isDevMode) {
    return { data: storeData, isLoading: false, isError: false, source: "mock" as const }
  }

  return {
    data: employees,
    isLoading: query.isLoading,
    isError: query.isError,
    source: "api" as const,
  }
}

export function useEmployeeTypes() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.types(),
    queryFn: () => fetchAllPages<ApiTypeEmploye>("type-employes/", {}),
    enabled: !isDevMode && hasToken,
    staleTime: 10 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: [], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}

export function useCreateEmployee() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const addEmployee = useAdminStore((s) => s.addEmployee)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiEmploye>("employes/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })

  if (isDevMode) {
    return {
      mutate: (data: Record<string, unknown>) => addEmployee(data as never),
      isPending: false,
    }
  }

  return { mutate: mutation.mutate, isPending: mutation.isPending }
}

export function useUpdateEmployee() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const updateEmployee = useAdminStore((s) => s.updateEmployee)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPatch<ApiEmploye>(`employes/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })

  if (isDevMode) {
    return {
      mutate: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
        updateEmployee(id, data as never),
      isPending: false,
    }
  }

  return { mutate: mutation.mutate, isPending: mutation.isPending }
}

export function useDeleteEmployee() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const removeEmployee = useAdminStore((s) => s.removeEmployee)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: number) => apiDelete(`employes/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })

  if (isDevMode) {
    return {
      mutate: (id: string) => removeEmployee(id),
      isPending: false,
    }
  }

  return { mutate: mutation.mutate, isPending: mutation.isPending }
}
