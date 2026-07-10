import { useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import { apiPost, apiPatch, apiDelete, getAccessToken } from "@/api/client"
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
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
]

function apiEmployeToEmployee(e: ApiEmploye): Employee {
  return {
    id: String(e.id),
    firstName: e.firstName ?? "",
    lastName: e.lastName ?? "",
    phone: e.phoneNumber ?? "",
    typeEmployeId: e.typeEmployeId,
    typeEmployeName: e.typeEmployeName ?? "",
    salary: parseFloat(e.salary) || 0,
    hireDate: e.hireDate ?? "",
    avatarColor: AVATAR_COLORS[e.id % AVATAR_COLORS.length],
  }
}

const keys = {
  all: ["employees"] as const,
  list: () => [...keys.all, "list"] as const,
  detail: (id: number) => [...keys.all, "detail", id] as const,
  types: () => ["employee-types"] as const,
}

export function useEmployees() {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.list(),
    queryFn: () => fetchAllPages<ApiEmploye>("employes/", {}),
    enabled: hasToken,
    staleTime: 2 * 60 * 1000,
  })

  const employees = useMemo(
    () => (query.data ?? []).map(apiEmployeToEmployee),
    [query.data]
  )

  return {
    data: employees,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

export function useEmployeeTypes() {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.types(),
    queryFn: () => fetchAllPages<ApiTypeEmploye>("type-employes/", {}),
    enabled: hasToken,
    staleTime: 10 * 60 * 1000,
  })

  return { data: query.data ?? [], isLoading: query.isLoading }
}

export function useCreateEmployee() {
  const qc = useQueryClient()

  return useMutationWithDefaults({
    mutationFn: (data: {
      lastName: string
      firstName: string
      typeEmployeId: number
      salary: string
      hireDate: string
      phoneNumber?: string | null
    }) => apiPost<ApiEmploye>("employes/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()

  return useMutationWithDefaults({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: Partial<{
        lastName: string
        firstName: string
        typeEmployeId: number
        salary: string
        hireDate: string
        phoneNumber: string | null
      }>
    }) => apiPatch<ApiEmploye>(`employes/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()

  return useMutationWithDefaults({
    mutationFn: (id: number) => apiDelete(`employes/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })
}
