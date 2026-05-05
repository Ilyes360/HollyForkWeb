import { useMyPermissions } from "@/api/permissions/queries"
import { getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"

// Fallback: grant all permissions when API is unavailable (dev mode)
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
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()
  const { data } = useMyPermissions(!isDevMode && hasToken)

  // Dev mode: always grant all permissions
  const permissions = isDevMode
    ? DEV_FALLBACK_PERMISSIONS
    : (data?.permissions ?? DEV_FALLBACK_PERMISSIONS)

  return {
    permissions,
    role: isDevMode ? "Gérant" : (data?.roleName ?? "Gérant"),
    isLoading: false,
    can: (perm: string) => permissions.includes(perm),
    canAny: (...perms: string[]) => perms.some((p) => permissions.includes(p)),
    canAll: (...perms: string[]) => perms.every((p) => permissions.includes(p)),
  }
}
