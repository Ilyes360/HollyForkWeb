import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useAdminStore } from "@/stores/admin-store"
import type { PaginatedResponse } from "@/api/types"

type ApiEmploye = {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  typeEmployeId: number
  pinCode: string
}

type ApiTypeEmploye = {
  id: number
  nom: string
  description: string
}

const keys = {
  all: ["employees"] as const,
  list: () => [...keys.all, "list"] as const,
  detail: (id: number) => [...keys.all, "detail", id] as const,
  types: () => ["employee-types"] as const,
}

/**
 * List all employees.
 * Dev mode: reads from admin store. User mode: fetches from API.
 */
export function useEmployees() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const storeData = useAdminStore((s) => s.employees)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiEmploye>>("employes/")
      return res.results
    },
    enabled: !isDevMode && hasToken,
    staleTime: 2 * 60 * 1000,
  })

  if (isDevMode) {
    return {
      data: storeData,
      isLoading: false,
      isError: false,
      source: "mock" as const,
    }
  }

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    source: "api" as const,
  }
}

/**
 * Fetch employee types (positions).
 */
export function useEmployeeTypes() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.types(),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiTypeEmploye>>("type-employes/")
      return res.results
    },
    enabled: !isDevMode && hasToken,
    staleTime: 10 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: [], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}

/**
 * Create employee mutation.
 */
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

/**
 * Update employee mutation.
 */
export function useUpdateEmployee() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const updateEmployee = useAdminStore((s) => s.updateEmployee)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiEmploye>(`employes/${id}/`, data),
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

/**
 * Delete employee mutation.
 */
export function useDeleteEmployee() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const deleteEmployee = useAdminStore((s) => s.deleteEmployee)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: number) => apiDelete(`employes/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })

  if (isDevMode) {
    return {
      mutate: (id: string) => deleteEmployee(id),
      isPending: false,
    }
  }

  return { mutate: mutation.mutate, isPending: mutation.isPending }
}
