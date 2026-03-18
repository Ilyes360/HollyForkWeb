import { useState, createContext, useContext, useCallback } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminHeader } from "@/components/administration/admin-header"
import { usePageTitle } from "@/hooks/use-page-title"

type AdminLayoutContextType = {
  onAdd: (() => void) | null
  setOnAdd: (fn: (() => void) | null) => void
}

const AdminLayoutContext = createContext<AdminLayoutContextType>({
  onAdd: null,
  setOnAdd: () => {},
})

export function useAdminLayoutAction(fn: () => void) {
  const { setOnAdd } = useContext(AdminLayoutContext)
  // Register on mount, unregister on unmount
  useState(() => {
    setOnAdd(() => fn)
    return null
  })
}

export { AdminLayoutContext }

function getTabValue(pathname: string) {
  if (pathname.startsWith("/admin/employes")) return "employes"
  if (pathname.startsWith("/admin/roles")) return "roles"
  if (pathname.startsWith("/admin/etablissements/")) return "etablissements"
  return "etablissements"
}

export default function AdminLayout() {
  usePageTitle("Administration")
  const { pathname } = useLocation()
  const isDetailPage = pathname.startsWith("/admin/etablissements/") || /^\/admin\/employes\/[^/]+$/.test(pathname)
  const [onAdd, setOnAdd] = useState<(() => void) | null>(null)

  const setOnAddStable = useCallback((fn: (() => void) | null) => {
    setOnAdd(() => fn)
  }, [])

  const tabValue = getTabValue(pathname)
  const showAddButton = tabValue !== "roles" && onAdd

  return (
    <AdminLayoutContext.Provider value={{ onAdd, setOnAdd: setOnAddStable }}>
      <div className="space-y-4">
        {!isDetailPage && (
          <>
            <AdminHeader />
            <div className="flex items-center justify-between">
              <Tabs value={tabValue}>
                <TabsList>
                  <TabsTrigger value="etablissements" render={<Link to="/admin" />}>
                    Établissements
                  </TabsTrigger>
                  <TabsTrigger value="employes" render={<Link to="/admin/employes" />}>
                    Employés
                  </TabsTrigger>
                  <TabsTrigger value="roles" render={<Link to="/admin/roles" />}>
                    Rôles & Accès
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {showAddButton && (
                <AddButton
                  label={tabValue === "employes" ? "Ajouter un employé" : "Ajouter"}
                  onClick={onAdd}
                />
              )}
            </div>
          </>
        )}
        <Outlet />
      </div>
    </AdminLayoutContext.Provider>
  )
}

import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
      {label}
    </Button>
  )
}
