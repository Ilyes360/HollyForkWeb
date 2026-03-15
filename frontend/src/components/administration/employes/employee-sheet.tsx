import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, UserIcon, Briefcase01Icon, SecurityLockIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import type { Employee, Establishment, Role } from "../types"
import {
  POSITION_LABELS,
  CONTRACT_LABELS,
  ACCOUNT_STATUS_CONFIG,
} from "../types"
import { getInitials } from "../utils"

interface EmployeeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  establishments: Establishment[]
  roles: Role[]
  onDelete?: (id: string) => void
}

import type { IconSvgElement } from "@hugeicons/react"

function SectionTitle({ icon, children }: { icon: IconSvgElement; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4 text-muted-foreground" />
      {children}
    </div>
  )
}

export function EmployeeSheet({
  open,
  onOpenChange,
  employee,
  establishments,
  roles,
  onDelete,
}: EmployeeSheetProps) {
  const navigate = useNavigate()

  if (!employee) return null

  const est = establishments.find((e) => e.id === employee.establishmentId)
  const role = roles.find((r) => r.id === employee.roleId)
  const statusConfig = ACCOUNT_STATUS_CONFIG[employee.accountStatus]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-full text-sm font-medium text-white ${employee.avatarColor}`}
            >
              {getInitials(employee.firstName, employee.lastName)}
            </div>
            <div>
              <SheetTitle>
                {employee.firstName} {employee.lastName}
              </SheetTitle>
              <SheetDescription>{POSITION_LABELS[employee.position]}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 py-4">
          {/* Identité */}
          <div className="space-y-3">
            <SectionTitle icon={UserIcon}>Identité</SectionTitle>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <InfoField label="Email" value={employee.email} />
              <InfoField label="Téléphone" value={employee.phone} />
            </div>
          </div>

          {/* Contrat */}
          <div className="space-y-3">
            <SectionTitle icon={Briefcase01Icon}>Contrat</SectionTitle>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <InfoField label="Établissement" value={est?.name ?? "—"} />
              <InfoField label="Type de contrat" value={CONTRACT_LABELS[employee.contractType]} />
              <InfoField label="Heures/sem" value={`${employee.weeklyHours}h`} />
              <InfoField label="Taux horaire" value={`${employee.hourlyRate.toFixed(2)} €/h`} />
              <InfoField
                label="Date d'embauche"
                value={new Date(employee.hireDate).toLocaleDateString("fr-FR")}
              />
              {employee.endDate && (
                <InfoField
                  label="Date de fin"
                  value={new Date(employee.endDate).toLocaleDateString("fr-FR")}
                />
              )}
            </div>
          </div>

          {/* Accès */}
          <div className="space-y-3">
            <SectionTitle icon={SecurityLockIcon}>Accès</SectionTitle>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <InfoField label="Rôle application" value={role?.label ?? "—"} />
              <div>
                <span className="text-xs text-muted-foreground">Statut</span>
                <div className="mt-0.5">
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              onOpenChange(false)
              navigate(`/admin/employes/${employee.id}`)
            }}
          >
            Modifier
          </Button>
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onDelete(employee.id)}
              title="Supprimer"
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}
