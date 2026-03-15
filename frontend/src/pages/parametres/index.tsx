import { Outlet } from "react-router"

export default function SettingsLayout() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">Paramètres</h1>
      <div className="mx-auto max-w-3xl">
        <Outlet />
      </div>
    </div>
  )
}
