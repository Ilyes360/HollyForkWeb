import { useState, useMemo, useCallback, useContext, useEffect } from "react"
import { useNavigate } from "react-router"
import { useAdminStore } from "@/stores/admin-store"
import { useEstablishments } from "@/hooks/use-establishments"
import { useEmployees, useDeleteEmployee } from "@/hooks/use-employees"
import { useRoles } from "@/hooks/use-roles"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { AdminLayoutContext } from "./index"
import { EmployesFilters } from "@/components/administration/employes/employes-filters"
import { EmployesTable } from "@/components/administration/employes/employes-table"
import { EmployeeSheet } from "@/components/administration/employes/employee-sheet"
import type { Employee } from "@/components/administration/types"
import { apiDelete } from "@/api/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export default function EmployesPage() {
  const navigate = useNavigate()
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const queryClient = useQueryClient()
  const { data: establishments } = useEstablishments()
  const { data: employees } = useEmployees()
  const { data: roles } = useRoles()
  const removeEmployeeStore = useAdminStore((s) => s.removeEmployee)
  const deleteEmployeeApi = useDeleteEmployee()

  const { setOnAdd } = useContext(AdminLayoutContext)

  const [search, setSearch] = useState("")
  const [posteFilter, setPosteFilter] = useState("tous")
  const [etablissementFilter, setEtablissementFilter] = useState("tous")
  const [statusFilter, setStatusFilter] = useState("tous")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp: Employee) => {
      if (search) {
        const q = search.toLowerCase()
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
        if (!fullName.includes(q)) return false
      }
      if (posteFilter !== "tous" && emp.position !== posteFilter) return false
      if (etablissementFilter !== "tous" && emp.establishmentId !== etablissementFilter) return false
      if (statusFilter !== "tous" && emp.accountStatus !== statusFilter) return false
      return true
    })
  }, [employees, search, posteFilter, etablissementFilter, statusFilter])

  const handleSelect = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    setSheetOpen(true)
  }, [])

  const handleEdit = useCallback((employee: Employee) => {
    navigate(`/admin/employes/${employee.id}`)
  }, [navigate])

  const handleAdd = useCallback(() => {
    navigate("/admin/employes/nouveau")
  }, [navigate])

  useEffect(() => {
    setOnAdd(handleAdd)
    return () => setOnAdd(null)
  }, [setOnAdd, handleAdd])

  const handleToggleStatus = useCallback(
    (id: string) => {
      if (isDevMode) {
        const emp = employees.find((e: Employee) => e.id === id)
        if (emp) {
          useAdminStore.getState().updateEmployee(id, {
            accountStatus: emp.accountStatus === "active" ? "disabled" : "active",
          })
        }
      }
      // Backend doesn't have an account status field — local only for now
    },
    [employees, isDevMode]
  )

  const handleDelete = useCallback(
    (id: string) => {
      if (isDevMode) {
        removeEmployeeStore(id)
      } else {
        apiDelete(`employes/${id}/`)
          .then(() => {
            toast.success("Employé supprimé")
            queryClient.invalidateQueries({ queryKey: ["employees"] })
          })
          .catch(() => toast.error("Erreur lors de la suppression"))
      }
      if (selectedEmployee?.id === id) {
        setSheetOpen(false)
        setSelectedEmployee(null)
      }
    },
    [isDevMode, removeEmployeeStore, selectedEmployee, queryClient]
  )

  return (
    <div className="space-y-4">
      <EmployesFilters
        search={search}
        onSearchChange={setSearch}
        posteFilter={posteFilter}
        onPosteFilterChange={setPosteFilter}
        etablissementFilter={etablissementFilter}
        onEtablissementFilterChange={setEtablissementFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        establishments={establishments}
      />

      <EmployesTable
        employees={filteredEmployees}
        establishments={establishments}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employee={selectedEmployee}
        establishments={establishments}
        roles={roles}
        onDelete={handleDelete}
      />
    </div>
  )
}
