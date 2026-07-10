import { useEffect } from "react"
import { Navigate, Outlet, useLocation, useNavigate } from "react-router"
import { useAuthStore } from "@/stores/auth-store"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useProfile } from "@/api/auth/queries"
import { getAccessToken, clearTokens } from "@/api/client"

export default function AuthGuard() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const token = getAccessToken()
  const clearUser = useAuthStore((s) => s.clearUser)
  const { isLoading, isError } = useProfile(!isDevMode && !!token)

  // Listen for cross-tab logout
  useEffect(() => {
    function handleLogout() {
      clearUser()
      navigate("/login", { replace: true })
    }
    window.addEventListener("auth:logout", handleLogout)
    return () => window.removeEventListener("auth:logout", handleLogout)
  }, [clearUser, navigate])

  // Dev mode: bypass all auth checks
  if (isDevMode) {
    return <Outlet />
  }

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
  const pendingRestaurant = sessionStorage.getItem("holy_pending_restaurant")
  if (pendingRestaurant && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
