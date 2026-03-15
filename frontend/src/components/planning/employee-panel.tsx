import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import type { Employee, Department, Shift } from "./types"
import { DEPARTMENT_LABELS } from "./constants"
import { getWeeklyHours } from "./utils"
import { EmployeeCard } from "./employee-card"

interface EmployeePanelProps {
  employees: Employee[]
  shifts: Shift[]
}

export function EmployeePanel({ employees, shifts }: EmployeePanelProps) {
  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<
    Department | "all"
  >("all")

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        search === "" ||
        `${emp.firstName} ${emp.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      const matchesDept =
        departmentFilter === "all" || emp.department === departmentFilter
      return matchesSearch && matchesDept
    })
  }, [employees, search, departmentFilter])

  return (
    <Sidebar collapsible="none" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
            />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
          <Select
            value={departmentFilter}
            onValueChange={(v) =>
              setDepartmentFilter(v as Department | "all")
            }
          >
            <SelectTrigger className="h-7 w-auto shrink-0 text-xs">
              <SelectValue placeholder="Tous les postes" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="p-1">
              <SelectItem value="all">Planning</SelectItem>
              {(
                Object.entries(DEPARTMENT_LABELS) as [Department, string][]
              ).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-4 py-3">
            {filtered.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                weeklyHours={getWeeklyHours(shifts, emp.id)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Aucun employé trouvé
              </p>
            )}
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}
