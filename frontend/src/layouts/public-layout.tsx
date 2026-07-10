import { Outlet, useLocation } from "react-router"

export default function PublicLayout() {
  const location = useLocation()
  const isOnboarding = location.pathname === "/onboarding"

  return (
    <div className="relative flex h-svh items-center justify-center overflow-hidden bg-muted/40 p-4">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <img src="/holyfork-logo.svg" alt="Holy Fork" className="h-7" />
      </div>
      <div className={`w-full ${isOnboarding ? "max-w-2xl" : "max-w-sm"}`}>
        <Outlet />
      </div>
    </div>
  )
}
