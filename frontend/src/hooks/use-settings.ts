import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiGet, apiPatch, apiPost, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { fetchAllPages } from "@/api/pagination"
import type { PaginatedResponse } from "@/api/types"

// --- Restaurant settings (GET/PATCH /api/settings/restaurant/?restaurant_id=X) ---

export type ApiRestaurantSettings = {
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

// --- Profile (GET/PATCH /api/auth/profile/) ---

export type ApiProfile = {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  dateJoined: string
  isActive: boolean
  employeeId: number | null
  employeeName: string | null
}

// --- Notification settings (GET/POST/PATCH /api/settings/notifications/) ---

export type ApiNotificationSettings = {
  id: number
  restaurantId: number
  emailNotifications: boolean
  smsNotifications: boolean
  stockAlerts: boolean
  reservationAlerts: boolean
  commandAlerts: boolean
  createdAt: string
  updatedAt: string
}

// --- Billing settings (GET/POST/PATCH /api/settings/billing/) ---

export type ApiBillingSettings = {
  id: number
  restaurantId: number
  defaultVatRate: string
  currency: string
  autoInvoice: boolean
  createdAt: string
  updatedAt: string
}

// --- Payment methods (GET /api/billing/methodes-paiement/) ---

export type ApiMethodePaiement = {
  id: number
  name: string
  createdAt: string
}

// --- Notes (CRUD /api/notes/) ---

export type ApiNote = {
  id: number
  createdById: number
  createdByName: string
  restaurantId: number
  createdAt: string
  message: string
}

const keys = {
  profile: () => ["profile"] as const,
  restaurantSettings: (restaurantId?: number) => ["restaurant-settings", restaurantId] as const,
  notifications: (restaurantId?: number) => ["notification-settings", restaurantId] as const,
  billing: (restaurantId?: number) => ["billing-settings", restaurantId] as const,
  paymentMethods: () => ["payment-methods"] as const,
  notes: () => ["notes"] as const,
}

// ── Profile ──

export function useProfile() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.profile(),
    queryFn: () => apiGet<ApiProfile>("auth/profile/"),
    enabled: !isDevMode && hasToken,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: null, isLoading: false }
  }

  return { data: query.data ?? null, isLoading: query.isLoading }
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email?: string; firstName?: string; lastName?: string }) =>
      apiPatch<ApiProfile>("auth/profile/", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.profile() })
    },
  })
}

// ── Restaurant settings ──

export function useRestaurantSettings(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.restaurantSettings(restaurantId ?? undefined),
    queryFn: () =>
      apiGet<ApiRestaurantSettings>("settings/restaurant/", {
        restaurantId: restaurantId!,
      }),
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: null, isLoading: false }
  }

  return { data: query.data ?? null, isLoading: query.isLoading }
}

export function useUpdateRestaurantSettings(restaurantId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<ApiRestaurantSettings, "restaurantId">>) =>
      apiPatch<ApiRestaurantSettings>("settings/restaurant/", data, {
        searchParams: { restaurant_id: String(restaurantId!) },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.restaurantSettings(restaurantId ?? undefined) })
      qc.invalidateQueries({ queryKey: ["establishments"] })
    },
  })
}

// ── Notification settings ──

export function useNotificationSettings(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.notifications(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiNotificationSettings>>(
        "settings/notifications/",
        { restaurantId: restaurantId! },
      )
      return res.results[0] ?? null
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: null, isLoading: false }
  }

  return { data: query.data ?? null, isLoading: query.isLoading }
}

export function useUpsertNotificationSettings(restaurantId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      emailNotifications?: boolean
      smsNotifications?: boolean
      stockAlerts?: boolean
      reservationAlerts?: boolean
      commandAlerts?: boolean
      existingId?: number
    }) => {
      const { existingId, ...payload } = data
      if (existingId) {
        return apiPatch<ApiNotificationSettings>(
          `settings/notifications/${existingId}/`,
          payload,
        )
      }
      return apiPost<ApiNotificationSettings>(
        "settings/notifications/",
        { ...payload, restaurantId },
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.notifications(restaurantId ?? undefined) })
    },
  })
}

// ── Billing settings ──

export function useBillingSettings(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.billing(restaurantId ?? undefined),
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiBillingSettings>>(
        "settings/billing/",
        { restaurantId: restaurantId! },
      )
      return res.results[0] ?? null
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 5 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: null, isLoading: false }
  }

  return { data: query.data ?? null, isLoading: query.isLoading }
}

// ── Payment methods ──

export function usePaymentMethods() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: keys.paymentMethods(),
    queryFn: () => fetchAllPages<ApiMethodePaiement>("billing/methodes-paiement/", {}),
    enabled: !isDevMode && hasToken,
    staleTime: 10 * 60 * 1000,
  })

  if (isDevMode) {
    return { data: [], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}

// ── Notes ──

export function useNotes(restaurantId: number | null) {
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  const query = useQuery({
    queryKey: [...keys.notes(), restaurantId],
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<ApiNote>>("notes/", {
        restaurantId: restaurantId!,
      })
      return res.results
    },
    enabled: !isDevMode && hasToken && !!restaurantId,
    staleTime: 60 * 1000,
  })

  if (isDevMode) {
    return { data: [], isLoading: false }
  }

  return { data: query.data ?? [], isLoading: query.isLoading }
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { createdById: number; restaurantId: number; message: string }) =>
      apiPost<ApiNote>("notes/", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notes() }),
  })
}
