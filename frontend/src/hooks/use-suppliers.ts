import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useInventoryStore } from "@/stores/inventory-store"
import { fetchAllPages } from "@/api/pagination"
import type { SupplierFull } from "@/components/commandes/types"

export type ApiSupplier = {
  id: number
  name: string
  contactName: string | null
  email: string | null
  telephone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  notes: string | null
  isActive: boolean
  joursLivraison?: { id: number; jour: string; deliveryTime: string }[]
}

function apiSupplierToFull(s: ApiSupplier): SupplierFull {
  return {
    id: String(s.id),
    name: s.name,
    category: "epicerie",
    phone: s.telephone ?? "",
    email: s.email ?? "",
    address: [s.address, s.postalCode, s.city].filter(Boolean).join(", "),
    averageDeliveryDays: 3,
    notes: s.notes ?? "",
  }
}

const keys = {
  suppliers: () => ["suppliers"] as const,
}

/**
 * Fetch suppliers list.
 * Dev mode: returns from inventory store. User mode: fetches from API.
 */
export function useSuppliers() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()
  const storeSuppliers = useInventoryStore((s) => s.suppliers)

  const query = useQuery({
    queryKey: keys.suppliers(),
    queryFn: () => fetchAllPages<ApiSupplier>("suppliers/", {}),
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  const suppliers = useMemo(
    () => (query.data ?? []).map(apiSupplierToFull),
    [query.data],
  )

  if (isDevMode) {
    return {
      data: storeSuppliers,
      isLoading: false,
      source: "mock" as const,
    }
  }

  return {
    data: suppliers,
    isLoading: query.isLoading,
    source: "api" as const,
  }
}

/**
 * Create supplier mutation.
 */
export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<ApiSupplier>("suppliers/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}

/**
 * Update supplier mutation.
 */
export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      apiPut<ApiSupplier>(`suppliers/${id}/`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}

/**
 * Delete supplier mutation.
 */
export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete(`suppliers/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}
