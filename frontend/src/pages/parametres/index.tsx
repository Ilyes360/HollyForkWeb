import { Link, Outlet, useLocation } from "react-router"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePageTitle } from "@/hooks/use-page-title"

function getTabValue(pathname: string) {
  if (pathname.startsWith("/settings/notifications")) return "notifications"
  if (pathname.startsWith("/settings/billing")) return "billing"
  return "general"
}

export default function SettingsLayout() {
  usePageTitle("Paramètres")
  const { pathname } = useLocation()
  const tabValue = getTabValue(pathname)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez votre compte, notifications et facturation.</p>
      </div>
      <Tabs value={tabValue}>
        <TabsList>
          <TabsTrigger value="general" render={<Link to="/settings" />}>
            Mon compte
          </TabsTrigger>
          <TabsTrigger value="notifications" render={<Link to="/settings/notifications" />}>
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" render={<Link to="/settings/billing" />}>
            Facturation
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mx-auto max-w-3xl">
        <Outlet />
      </div>
    </div>
  )
}
