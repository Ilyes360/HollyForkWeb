import { useState, useCallback, useContext, useEffect } from "react"
import { useEstablishments, useDeleteEstablishment } from "@/hooks/use-establishments"
import { useEmployees } from "@/hooks/use-employees"
import { toast } from "sonner"
import { AdminLayoutContext } from "./index"
import { EtablissementList } from "@/components/administration/etablissements/etablissement-list"
import { DeleteEtablissementDialog } from "@/components/administration/etablissements/delete-etablissement-dialog"
import { CreateRestaurantDialog } from "@/components/layout/sidebar/create-restaurant-dialog"

export default function EtablissementsPage() {
  const { data: establishments } = useEstablishments()
  const { data: employees } = useEmployees()
  const { mutate: deleteEstablishment } = useDeleteEstablishment()

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
    deleteEstablishment(deleteTarget.id)
    toast.success("Restaurant supprimé")
    setDeleteTarget(null)
  }, [deleteTarget, deleteEstablishment])

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
