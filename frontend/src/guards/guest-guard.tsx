import { Navigate, Outlet } from "react-router"
import { useAuthStore } from "@/stores/auth-store"
import { getAccessToken, MOCK_MODE } from "@/api/client"

export default function GuestGuard() {
  // In mock mode, guest pages still accessible but also redirect to app
  if (MOCK_MODE) {
    return <Navigate to="/" replace />
  }

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasToken = !!getAccessToken()

  if (isAuthenticated && hasToken) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
