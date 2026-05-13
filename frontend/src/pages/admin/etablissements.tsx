import { useState, useCallback, useContext, useEffect } from "react"
import { useNavigate } from "react-router"
import { useEstablishments } from "@/hooks/use-establishments"
import { useEmployees } from "@/hooks/use-employees"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useAdminStore } from "@/stores/admin-store"
import { apiDelete } from "@/api/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AdminLayoutContext } from "./index"
import { EtablissementList } from "@/components/administration/etablissements/etablissement-list"
import { DeleteEtablissementDialog } from "@/components/administration/etablissements/delete-etablissement-dialog"
import { CreateRestaurantDialog } from "@/components/layout/sidebar/create-restaurant-dialog"

export default function EtablissementsPage() {
  const navigate = useNavigate()
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const queryClient = useQueryClient()
  const { data: establishments } = useEstablishments()
  const { data: employees } = useEmployees()
  const addEstablishment = useAdminStore((s) => s.addEstablishment)
  const removeEstablishment = useAdminStore((s) => s.removeEstablishment)

  const { setOnAdd } = useContext(AdminLayoutContext)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const openAddDialog = useCallback(() => setAddDialogOpen(true), [])

  useEffect(() => {
    setOnAdd(openAddDialog)
    return () => setOnAdd(null)
  }, [setOnAdd, openAddDialog])

  const handleToggleActive = useCallback(
    (_id: string) => {
      // Backend doesn't have isActive field — no-op
    },
    []
  )

  const handleDelete = useCallback(
    (id: string) => {
      const est = establishments.find((e: Record<string, unknown>) =>
        String(e.id ?? e.restaurantId) === id
      )
      if (est) {
        setDeleteTarget({ id, name: (est as { name: string }).name })
        setDeleteDialogOpen(true)
      }
    },
    [establishments]
  )

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return

    if (isDevMode) {
      removeEstablishment(deleteTarget.id)
    } else {
      apiDelete(`restaurants/${deleteTarget.id}/`)
        .then(() => {
          toast.success("Restaurant supprimé")
          queryClient.invalidateQueries({ queryKey: ["establishments"] })
          queryClient.invalidateQueries({ queryKey: ["restaurants"] })
        })
        .catch(() => toast.error("Erreur lors de la suppression"))
    }
    setDeleteTarget(null)
  }, [deleteTarget, isDevMode, removeEstablishment, queryClient])

  return (
    <div className="space-y-4">
      <EtablissementList
        establishments={establishments}
        employees={employees}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      <CreateRestaurantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <DeleteEtablissementDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        establishmentName={deleteTarget?.name ?? ""}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
