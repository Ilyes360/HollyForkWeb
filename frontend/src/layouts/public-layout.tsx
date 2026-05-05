import { Outlet, useLocation } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ForkIcon } from "@hugeicons/core-free-icons"


export default function PublicLayout() {
  const location = useLocation()
  const isOnboarding = location.pathname === "/onboarding"

  return (
    <div className="relative flex h-svh items-center justify-center overflow-hidden bg-muted/40 p-4">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <HugeiconsIcon
          icon={ForkIcon}
          className="size-6 text-primary"
          strokeWidth={2}
        />
        <span className="text-lg font-semibold">Holly Fork</span>
      </div>
      <div className={`w-full ${isOnboarding ? "max-w-2xl" : "max-w-sm"}`}>
        <Outlet />
      </div>
    </div>
  )
}
