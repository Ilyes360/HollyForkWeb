import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import type { Role } from "../types"
import { PAGE_LABELS } from "../types"

interface RoleCardProps {
  role: Role
}

const PAGES = [
  "dashboard",
  "reservations",
  "salle",
  "planning",
  "cuisine",
  "stocks",
  "fournisseurs",
  "admin",
] as const

export function RoleCard({ role }: RoleCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-medium">{role.label}</h3>
        <p className="text-sm text-muted-foreground">{role.description}</p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <div className="grid grid-cols-[1fr_80px_80px] gap-2 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>Page</span>
            <span className="text-center">Voir</span>
            <span className="text-center">Modifier</span>
          </div>
          {PAGES.map((page) => {
            const perm = role.permissions[page]
            return (
              <div
                key={page}
                className="grid grid-cols-[1fr_80px_80px] items-center gap-2 border-b px-3 py-2 last:border-b-0"
              >
                <span className="text-sm">{PAGE_LABELS[page]}</span>
                <div className="flex justify-center">
                  <Switch checked={perm?.read ?? false} disabled />
                </div>
                <div className="flex justify-center">
                  <Switch checked={perm?.write ?? false} disabled />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
