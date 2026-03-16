import { Navigate, Outlet } from "react-router"
import { usePermissions } from "@/hooks/use-permissions"

interface PermissionGuardProps {
  require?: string | string[]
  requireAny?: string[]
  fallback?: string
}

export default function PermissionGuard({
  require,
  requireAny,
  fallback = "/",
}: PermissionGuardProps) {
  const { can, canAny, isLoading } = usePermissions()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // Check required permissions
  if (require) {
    const perms = Array.isArray(require) ? require : [require]
    if (!perms.every((p) => can(p))) {
      return <Navigate to={fallback} replace />
    }
  }

  // Check requireAny permissions
  if (requireAny && !canAny(...requireAny)) {
    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}
