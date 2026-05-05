import { useRoles } from "@/hooks/use-roles"
import { useEmployees } from "@/hooks/use-employees"
import { RolesOverview } from "@/components/administration/roles/roles-overview"

export default function RolesPage() {
  const { data: roles } = useRoles()
  const { data: employees } = useEmployees()

  return <RolesOverview roles={roles} employees={employees} />
}
