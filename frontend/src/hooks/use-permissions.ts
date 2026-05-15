import { useMyPermissions } from "@/api/permissions/queries"
import { getAccessToken } from "@/api/client"

// Fallback: grant all permissions when API permissions are not yet configured
const FALLBACK_PERMISSIONS = [
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
  const { data } = useMyPermissions(hasToken)

  // Until backend roles are properly configured, always grant all manage_* permissions
  const permissions = [...new Set([...(data?.permissions ?? []), ...FALLBACK_PERMISSIONS])]

  return {
    permissions,
    role: data?.roleName ?? "Gerant",
    isLoading: false,
    can: (perm: string) => permissions.includes(perm),
    canAny: (...perms: string[]) => perms.some((p) => permissions.includes(p)),
    canAll: (...perms: string[]) => perms.every((p) => permissions.includes(p)),
  }
}
