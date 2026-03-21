import { useMemo } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { getGreeting } from "@/lib/copy/dashboard"

export function useGreeting() {
  const firstName = useAuthStore((s) => s.user?.firstName ?? null)

  return useMemo(() => {
    const hour = new Date().getHours()
    return getGreeting(hour, firstName)
  }, [firstName])
}
