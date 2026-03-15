import { HugeiconsIcon } from "@hugeicons/react"
import { NoteIcon, PercentCircleIcon, Tick02Icon, Alert02Icon } from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardDescription, CardAction } from "@/components/ui/card"
import type { Product } from "@/components/stocks/types"
import type { Recipe } from "./types"
import { getMaterialCost, getFoodCostPercent, isFeasible, getRecipesImpactedByAlerts } from "./utils"

interface CuisineKpisProps {
  recipes: Recipe[]
  products: Product[]
  onAlertClick: () => void
}

export function CuisineKpis({ recipes, products, onAlertClick }: CuisineKpisProps) {
  const activeRecipes = recipes.filter((r) => r.isActive)

  const avgFoodCost =
    activeRecipes.length > 0
      ? activeRecipes.reduce((sum, r) => {
          const cost = getMaterialCost(r.ingredients, products)
          return sum + getFoodCostPercent(cost, r.sellingPrice)
        }, 0) / activeRecipes.length
      : 0

  const feasibleCount = activeRecipes.filter((r) =>
    isFeasible(r.ingredients, products)
  ).length

  const alertCount = getRecipesImpactedByAlerts(recipes, products)

  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Recettes actives"
        value={String(activeRecipes.length)}
        icon={NoteIcon}
      />
      <KpiCard
        label="Food Cost moyen"
        value={`${avgFoodCost.toFixed(1)}%`}
        icon={PercentCircleIcon}
      />
      <KpiCard
        label="Plats réalisables"
        value={`${feasibleCount} / ${activeRecipes.length}`}
        icon={Tick02Icon}
      />
      <KpiCard
        label="Alertes ingrédients"
        value={String(alertCount)}
        icon={Alert02Icon}
        accent={alertCount > 0}
        onClick={onAlertClick}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  accent,
  onClick,
}: {
  label: string
  value: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  accent?: boolean
  onClick?: () => void
}) {
  return (
    <Card
      className={[
        "h-full",
        accent ? "border-amber-500/30" : "",
        onClick ? "cursor-pointer" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            {value}
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
