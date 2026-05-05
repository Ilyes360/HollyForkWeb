import { Navigate, Outlet } from "react-router"
import { useAuthStore } from "@/stores/auth-store"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { getAccessToken } from "@/api/client"

export default function GuestGuard() {
  const isDevMode = useDevModeStore((s) => s.isDevMode)

  // Dev mode: redirect to app (user is "logged in")
  if (isDevMode) {
    return <Navigate to="/" replace />
  }

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasToken = !!getAccessToken()

  if (isAuthenticated && hasToken) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
