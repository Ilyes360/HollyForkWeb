import { useState, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SecurityLockIcon,
  Tick02Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useRoleHierarchy } from "@/hooks/use-roles"
import { usePageTitle } from "@/hooks/use-page-title"
import { cn } from "@/lib/utils"

// ── Permission display config ──

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
  view_ratios: "Voir les ratios",
  view_stats: "Voir les statistiques",
  view_sales: "Voir les ventes",
  access_accounting_exports: "Exports comptables",
  edit_notes: "Éditer les notes",
  take_orders: "Prendre les commandes",
  send_to_kitchen: "Envoyer en cuisine",
  send_to_bar: "Envoyer au bar",
  process_payments: "Encaisser",
  process_cash: "Gérer la caisse",
  close_register: "Clôturer la caisse",
  generate_invoices: "Générer les factures",
  track_tables: "Suivre les tables",
  manage_stocks: "Gérer les stocks",
  manage_suppliers: "Gérer les fournisseurs",
  manage_roles: "Gérer les rôles",
  manage_planning: "Gérer le planning",
  manage_settings: "Paramètres",
  manage_establishments: "Gérer les établissements",
}

type PermissionGroup = {
  label: string
  permissions: string[]
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "Gestion",
    permissions: [
      "manage_staff",
      "manage_establishment",
      "manage_establishments",
      "configure_establishment",
      "manage_roles",
      "manage_settings",
      "manage_licenses",
    ],
  },
  {
    label: "Cuisine & Carte",
    permissions: [
      "manage_recipes",
      "manage_menus",
      "manage_menu_items",
      "manage_pricing",
      "manage_stocks",
      "manage_suppliers",
      "manage_out_of_stock",
      "manage_material_needs",
      "validate_inventory",
    ],
  },
  {
    label: "Salle & Service",
    permissions: [
      "manage_reservations",
      "manage_service",
      "manage_planning",
      "manage_schedules",
      "assign_tables",
      "assign_servers",
      "track_tables",
      "take_orders",
      "send_to_kitchen",
      "send_to_bar",
      "edit_notes",
    ],
  },
  {
    label: "Finance & Rapports",
    permissions: [
      "view_revenue",
      "view_financial_reports",
      "view_global_stats",
      "view_all_establishments",
      "view_vat",
      "view_ratios",
      "view_stats",
      "view_sales",
      "access_accounting_exports",
      "process_payments",
      "process_cash",
      "close_register",
      "generate_invoices",
    ],
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

function getPermLabel(perm: string): string {
  return PERMISSION_LABELS[perm] ?? perm.replaceAll("_", " ")
}

export default function RolesPage() {
  usePageTitle("Rôles & Accès")
  const { data: roles, totalPermissions, isLoading } = useRoleHierarchy()
  const [search, setSearch] = useState("")
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Collect ALL unique permissions across all roles
  const allPermissions = useMemo(() => {
    const set = new Set<string>()
    for (const role of roles) {
      for (const p of role.permissions) set.add(p)
    }
    return set
  }, [roles])

  // Filter groups by search + only keep permissions that exist in data
  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim()
    return PERMISSION_GROUPS.map((group) => {
      const perms = group.permissions.filter((p) => {
        if (!allPermissions.has(p)) return false
        if (!q) return true
        return getPermLabel(p).toLowerCase().includes(q) || p.includes(q)
      })
      return { ...group, permissions: perms }
    }).filter((g) => g.permissions.length > 0)
  }, [search, allPermissions])

  // Uncategorized permissions (exist in data but not in any group)
  const categorizedPerms = useMemo(
    () => new Set(PERMISSION_GROUPS.flatMap((g) => g.permissions)),
    []
  )
  const uncategorized = useMemo(() => {
    const q = search.toLowerCase().trim()
    return [...allPermissions].filter((p) => {
      if (categorizedPerms.has(p)) return false
      if (!q) return true
      return getPermLabel(p).toLowerCase().includes(q) || p.includes(q)
    })
  }, [allPermissions, categorizedPerms, search])

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">
            Rôles & Accès
          </h1>
          <p className="text-sm text-muted-foreground">
            {roles.length} rôles · {totalPermissions || allPermissions.size}{" "}
            permissions
          </p>
        </div>
        <Badge variant="secondary">
          <HugeiconsIcon
            icon={SecurityLockIcon}
            strokeWidth={2}
            className="mr-1 size-3"
          />
          Lecture seule
        </Badge>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} className="relative max-w-xs">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
        />
        <Input
          type="text"
          placeholder="Filtrer les permissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </motion.div>

      {/* Matrix table */}
      <motion.div
        variants={fadeUp}
        className="overflow-x-auto rounded-lg border bg-background"
      >
        <table className="w-full text-sm">
          {/* Role columns header */}
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium text-muted-foreground">
                Permission
              </th>
              {roles.map((role) => (
                <th
                  key={role.name}
                  className="min-w-[120px] px-3 py-3 text-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold text-foreground">
                      {role.name}
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      Niv. {role.level} · {role.permissions.length} perm.
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.label)
              return (
                <PermissionGroupRows
                  key={group.label}
                  group={group}
                  roles={roles}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleGroup(group.label)}
                />
              )
            })}

            {uncategorized.length > 0 && (
              <PermissionGroupRows
                group={{ label: "Autres", permissions: uncategorized }}
                roles={roles}
                isCollapsed={collapsedGroups.has("Autres")}
                onToggle={() => toggleGroup("Autres")}
              />
            )}
          </tbody>
        </table>

        {filteredGroups.length === 0 && uncategorized.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Aucune permission ne correspond à "{search}"
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Sub-components ──

function PermissionGroupRows({
  group,
  roles,
  isCollapsed,
  onToggle,
}: {
  group: PermissionGroup
  roles: { name: string; permissions: string[] }[]
  isCollapsed: boolean
  onToggle: () => void
}) {
  // Count how many roles have at least one permission in this group
  const coverage = roles.map(
    (role) =>
      group.permissions.filter((p) => role.permissions.includes(p)).length
  )

  return (
    <>
      {/* Group header row */}
      <tr
        className="cursor-pointer border-b bg-muted/30 transition-colors hover:bg-muted/50"
        onClick={onToggle}
      >
        <td className="sticky left-0 z-10 bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className={cn(
                "size-3.5 text-muted-foreground transition-transform",
                isCollapsed && "-rotate-90"
              )}
              strokeWidth={2}
            />
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({group.permissions.length})
            </span>
          </div>
        </td>
        {coverage.map((count, i) => (
          <td key={roles[i].name} className="px-3 py-2.5 text-center">
            <span
              className={cn(
                "text-[10px] font-medium",
                count === group.permissions.length
                  ? "text-emerald-600 dark:text-emerald-400"
                  : count > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground/40"
              )}
            >
              {count}/{group.permissions.length}
            </span>
          </td>
        ))}
      </tr>

      {/* Permission rows */}
      {!isCollapsed &&
        group.permissions.map((perm, permIdx) => (
          <tr
            key={perm}
            className={cn(
              "border-b transition-colors last:border-b-0",
              permIdx % 2 === 0 ? "bg-background" : "bg-muted/10"
            )}
          >
            <td
              className={cn(
                "sticky left-0 z-10 px-4 py-2 pl-10 text-muted-foreground",
                permIdx % 2 === 0 ? "bg-background" : "bg-muted/10"
              )}
            >
              {getPermLabel(perm)}
            </td>
            {roles.map((role) => {
              const has = role.permissions.includes(perm)
              return (
                <td key={role.name} className="px-3 py-2 text-center">
                  {has ? (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="mx-auto size-4 text-emerald-500"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      className="mx-auto size-3.5 text-muted-foreground/20"
                      strokeWidth={1.5}
                    />
                  )}
                </td>
              )
            })}
          </tr>
        ))}
    </>
  )
}
