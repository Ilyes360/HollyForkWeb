import { HugeiconsIcon } from "@hugeicons/react"
import { MoneyBag02Icon, PackageIcon, Clock01Icon, Store01Icon } from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardDescription, CardAction } from "@/components/ui/card"
import { formatCurrency } from "@/components/stocks/utils"
import type { SupplierFull, Order } from "./types"
import { getTotalMonthlySpend, getPendingOrderCount, getGlobalAvgDeliveryDays } from "./utils"

interface FournisseursKpisProps {
  suppliers: SupplierFull[]
  orders: Order[]
}

export function FournisseursKpis({ suppliers, orders }: FournisseursKpisProps) {
  const pendingCount = getPendingOrderCount(orders)

  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Fournisseurs actifs"
        value={String(suppliers.length)}
        icon={Store01Icon}
      />
      <KpiCard
        label="Commandes en cours"
        value={String(pendingCount)}
        icon={PackageIcon}
        accent={pendingCount > 0}
      />
      <KpiCard
        label="Dépenses du mois"
        value={formatCurrency(getTotalMonthlySpend(orders))}
        icon={MoneyBag02Icon}
      />
      <KpiCard
        label="Délai moyen"
        value={String(getGlobalAvgDeliveryDays(suppliers))}
        suffix="jours"
        icon={Clock01Icon}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  accent,
  suffix,
}: {
  label: string
  value: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  accent?: boolean
  suffix?: string
}) {
  return (
    <Card
      className={["h-full", accent ? "border-amber-500/30" : ""].filter(Boolean).join(" ")}
    >
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            {value}
            {suffix && (
              <span className="text-muted-foreground text-sm font-medium"> {suffix}</span>
            )}
          </h4>
        </div>
        <CardAction>
          <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
            <HugeiconsIcon icon={icon} className="size-5" strokeWidth={2} />
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
