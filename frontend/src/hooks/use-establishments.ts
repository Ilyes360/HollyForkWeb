import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPost, apiPatch, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useAdminStore } from "@/stores/admin-store"
import { fetchAllPages } from "@/api/pagination"
import type { Establishment } from "@/stores/admin-types"

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

function apiRestaurantToEstablishment(r: ApiRestaurant): Establishment {
  return {
    id: String(r.restaurantId),
    name: r.name,
    address: {
      fullAddress: [r.address, r.postalCode, r.city].filter(Boolean).join(", "),
      city: r.city ?? "",
      postalCode: r.postalCode ?? "",
      country: "France",
      longitude: 0,
      latitude: 0,
      mapboxId: "",
    },
    phone: r.phoneNumber ?? "",
    email: "",
    siret: r.siret ?? "",
    tvaNumber: "",
    legalForm: "",
    totalCapacity: 0,
    openingDays: [],
    services: [],
    storageZones: [],
    isActive: true,
    legalInfo: {
      licenseType: "",
      licenseNumber: "",
      insurance: "",
      erpCapacity: 0,
      notes: "",
    },
    createdAt: "",
    updatedAt: "",
  }
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

  const establishments = useMemo(
    () => (query.data ?? []).map(apiRestaurantToEstablishment),
    [query.data],
  )

  if (isDevMode) {
    return { data: storeData, isLoading: false, isError: false, source: "mock" as const }
  }

  return {
    data: establishments,
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

  const mapped = useMemo(
    () => (query.data ? apiRestaurantToEstablishment(query.data) : null),
    [query.data],
  )

  if (isDevMode) {
    return { data: storeData ?? null, raw: null as ApiRestaurant | null, isLoading: false, source: "mock" as const }
  }

  return {
    data: mapped,
    raw: query.data ?? null,
    isLoading: query.isLoading,
    source: "api" as const,
  }
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
      apiPatch<ApiRestaurant>(`restaurants/${id}/`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ["restaurants"] })
    },
  })

  if (isDevMode) {
    return {
      mutate: (vars: { id: string; data: Record<string, unknown> }, _opts?: any) =>
        updateEstablishment(vars.id, vars.data as never),
      isPending: false,
    }
  }

  return { mutate: mutation.mutate as any, isPending: mutation.isPending }
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
      mutate: (id: string, opts?: { onSuccess?: () => void; onError?: () => void }) => {
        removeEstablishment(id)
        opts?.onSuccess?.()
      },
      isPending: false,
    }
  }

  return { mutate: mutation.mutate, isPending: mutation.isPending }
}
