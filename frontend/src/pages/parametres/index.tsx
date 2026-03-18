import { Outlet } from "react-router"
import { usePageTitle } from "@/hooks/use-page-title"

export default function SettingsLayout() {
  usePageTitle("Paramètres")
  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg font-semibold tracking-tight">Paramètres</h1>
      <div className="mx-auto max-w-3xl">
        <Outlet />
      </div>
    </div>
  )
}
