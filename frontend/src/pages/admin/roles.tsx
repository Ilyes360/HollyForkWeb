import { useAdminStore } from "@/stores/admin-store"
import { RolesOverview } from "@/components/administration/roles/roles-overview"

export default function RolesPage() {
  const roles = useAdminStore((s) => s.roles)
  const employees = useAdminStore((s) => s.employees)

  return <RolesOverview roles={roles} employees={employees} />
}
