import { Navigate, Outlet, useLocation } from "react-router"
import { useAuthStore } from "@/stores/auth-store"
import { useProfile } from "@/api/auth/queries"
import { getAccessToken, clearTokens, MOCK_MODE } from "@/api/client"

export default function AuthGuard() {
  const location = useLocation()

  // ── Mock mode: skip all auth checks ──────────────────────────────
  if (MOCK_MODE) {
    return <Outlet />
  }

  const token = getAccessToken()
  const clearUser = useAuthStore((s) => s.clearUser)
  const { isLoading, isError } = useProfile(!!token)

  // No token at all → login
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Token present, verifying profile
  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // Token invalid / expired (profile fetch failed)
  if (isError) {
    clearTokens()
    clearUser()
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Check for pending restaurant from register wizard
  const pendingRestaurant = sessionStorage.getItem("holly_pending_restaurant")
  if (pendingRestaurant && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
