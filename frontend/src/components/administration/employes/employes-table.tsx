import { useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  MoreHorizontalIcon,
  ViewIcon,
  Delete02Icon,
  Cancel01Icon,
  ChefHatIcon,
  CookBookIcon,
  Coffee01Icon,
  CleaningBucketIcon,
  UserIcon,
  UserMultiple02Icon,
  Settings01Icon,
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
import { POSITION_LABELS, ACCOUNT_STATUS_CONFIG } from "../types"
import { getInitials } from "../utils"
import { useTableSort } from "@/hooks/use-table-sort"
import type { PositionType } from "../types"

const POSITION_ICONS: Record<PositionType, IconSvgElement> = {
  chef_cuisinier: ChefHatIcon,
  second_de_cuisine: CookBookIcon,
  commis: CookBookIcon,
  chef_de_rang: UserMultiple02Icon,
  serveur: UserIcon,
  barman: Coffee01Icon,
  plongeur: CleaningBucketIcon,
  responsable_salle: UserMultiple02Icon,
  gerant: Settings01Icon,
}

type SortKey = "name" | "position" | "establishment" | "hours" | "rate" | "hireDate" | "status"

const STATUS_PRIORITY: Record<string, number> = {
  active: 0,
  inactive: 1,
  pending: 2,
}

interface EmployesTableProps {
  employees: Employee[]
  establishments: Establishment[]
  onSelect: (employee: Employee) => void
  onEdit: (employee: Employee) => void
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
}

export function EmployesTable({
  employees,
  establishments,
  onSelect,
  onEdit,
  onToggleStatus,
  onDelete,
}: EmployesTableProps) {
  const getSortValue = useCallback((e: Employee, key: SortKey): string | number => {
    switch (key) {
      case "name": return `${e.firstName} ${e.lastName}`.toLowerCase()
      case "position": return e.position
      case "establishment": {
        const est = establishments.find((est) => est.id === e.establishmentId)
        return est?.name.toLowerCase() ?? ""
      }
      case "hours": return e.weeklyHours
      case "rate": return e.hourlyRate
      case "hireDate": return e.hireDate
      case "status": return STATUS_PRIORITY[e.accountStatus] ?? 99
      default: return 0
    }
  }, [establishments])

  const { sortedData, sortKey, sortDir, handleSort } = useTableSort<Employee, SortKey>({
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

  const sortProps = { activeSortKey: sortKey, sortDir, onSort: handleSort as (key: string) => void }

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead label="Employé" sortKey="name" {...sortProps} className="min-w-[200px]" />
            <SortableTableHead label="Poste" sortKey="position" {...sortProps} className="w-[120px]" />
            <SortableTableHead label="Établissement" sortKey="establishment" {...sortProps} className="w-[150px]" />
            <SortableTableHead label="Heures/sem" sortKey="hours" {...sortProps} className="w-[100px]" />
            <SortableTableHead label="Taux (€/h)" sortKey="rate" {...sortProps} className="w-[100px]" />
            <SortableTableHead label="Embauche" sortKey="hireDate" {...sortProps} className="w-[120px]" />
            <SortableTableHead label="Statut" sortKey="status" {...sortProps} className="w-[100px]" />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((employee) => {
            const est = establishments.find((e) => e.id === employee.establishmentId)
            const statusConfig = ACCOUNT_STATUS_CONFIG[employee.accountStatus]
            return (
              <TableRow
                key={employee.id}
                className="cursor-pointer"
                onClick={() => onSelect(employee)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-full text-xs font-medium text-white ${employee.avatarColor}`}
                    >
                      {getInitials(employee.firstName, employee.lastName)}
                    </div>
                    <span className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1">
                    <HugeiconsIcon icon={POSITION_ICONS[employee.position]} strokeWidth={2} className="size-3" />
                    {POSITION_LABELS[employee.position]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{est?.name ?? "—"}</TableCell>
                <TableCell>{employee.weeklyHours}h</TableCell>
                <TableCell>{employee.hourlyRate.toFixed(2)} €</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(employee.hireDate).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="size-8" />
                      }
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <DropdownMenuItem onSelect={() => onEdit(employee)}>
                        <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onToggleStatus(employee.id)}>
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
                        {employee.accountStatus === "active" ? "Désactiver" : "Activer"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => onDelete(employee.id)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
