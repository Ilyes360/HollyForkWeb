import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Delete02Icon,
  UserIcon,
  Briefcase01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import type { Employee, Establishment } from "../types"
import { getInitials } from "../utils"

interface EmployeeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  establishments: Establishment[]
  onDelete?: (id: string) => void
}

function SectionTitle({
  icon,
  children,
}: {
  icon: IconSvgElement
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <HugeiconsIcon
        icon={icon}
        strokeWidth={2}
        className="size-4 text-muted-foreground"
      />
      {children}
    </div>
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

export function EmployeeSheet({
  open,
  onOpenChange,
  employee,
  establishments,
  onDelete,
}: EmployeeSheetProps) {
  const navigate = useNavigate()

  if (!employee) return null

  const est = establishments.find((e) => e.id === employee.establishmentId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: employee.avatarColor ?? "#9ca3af" }}
            >
              {getInitials(employee.firstName, employee.lastName)}
            </div>
            <div>
              <SheetTitle>
                {employee.firstName} {employee.lastName}
              </SheetTitle>
              <SheetDescription>{employee.typeEmployeName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 py-4">
          {/* Identité */}
          <div className="space-y-3">
            <SectionTitle icon={UserIcon}>Identité</SectionTitle>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <InfoField label="Téléphone" value={employee.phone} />
            </div>
          </div>

          {/* Contrat */}
          <div className="space-y-3">
            <SectionTitle icon={Briefcase01Icon}>Poste & contrat</SectionTitle>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <InfoField
                label="Type d'employé"
                value={employee.typeEmployeName}
              />
              <InfoField label="Établissement" value={est?.name ?? "—"} />
              <InfoField
                label="Salaire"
                value={`${employee.salary.toFixed(0)} €/mois`}
              />
              <InfoField
                label="Date d'embauche"
                value={
                  employee.hireDate
                    ? new Date(employee.hireDate).toLocaleDateString("fr-FR")
                    : "—"
                }
              />
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
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-4"
              />
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
