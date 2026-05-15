import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SecurityLockIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { apiGet, getAccessToken } from "@/api/client"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useRoles } from "@/hooks/use-roles"
import { useEmployees } from "@/hooks/use-employees"
import { RolesOverview } from "@/components/administration/roles/roles-overview"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePageTitle } from "@/hooks/use-page-title"

// ApiRole type removed — not used directly

type ApiHierarchy = {
  hierarchy: Array<{
    level: number
    role: string
    permissionsCount: number
  }>
}

type ApiMatrix = {
  matrix: Record<string, string[]>
}

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const PERMISSION_LABELS: Record<string, string> = {
  manage_staff: "Gérer le personnel",
  manage_reservations: "Gérer les réservations",
  manage_menus: "Gérer les menus",
  manage_recipes: "Gérer les recettes",
  manage_pricing: "Gérer les prix",
  manage_menu_items: "Gérer les articles",
  manage_schedules: "Gérer les plannings",
  manage_service: "Gérer le service",
  manage_establishment: "Gérer l'établissement",
  manage_out_of_stock: "Gérer les ruptures",
  manage_material_needs: "Gérer les besoins matériels",
  manage_licenses: "Gérer les licences",
  assign_tables: "Assigner les tables",
  assign_servers: "Assigner les serveurs",
  validate_inventory: "Valider l'inventaire",
  configure_establishment: "Configurer l'établissement",
  view_revenue: "Voir le CA",
  view_financial_reports: "Voir les rapports financiers",
  view_global_stats: "Voir les stats globales",
  view_all_establishments: "Voir tous les établissements",
  view_vat: "Voir la TVA",
  access_accounting_exports: "Exports comptables",
  edit_notes: "Éditer les notes",
  take_orders: "Prendre les commandes",
  send_to_kitchen: "Envoyer en cuisine",
  send_to_bar: "Envoyer au bar",
  process_payments: "Encaisser",
  process_cash: "Gérer la caisse",
  generate_invoices: "Générer les factures",
  track_tables: "Suivre les tables",
}

export default function RolesPage() {
  usePageTitle("Rôles & Accès")
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const hasToken = !!getAccessToken()

  // Dev mode: use old component
  const { data: roles } = useRoles()
  const { data: employees } = useEmployees()

  // User mode: fetch real hierarchy + matrix
  const { data: hierarchy } = useQuery({
    queryKey: ["permissions", "hierarchy"],
    queryFn: () => apiGet<ApiHierarchy>("staff/permissions/hierarchy/"),
    enabled: !isDevMode && hasToken,
    staleTime: 10 * 60 * 1000,
  })

  const { data: matrix } = useQuery({
    queryKey: ["permissions", "matrix"],
    queryFn: () => apiGet<ApiMatrix>("staff/permissions/matrix/"),
    enabled: !isDevMode && hasToken,
    staleTime: 10 * 60 * 1000,
  })

  if (isDevMode) {
    return <RolesOverview roles={roles as any} employees={employees} />
  }

  const sortedRoles = hierarchy?.hierarchy
    ?.slice()
    .sort((a, b) => a.level - b.level) ?? []

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">Rôles & Accès</h1>
          <p className="text-sm text-muted-foreground">
            {sortedRoles.length} rôles configurés — lecture seule
          </p>
        </div>
        <Badge variant="secondary">
          <HugeiconsIcon icon={SecurityLockIcon} strokeWidth={2} className="size-3 mr-1" />
          Non modifiable
        </Badge>
      </motion.div>

      {sortedRoles.map((role) => {
        const permissions = matrix?.matrix?.[role.role] ?? []
        return (
          <motion.div key={role.role} variants={fadeUp}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{role.role}</h3>
                    <p className="text-xs text-muted-foreground">
                      Niveau {role.level} · {role.permissionsCount} permissions
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Niveau {role.level}
                  </Badge>
                </div>
              </CardHeader>
              {permissions.length > 0 && (
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-2.5 text-green-500" />
                        {PERMISSION_LABELS[perm] ?? perm}
                      </span>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
