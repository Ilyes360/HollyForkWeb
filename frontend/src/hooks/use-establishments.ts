import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useAdminStore } from "@/stores/admin-store"
import { fetchAllPages } from "@/api/pagination"

// API response shape (flat, after camelizeKeys)
export type ApiRestaurant = {
  restaurantId: number
  name: string
  address: string
  postalCode: string
  city: string
  phoneNumber: string
  siret: string
  nafCode: string | null
  pin: string
  logoUrl: string | null
}

const keys = {
  all: ["establishments"] as const,
  list: () => [...keys.all, "list"] as const,
  detail: (id: number) => [...keys.all, "detail", id] as const,
}

export function useEstablishments() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const storeData = useAdminStore((s) => s.establishments)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.list(),
    queryFn: () => fetchAllPages<ApiRestaurant>("restaurants/", {}),
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: storeData, isLoading: false, isError: false, source: "mock" as const }
  }

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    source: "api" as const,
  }
}

export function useEstablishment(id: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const storeData = useAdminStore((s) =>
    s.establishments.find((e) => e.id === String(id)),
  )

  const query = useQuery({
    queryKey: keys.detail(id!),
    queryFn: () => apiGet<ApiRestaurant>(`restaurants/${id}/`),
    enabled: !isDevMode && !!id,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: storeData ?? null, isLoading: false, source: "mock" as const }
  }

  return { data: query.data ?? null, isLoading: query.isLoading, source: "api" as const }
}

export function useCreateEstablishment() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const addEstablishment = useAdminStore((s) => s.addEstablishment)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiRestaurant>("restaurants/", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ["restaurants"] })
    },
  })

  if (isDevMode) {
    return {
      mutate: (data: Record<string, unknown>) => addEstablishment(data as never),
      isPending: false,
    }
  }

  return { mutate: mutation.mutate, isPending: mutation.isPending }
}

export function useUpdateEstablishment() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const updateEstablishment = useAdminStore((s) => s.updateEstablishment)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: Record<string, unknown> }) =>
      apiPut<ApiRestaurant>(`restaurants/${id}/`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ["restaurants"] })
    },
  })

  if (isDevMode) {
    return {
      mutate: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
        updateEstablishment(id, data as never),
      isPending: false,
    }
  }

  return { mutate: mutation.mutate, isPending: mutation.isPending }
}

export function useDeleteEstablishment() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const removeEstablishment = useAdminStore((s) => s.removeEstablishment)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: number | string) => apiDelete(`restaurants/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ["restaurants"] })
    },
  })

  if (isDevMode) {
    return {
      mutate: (id: string) => removeEstablishment(id),
      isPending: false,
    }
  }

  return { mutate: mutation.mutate, isPending: mutation.isPending }
}
