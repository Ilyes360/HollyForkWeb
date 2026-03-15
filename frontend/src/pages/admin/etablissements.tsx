import { useState, useCallback, useContext, useEffect } from "react"
import { useNavigate } from "react-router"
import { useAdminStore } from "@/stores/admin-store"
import { AdminLayoutContext } from "./index"
import { EtablissementList } from "@/components/administration/etablissements/etablissement-list"
import { AddEtablissementDialog } from "@/components/administration/etablissements/add-etablissement-dialog"
import type { AddEtablissementFormValues } from "@/components/administration/etablissements/add-etablissement-dialog"
import { DeleteEtablissementDialog } from "@/components/administration/etablissements/delete-etablissement-dialog"

export default function EtablissementsPage() {
  const navigate = useNavigate()
  const establishments = useAdminStore((s) => s.establishments)
  const employees = useAdminStore((s) => s.employees)
  const addEstablishment = useAdminStore((s) => s.addEstablishment)
  const updateEstablishment = useAdminStore((s) => s.updateEstablishment)
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

  const handleAdd = useCallback(
    (data: AddEtablissementFormValues) => {
      const newEst = {
        id: `est-${Date.now()}`,
        name: data.name,
        address: data.location,
        phone: data.phone,
        email: data.email,
        siret: "",
        tvaNumber: "",
        legalForm: "",
        totalCapacity: 0,
        openingDays: [] as string[],
        services: [],
        storageZones: [],
        isActive: true,
        legalInfo: {
          licenseType: "",
          licenseNumber: "",
          insurance: "",
          erpCapacity: 0,
          notes: "",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addEstablishment(newEst as any)
      navigate(`/admin/etablissements/${newEst.id}`)
    },
    [addEstablishment, navigate]
  )

  const handleToggleActive = useCallback(
    (id: string) => {
      const est = establishments.find((e) => e.id === id)
      if (est) updateEstablishment(id, { isActive: !est.isActive })
    },
    [establishments, updateEstablishment]
  )

  const handleDelete = useCallback(
    (id: string) => {
      const est = establishments.find((e) => e.id === id)
      if (est) {
        setDeleteTarget({ id, name: est.name })
        setDeleteDialogOpen(true)
      }
    },
    [establishments]
  )

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      removeEstablishment(deleteTarget.id)
      setDeleteTarget(null)
    }
  }, [deleteTarget, removeEstablishment])

  return (
    <div className="space-y-4">
      <EtablissementList
        establishments={establishments}
        employees={employees}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      <AddEtablissementDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAdd}
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
