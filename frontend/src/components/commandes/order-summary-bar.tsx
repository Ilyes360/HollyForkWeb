import { HugeiconsIcon } from "@hugeicons/react"
import { PackageIcon, Invoice01Icon, UserGroupIcon, Calendar03Icon } from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/components/stock/utils"

interface OrderSummaryBarProps {
  pendingCount: number
  pendingAmount: number
  supplierCount: number
  monthlySpend: number
}

const stats = [
  { key: "pending", icon: PackageIcon, format: (v: number) => `${v} en cours` },
  { key: "amount", icon: Invoice01Icon, format: (v: number) => `${formatCurrency(v)} en attente` },
  { key: "suppliers", icon: UserGroupIcon, format: (v: number) => `${v} fournisseur${v > 1 ? "s" : ""}` },
  { key: "monthly", icon: Calendar03Icon, format: (v: number) => `${formatCurrency(v)} ce mois` },
] as const

export function OrderSummaryBar({
  pendingCount,
  pendingAmount,
  supplierCount,
  monthlySpend,
}: OrderSummaryBarProps) {
  const values = [pendingCount, pendingAmount, supplierCount, monthlySpend]

  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {stats.map((stat, i) => (
          <div key={stat.key} className="flex items-center gap-2 text-sm">
            {i > 0 && (
              <span className="hidden text-muted-foreground/40 sm:inline">·</span>
            )}
            <HugeiconsIcon
              icon={stat.icon}
              className="size-4 text-muted-foreground"
              strokeWidth={2}
            />
            <span className="font-medium">{stat.format(values[i])}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
