import { useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MoreHorizontalIcon,
  ViewIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SortableTableHead,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Employee, Establishment } from "../types"
import { getInitials } from "../utils"
import { useTableSort } from "@/hooks/use-table-sort"

type SortKey = "name" | "type" | "establishment" | "salary" | "hireDate"

interface EmployesTableProps {
  employees: Employee[]
  establishments: Establishment[]
  onSelect: (employee: Employee) => void
  onEdit?: (employee: Employee) => void
  onDelete?: (id: string) => void
}

export function EmployesTable({
  employees,
  establishments,
  onSelect,
  onEdit,
  onDelete,
}: EmployesTableProps) {
  const getSortValue = useCallback(
    (e: Employee, key: SortKey): string | number => {
      switch (key) {
        case "name":
          return `${e.firstName} ${e.lastName}`.toLowerCase()
        case "type":
          return e.typeEmployeName.toLowerCase()
        case "establishment": {
          const est = establishments.find((est) => est.id === e.establishmentId)
          return est?.name.toLowerCase() ?? ""
        }
        case "salary":
          return e.salary
        case "hireDate":
          return e.hireDate
        default:
          return 0
      }
    },
    [establishments]
  )

  const { sortedData, sortKey, sortDir, handleSort } = useTableSort<
    Employee,
    SortKey
  >({
    data: employees,
    defaultSortKey: "name",
    getSortValue,
    secondarySortKey: "name",
  })

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">Aucun employé trouvé.</p>
      </div>
    )
  }

  const sortProps = {
    activeSortKey: sortKey,
    sortDir,
    onSort: handleSort as (key: string) => void,
  }

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              label="Employé"
              sortKey="name"
              {...sortProps}
              className="min-w-[200px]"
            />
            <SortableTableHead
              label="Poste"
              sortKey="type"
              {...sortProps}
              className="w-[160px]"
            />
            <SortableTableHead
              label="Établissement"
              sortKey="establishment"
              {...sortProps}
              className="w-[150px]"
            />
            <SortableTableHead
              label="Salaire (€/mois)"
              sortKey="salary"
              {...sortProps}
              className="w-[130px]"
            />
            <SortableTableHead
              label="Embauche"
              sortKey="hireDate"
              {...sortProps}
              className="w-[120px]"
            />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((employee) => {
            const est = establishments.find(
              (e) => e.id === employee.establishmentId
            )
            return (
              <TableRow
                key={employee.id}
                className="cursor-pointer"
                onClick={() => onSelect(employee)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-8 items-center justify-center rounded-full text-xs font-medium text-white"
                      style={{
                        backgroundColor: employee.avatarColor ?? "#9ca3af",
                      }}
                    >
                      {getInitials(employee.firstName, employee.lastName)}
                    </div>
                    <span className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary">
                      {employee.typeEmployeName || "—"}
                    </Badge>
                    {employee.hasAccount && (
                      <span
                        className="size-2 rounded-full bg-emerald-500"
                        title="Accès dashboard actif"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {est?.name ?? "—"}
                </TableCell>
                <TableCell>{employee.salary.toFixed(0)} €</TableCell>
                <TableCell className="text-muted-foreground">
                  {employee.hireDate
                    ? new Date(employee.hireDate).toLocaleDateString("fr-FR")
                    : "—"}
                </TableCell>
                <TableCell>
                  {(onEdit || onDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          />
                        }
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <HugeiconsIcon
                          icon={MoreHorizontalIcon}
                          strokeWidth={2}
                          className="size-4"
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {onEdit && (
                          <DropdownMenuItem onSelect={() => onEdit(employee)}>
                            <HugeiconsIcon
                              icon={ViewIcon}
                              strokeWidth={2}
                              className="size-4"
                            />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => onDelete(employee.id)}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                            Supprimer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
