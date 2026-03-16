import { useMyPermissions } from "@/api/permissions/queries"
import { getAccessToken, MOCK_MODE } from "@/api/client"

// Fallback: grant all permissions when API is unavailable (dev/mock mode)
const DEV_FALLBACK_PERMISSIONS = [
  "manage_staff",
  "manage_establishments",
  "manage_roles",
  "manage_planning",
  "manage_reservations",
  "manage_stocks",
  "manage_suppliers",
  "manage_settings",
]

export function usePermissions() {
  const hasToken = !!getAccessToken()
  const { data } = useMyPermissions(!MOCK_MODE && hasToken)

  // Use API permissions when available, otherwise always grant dev permissions
  const permissions = data?.permissions ?? DEV_FALLBACK_PERMISSIONS

  return {
    permissions,
    role: data?.roleName ?? "Gérant",
    isLoading: false,
    can: (perm: string) => permissions.includes(perm),
    canAny: (...perms: string[]) => perms.some((p) => permissions.includes(p)),
    canAll: (...perms: string[]) => perms.every((p) => permissions.includes(p)),
  }
}
