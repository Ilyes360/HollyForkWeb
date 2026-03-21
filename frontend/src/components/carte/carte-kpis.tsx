import { HugeiconsIcon } from "@hugeicons/react"
import { NoteIcon, PercentCircleIcon, Tick02Icon, PackageIcon } from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardDescription, CardAction } from "@/components/ui/card"
import { getCarteKpiInsight } from "@/lib/copy/carte"
import { InsightText } from "@/components/shared/insight-text"
import type { CopyInsight } from "@/lib/copy/types"

interface CarteKpisProps {
  totalActiveRecipes: number
  totalFeasibleRecipes: number
  averageFoodCost: number
  totalPortions: number
  onAlertClick: () => void
}

export function CarteKpis({
  totalActiveRecipes,
  totalFeasibleRecipes,
  averageFoodCost,
  totalPortions,
  onAlertClick,
}: CarteKpisProps) {
  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Recettes actives"
        value={String(totalActiveRecipes)}
        icon={NoteIcon}
      />
      <KpiCard
        label="Food Cost moyen"
        value={`${averageFoodCost.toFixed(1)}%`}
        icon={PercentCircleIcon}
        insight={getCarteKpiInsight("averageFoodCost", averageFoodCost)}
      />
      <KpiCard
        label="Realisables"
        value={`${totalFeasibleRecipes} / ${totalActiveRecipes}`}
        icon={Tick02Icon}
        insight={getCarteKpiInsight("feasible", totalFeasibleRecipes, totalActiveRecipes)}
      />
      <KpiCard
        label="Portions totales"
        value={String(totalPortions)}
        icon={PackageIcon}
        onClick={onAlertClick}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  onClick,
  insight,
}: {
  label: string
  value: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  onClick?: () => void
  insight?: CopyInsight | null
}) {
  return (
    <Card
      className={onClick ? "cursor-pointer" : ""}
      onClick={onClick}
    >
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
            {value}
          </h4>
          <InsightText insight={insight ?? null} />
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
