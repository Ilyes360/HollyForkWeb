import { useMyPermissions } from "@/api/permissions/queries"
import { getAccessToken } from "@/api/client"

export function usePermissions() {
  const hasToken = !!getAccessToken()
  const { data, isLoading } = useMyPermissions(hasToken)

  // No fallback — if the API hasn't responded yet, no permissions are granted.
  // This prevents unauthenticated or role-less users from seeing everything.
  const permissions = data?.permissions ?? []

  return {
    permissions,
    role: data?.role ?? null,
    isLoading,
    can: (perm: string) => permissions.includes(perm),
    canAny: (...perms: string[]) => perms.some((p) => permissions.includes(p)),
    canAll: (...perms: string[]) => perms.every((p) => permissions.includes(p)),
  }
}
