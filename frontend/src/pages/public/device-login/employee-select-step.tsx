import { useState, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  Loading03Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { useRestaurantEmployees } from "@/api/auth/queries"
import type { RestaurantEmployee } from "@/api/auth/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type EmployeeSelectStepProps = {
  deviceToken: string
  restaurantName: string
  onSelect: (employee: RestaurantEmployee) => void
  onBack: () => void
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const AVATAR_COLORS = [
  "bg-primary/15 text-primary",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
]

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function EmployeeSelectStep({
  deviceToken,
  restaurantName,
  onSelect,
  onBack,
}: EmployeeSelectStepProps) {
  const { data, isLoading, error } = useRestaurantEmployees(deviceToken)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!data?.employees) return []
    if (!search.trim()) return data.employees
    const q = search.toLowerCase()
    return data.employees.filter(
      (e) =>
        e.employeeFirstName.toLowerCase().includes(q) ||
        e.employeeLastName.toLowerCase().includes(q)
    )
  }, [data, search])

  if (error) {
    const httpError = error as unknown as { response?: { status?: number } }
    if (httpError.response?.status === 401) {
      toast.error("Session expirée. Veuillez reconfigurer l'appareil.")
      onBack()
      return null
    }
  }

  const showSearch = (data?.employees.length ?? 0) > 8

  return (
    <motion.div
      key="employee-select"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
      }}
      className="flex w-full max-w-2xl flex-col px-6 py-6"
    >
      {/* Header sticky: back + restaurant name + search */}
      <motion.div
        className="sticky top-0 z-10 flex items-center gap-3 bg-muted/40 pb-4"
        variants={fadeUp}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Changer d'établissement"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
        </Button>
        <span className="text-sm font-medium">{restaurantName}</span>
        {showSearch && (
          <div className="relative ml-auto w-48">
            <HugeiconsIcon
              icon={Search01Icon}
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
            />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
              aria-label="Rechercher un employé"
            />
          </div>
        )}
      </motion.div>

      {isLoading && (
        <motion.div
          className="flex flex-col items-center gap-3 py-12"
          variants={fadeUp}
        >
          <HugeiconsIcon
            icon={Loading03Icon}
            className="animate-spin text-muted-foreground"
            size={32}
          />
          <p className="text-sm text-muted-foreground">
            Chargement des employés...
          </p>
        </motion.div>
      )}

      {!isLoading && data && (
        <motion.div
          className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5"
          variants={fadeUp}
        >
          {filtered.map((employee) => (
            <button
              key={employee.employeeId}
              type="button"
              disabled={!employee.hasPin}
              onClick={() => onSelect(employee)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors",
                employee.hasPin
                  ? "hover:border-primary hover:bg-muted/50 active:bg-muted"
                  : "cursor-not-allowed opacity-40"
              )}
              title={
                !employee.hasPin
                  ? "Cet employé n'a pas de PIN configuré"
                  : undefined
              }
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-sm font-semibold",
                  getAvatarColor(employee.employeeId)
                )}
              >
                {getInitials(
                  employee.employeeFirstName,
                  employee.employeeLastName
                )}
              </div>
              <div className="text-center">
                <p className="text-xs leading-tight font-medium">
                  {employee.employeeFirstName} {employee.employeeLastName}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {employee.employeeType}
                </p>
              </div>
            </button>
          ))}
        </motion.div>
      )}

      {!isLoading && data && filtered.length === 0 && (
        <motion.p
          className="py-8 text-center text-sm text-muted-foreground"
          variants={fadeUp}
        >
          {search.trim()
            ? "Aucun employé trouvé."
            : "Aucun employé avec un PIN configuré."}
        </motion.p>
      )}
    </motion.div>
  )
}
