import { useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMutationWithDefaults } from "@/lib/use-mutation-defaults"
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAccessToken,
} from "@/api/client"
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
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.list(),
    queryFn: () => fetchAllPages<ApiRestaurant>("restaurants/", {}),
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
  })

  const establishments = useMemo(
    () => (query.data ?? []).map(apiRestaurantToEstablishment),
    [query.data]
  )

  return {
    data: establishments,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

export function useEstablishment(id: number | null) {
  const query = useQuery({
    queryKey: keys.detail(id!),
    queryFn: () => apiGet<ApiRestaurant>(`restaurants/${id}/`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  const mapped = useMemo(
    () => (query.data ? apiRestaurantToEstablishment(query.data) : null),
    [query.data]
  )

  return {
    data: mapped,
    raw: query.data ?? null,
    isLoading: query.isLoading,
  }
}

export function useCreateEstablishment() {
  const qc = useQueryClient()

  return useMutationWithDefaults({
    mutationFn: (data: {
      name: string
      address: string
      postalCode: string
      city: string
      phoneNumber: string
      siret?: string
      nafCode?: string | null
      pin?: string
      logoUrl?: string | null
    }) => apiPost<ApiRestaurant>("restaurants/", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ["restaurants"] })
    },
  })
}

export function useUpdateEstablishment() {
  const qc = useQueryClient()

  return useMutationWithDefaults({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string
      data: Partial<{
        name: string
        address: string
        postalCode: string
        city: string
        phoneNumber: string
        siret: string
        nafCode: string | null
        pin: string
        logoUrl: string | null
      }>
    }) => apiPatch<ApiRestaurant>(`restaurants/${id}/`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ["restaurants"] })
    },
  })
}

export function useDeleteEstablishment() {
  const qc = useQueryClient()

  return useMutationWithDefaults({
    mutationFn: (id: number | string) => apiDelete(`restaurants/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ["restaurants"] })
    },
  })
}
