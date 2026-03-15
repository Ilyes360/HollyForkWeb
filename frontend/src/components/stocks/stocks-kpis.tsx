import { HugeiconsIcon } from "@hugeicons/react"
import { MoneyBag02Icon, PackageIcon, Alert02Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardDescription, CardAction } from "@/components/ui/card"
import type { Product } from "./types"
import { getProductStatus, getProductValue, formatCurrency } from "./utils"

interface StocksKpisProps {
  products: Product[]
  onAlertClick: () => void
}

export function StocksKpis({ products, onAlertClick }: StocksKpisProps) {
  const totalValue = products.reduce((sum, p) => sum + getProductValue(p), 0)
  const inStock = products.filter((p) => p.quantity > 0).length
  const alertCount = products.filter((p) => {
    const s = getProductStatus(p)
    return s === "rupture" || s === "stock_faible"
  }).length
  const avgRotation = products.length > 0
    ? Math.round(products.reduce((sum, p) => sum + p.rotation, 0) / products.length)
    : 0

  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Valeur totale du stock"
        value={formatCurrency(totalValue)}
        icon={MoneyBag02Icon}
      />
      <KpiCard
        label="Articles en stock"
        value={String(inStock)}
        icon={PackageIcon}
      />
      <KpiCard
        label="Alertes stock"
        value={String(alertCount)}
        icon={Alert02Icon}
        accent={alertCount > 0}
        onClick={onAlertClick}
      />
      <KpiCard
        label="Rotation moyenne"
        value={String(avgRotation)}
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
  onClick,
}: {
  label: string
  value: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  accent?: boolean
  suffix?: string
  onClick?: () => void
}) {
  return (
    <Card
      className={[
        "h-full",
        accent ? "border-amber-500/30" : "",
        onClick ? "cursor-pointer" : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
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
