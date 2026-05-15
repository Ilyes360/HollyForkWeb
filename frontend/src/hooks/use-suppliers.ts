import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiPost, apiPut, apiDelete, getAccessToken } from "@/api/client"
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
 */
export function useSuppliers() {
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.suppliers(),
    queryFn: () => fetchAllPages<ApiSupplier>("suppliers/", {}),
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
  })

  const suppliers = useMemo(
    () => (query.data ?? []).map(apiSupplierToFull),
    [query.data],
  )

  return {
    data: suppliers,
    isLoading: query.isLoading,
  }
}

/**
 * Create supplier mutation.
 */
export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      contactName?: string | null
      email?: string | null
      telephone?: string | null
      address?: string | null
      city?: string | null
      postalCode?: string | null
      notes?: string | null
      isActive?: boolean
    }) => apiPost<ApiSupplier>("suppliers/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  })
}

/**
 * Update supplier mutation.
 */
export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{
      name: string
      contactName: string | null
      email: string | null
      telephone: string | null
      address: string | null
      city: string | null
      postalCode: string | null
      notes: string | null
      isActive: boolean
    }> }) => apiPut<ApiSupplier>(`suppliers/${id}/`, data),
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
