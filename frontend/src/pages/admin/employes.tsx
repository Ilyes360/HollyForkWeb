import { useState, useMemo, useCallback, useContext, useEffect } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, Building06Icon } from "@hugeicons/core-free-icons"
import { useEstablishments } from "@/hooks/use-establishments"
import {
  useEmployees,
  useEmployeeTypes,
  useDeleteEmployee,
} from "@/hooks/use-employees"
import { useAllRestaurantAssignments } from "@/hooks/use-restaurant-employees"
import { AdminLayoutContext } from "./index"
import { EmployesFilters } from "@/components/administration/employes/employes-filters"
import { EmployesTable } from "@/components/administration/employes/employes-table"
import { EmployeeSheet } from "@/components/administration/employes/employee-sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Employee } from "@/components/administration/types"
import { toast } from "sonner"

export default function EmployesPage() {
  const navigate = useNavigate()
  const { data: establishments } = useEstablishments()
  const { data: employees } = useEmployees()
  const { data: employeeTypes } = useEmployeeTypes()
  const { data: assignments } = useAllRestaurantAssignments()
  const deleteEmployeeMutation = useDeleteEmployee()

  const { setOnAdd } = useContext(AdminLayoutContext)

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("tous")
  const [etablissementFilter, setEtablissementFilter] = useState("tous")

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  )

  // Build a map: employeId → restaurantId
  const employeeToRestaurant = useMemo(() => {
    const map = new Map<string, string>()
    for (const a of assignments) {
      map.set(String(a.employeId), String(a.restaurantId))
    }
    return map
  }, [assignments])

  // Enrich employees with their establishment
  const enrichedEmployees = useMemo(
    () =>
      employees.map((emp) => ({
        ...emp,
        establishmentId: employeeToRestaurant.get(emp.id),
      })),
    [employees, employeeToRestaurant]
  )

  const filteredEmployees = useMemo(() => {
    return enrichedEmployees.filter((emp) => {
      if (search) {
        const q = search.toLowerCase()
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
        if (!fullName.includes(q)) return false
      }
      if (typeFilter !== "tous" && String(emp.typeEmployeId) !== typeFilter)
        return false
      if (
        etablissementFilter !== "tous" &&
        emp.establishmentId !== etablissementFilter
      )
        return false
      return true
    })
  }, [enrichedEmployees, search, typeFilter, etablissementFilter])

  // Group employees by establishment
  const grouped = useMemo(() => {
    const groups: { id: string; name: string; employees: Employee[] }[] = []

    // Group by establishment
    const byEstablishment = new Map<string, Employee[]>()
    const unassigned: Employee[] = []

    for (const emp of filteredEmployees) {
      if (emp.establishmentId) {
        const list = byEstablishment.get(emp.establishmentId) ?? []
        list.push(emp)
        byEstablishment.set(emp.establishmentId, list)
      } else {
        unassigned.push(emp)
      }
    }

    // Sort establishments by name
    for (const est of establishments) {
      const emps = byEstablishment.get(est.id)
      if (emps && emps.length > 0) {
        groups.push({ id: est.id, name: est.name, employees: emps })
      }
    }

    if (unassigned.length > 0) {
      groups.push({
        id: "__unassigned__",
        name: "Non assignés",
        employees: unassigned,
      })
    }

    return groups
  }, [filteredEmployees, establishments])

  const handleSelect = useCallback((employee: Employee) => {
    setSelectedEmployee(employee)
    setSheetOpen(true)
  }, [])

  const handleEdit = useCallback(
    (employee: Employee) => {
      navigate(`/admin/employes/${employee.id}`)
    },
    [navigate]
  )

  const handleAdd = useCallback(() => {
    navigate("/admin/employes/nouveau")
  }, [navigate])

  useEffect(() => {
    setOnAdd(handleAdd)
    return () => setOnAdd(null)
  }, [setOnAdd, handleAdd])

  const handleDelete = useCallback(
    (id: string) => {
      deleteEmployeeMutation.mutate(Number(id), {
        onSuccess: () => {
          toast.success("Employé supprimé")
          if (selectedEmployee?.id === id) {
            setSheetOpen(false)
            setSelectedEmployee(null)
          }
        },
        onError: () => toast.error("Erreur lors de la suppression"),
      })
    },
    [deleteEmployeeMutation, selectedEmployee]
  )

  return (
    <div className="space-y-4">
      <EmployesFilters
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        etablissementFilter={etablissementFilter}
        onEtablissementFilterChange={setEtablissementFilter}
        establishments={establishments}
        employeeTypes={employeeTypes}
      />

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Aucun employé trouvé.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((group) => (
            <Collapsible
              key={group.id}
              defaultOpen
              className="rounded-lg border bg-background"
            >
              <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
                <span className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={Building06Icon}
                    strokeWidth={2}
                    className="size-4 text-muted-foreground"
                  />
                  {group.name}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({group.employees.length})
                  </span>
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t">
                  <EmployesTable
                    employees={group.employees}
                    establishments={establishments}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      <EmployeeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employee={selectedEmployee}
        establishments={establishments}
        onDelete={handleDelete}
      />
    </div>
  )
}
