import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalIcon, Delete02Icon, ViewIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Establishment, Employee } from "../types"
import { formatAddress, formatServiceTime, getEmployeeCount } from "../utils"

interface EtablissementCardProps {
  establishment: Establishment
  employees: Employee[]
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
}

export function EtablissementCard({
  establishment,
  employees,
  onToggleActive,
  onDelete,
}: EtablissementCardProps) {
  const navigate = useNavigate()
  const employeeCount = getEmployeeCount(employees, establishment.id)

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => navigate(`/admin/etablissements/${establishment.id}`)}
    >
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3 className="font-medium leading-none truncate">{establishment.name}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {formatAddress(establishment)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={establishment.isActive ? "success" : "outline"}>
            {establishment.isActive ? "Actif" : "Inactif"}
          </Badge>
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
              <DropdownMenuItem
                onSelect={() => navigate(`/admin/etablissements/${establishment.id}`)}
              >
                <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onToggleActive(establishment.id)}>
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
                {establishment.isActive ? "Désactiver" : "Activer"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => onDelete(establishment.id)}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Téléphone</span>
            <p className="font-medium">{establishment.phone || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Capacité</span>
            <p className="font-medium">{establishment.totalCapacity} couverts</p>
          </div>
          <div>
            <span className="text-muted-foreground">Employés</span>
            <p className="font-medium">{employeeCount}</p>
          </div>
        </div>
        {establishment.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {establishment.services.map((service) => (
              <Badge key={service.id} variant="secondary" className="text-xs">
                {service.name} {formatServiceTime(service.startTime, service.endTime)}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
