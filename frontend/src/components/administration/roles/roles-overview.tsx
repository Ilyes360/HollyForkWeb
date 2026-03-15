import type { Role, Employee } from "../types"
import { RoleCard } from "./role-card"

interface RolesOverviewProps {
  roles: Role[]
  employees: Employee[]
}

export function RolesOverview({ roles, employees }: RolesOverviewProps) {
  const activeEmployees = employees.filter((e) => e.accountStatus === "active")
  const roleCounts = roles.map((role) => ({
    label: role.label,
    count: activeEmployees.filter((e) => e.roleId === role.id).length,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {activeEmployees.length} utilisateur{activeEmployees.length > 1 ? "s" : ""} actif
        {activeEmployees.length > 1 ? "s" : ""}
        {" — "}
        {roleCounts
          .filter((r) => r.count > 0)
          .map((r) => `${r.count} ${r.label}${r.count > 1 ? "s" : ""}`)
          .join(", ")}
      </p>
    </div>
  )
}
