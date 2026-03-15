import { useState, useMemo, useEffect, lazy, Suspense } from "react"
import { motion, useMotionValue, useTransform, animate } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChairBarberIcon,
  Restaurant01Icon,
  MoneyBag02Icon,
  SmileDizzyIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Dish01Icon,
  DrinkIcon,
  SaladIcon,
  CakeSliceIcon,
  MapsIcon,
  ChartColumnIcon,
  ChartAreaIcon,
  GridViewIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
} from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminStore } from "@/stores/admin-store"

const MapCard = lazy(() => import("@/components/dashboard/map-card"))

// ---------------------------------------------------------------------------
// Animated number (motion.dev pattern)
// ---------------------------------------------------------------------------
function AnimatedNumber({
  value,
  decimals = 0,
  formatFn,
}: {
  value: number
  decimals?: number
  formatFn?: (n: number) => string
}) {
  const mv = useMotionValue(0)
  const display = useTransform(mv, (v) => {
    if (formatFn) return formatFn(v)
    return v.toFixed(decimals)
  })

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    })
    return () => controls.stop()
  }, [mv, value])

  return <motion.span>{display}</motion.span>
}

// ---------------------------------------------------------------------------
// Mini bar chart data (20 days)
// ---------------------------------------------------------------------------
const barDataCovers = [
  { v: 52 }, { v: 75 }, { v: 90 }, { v: 65 },
  { v: 98 }, { v: 72 }, { v: 85 }, { v: 60 },
  { v: 95 }, { v: 88 }, { v: 70 }, { v: 92 },
]

const coversChartConfig = {
  v: { label: "Couverts", color: "var(--color-primary)" },
} satisfies ChartConfig

const areaDataFoodCost = [
  { v: 33 }, { v: 31.5 }, { v: 30 }, { v: 31.8 },
  { v: 29 }, { v: 27.5 }, { v: 30 }, { v: 28 },
  { v: 29.5 }, { v: 27 }, { v: 28.5 }, { v: 28.3 },
]

const foodCostChartConfig = {
  v: { label: "Food Cost", color: "var(--color-primary)" },
} satisfies ChartConfig

const satisfactionChartConfig = {
  score: { label: "Score" },
  satisfaction: { label: "Satisfaction", color: "var(--color-primary)" },
} satisfies ChartConfig

// ---------------------------------------------------------------------------
// Ventes par catégorie data (par période)
// ---------------------------------------------------------------------------
type VentesData = {
  categories: { label: string; value: number }[]
  tendance: { day: string; ca: number }[]
  changePct: number
}

const ventesByRestaurant: Record<string, Record<Period, VentesData>> = {
  "est-1": {
    month: {
      categories: [
        { label: "Plats", value: 1460 },
        { label: "Boissons", value: 812 },
        { label: "Entrées", value: 584 },
        { label: "Desserts", value: 389 },
      ],
      tendance: [
        { day: "Lun", ca: 380 },
        { day: "Mar", ca: 420 },
        { day: "Mer", ca: 450 },
        { day: "Jeu", ca: 520 },
        { day: "Ven", ca: 610 },
        { day: "Sam", ca: 720 },
        { day: "Dim", ca: 680 },
      ],
      changePct: 12.4,
    },
    quarter: {
      categories: [
        { label: "Plats", value: 4120 },
        { label: "Boissons", value: 2350 },
        { label: "Entrées", value: 1680 },
        { label: "Desserts", value: 1090 },
      ],
      tendance: [
        { day: "Jan", ca: 2800 },
        { day: "Fév", ca: 3100 },
        { day: "Mar", ca: 3340 },
      ],
      changePct: 8.7,
    },
    year: {
      categories: [
        { label: "Plats", value: 17200 },
        { label: "Boissons", value: 9600 },
        { label: "Entrées", value: 6900 },
        { label: "Desserts", value: 4500 },
      ],
      tendance: [
        { day: "T1", ca: 8400 },
        { day: "T2", ca: 9200 },
        { day: "T3", ca: 10100 },
        { day: "T4", ca: 10500 },
      ],
      changePct: 15.2,
    },
  },
  "est-2": {
    month: {
      categories: [
        { label: "Plats", value: 980 },
        { label: "Boissons", value: 520 },
        { label: "Entrées", value: 350 },
        { label: "Desserts", value: 260 },
      ],
      tendance: [
        { day: "Lun", ca: 240 },
        { day: "Mar", ca: 270 },
        { day: "Mer", ca: 300 },
        { day: "Jeu", ca: 340 },
        { day: "Ven", ca: 410 },
        { day: "Sam", ca: 470 },
        { day: "Dim", ca: 440 },
      ],
      changePct: 5.2,
    },
    quarter: {
      categories: [
        { label: "Plats", value: 2780 },
        { label: "Boissons", value: 1520 },
        { label: "Entrées", value: 990 },
        { label: "Desserts", value: 740 },
      ],
      tendance: [
        { day: "Jan", ca: 1800 },
        { day: "Fév", ca: 1980 },
        { day: "Mar", ca: 2250 },
      ],
      changePct: 4.1,
    },
    year: {
      categories: [
        { label: "Plats", value: 11200 },
        { label: "Boissons", value: 6100 },
        { label: "Entrées", value: 4200 },
        { label: "Desserts", value: 3000 },
      ],
      tendance: [
        { day: "T1", ca: 5500 },
        { day: "T2", ca: 6000 },
        { day: "T3", ca: 6400 },
        { day: "T4", ca: 6600 },
      ],
      changePct: 7.8,
    },
  },
}

const defaultVentes: Record<Period, VentesData> = ventesByRestaurant["est-1"]

const tendanceChartConfig = {
  ca: {
    label: "CA",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

// ---------------------------------------------------------------------------
// Period & mock data (per restaurant)
// ---------------------------------------------------------------------------
type Period = "month" | "quarter" | "year"

const periodLabels: Record<Period, string> = {
  month: "Ce mois",
  quarter: "Ce trimestre",
  year: "Cette année",
}

type MetricsData = {
  occupancy: { value: number; change: number }
  covers: { value: number; change: number }
  foodCost: { value: number; change: number }
  satisfaction: { value: number; change: number }
}

const metricsByRestaurant: Record<string, Record<Period, MetricsData>> = {
  "est-1": {
    month: {
      occupancy: { value: 74, change: 5.2 },
      covers: { value: 1890, change: 10.4 },
      foodCost: { value: 28.3, change: -1.2 },
      satisfaction: { value: 4.6, change: 3.1 },
    },
    quarter: {
      occupancy: { value: 71, change: 3.8 },
      covers: { value: 5420, change: 8.1 },
      foodCost: { value: 29.1, change: -0.5 },
      satisfaction: { value: 4.5, change: 2.4 },
    },
    year: {
      occupancy: { value: 68, change: 6.7 },
      covers: { value: 21350, change: 12.3 },
      foodCost: { value: 29.8, change: -2.1 },
      satisfaction: { value: 4.5, change: 1.9 },
    },
  },
  "est-2": {
    month: {
      occupancy: { value: 58, change: -2.3 },
      covers: { value: 1120, change: 4.1 },
      foodCost: { value: 32.5, change: 1.5 },
      satisfaction: { value: 4.1, change: -0.5 },
    },
    quarter: {
      occupancy: { value: 55, change: -1.0 },
      covers: { value: 3150, change: 3.5 },
      foodCost: { value: 33.2, change: 0.8 },
      satisfaction: { value: 4.0, change: -0.2 },
    },
    year: {
      occupancy: { value: 52, change: 2.1 },
      covers: { value: 12400, change: 5.6 },
      foodCost: { value: 33.8, change: -0.5 },
      satisfaction: { value: 4.1, change: 1.0 },
    },
  },
}

const defaultMetrics: Record<Period, MetricsData> = metricsByRestaurant["est-1"]

// ---------------------------------------------------------------------------
// Stagger animation
// ---------------------------------------------------------------------------
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
}

// ---------------------------------------------------------------------------
// Change indicator
// ---------------------------------------------------------------------------
function ChangeIndicator({
  change,
  invertChange,
  variant = "inline",
}: {
  change: number
  invertChange?: boolean
  variant?: "inline" | "badge"
}) {
  const isPositive = invertChange ? change < 0 : change > 0
  const sign = change > 0 ? "+" : ""

  if (variant === "badge") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          isPositive
            ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        }`}
      >
        <HugeiconsIcon
          icon={isPositive ? ArrowUp01Icon : ArrowDown01Icon}
          className="size-3"
          strokeWidth={2.5}
        />
        {sign}{change}%
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <HugeiconsIcon
        icon={isPositive ? ArrowUp01Icon : ArrowDown01Icon}
        className={`size-3.5 ${isPositive ? "text-green-600" : "text-red-600"}`}
        strokeWidth={2.5}
      />
      <span className={isPositive ? "text-green-600" : "text-red-600"}>
        {sign}{change}%
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Simple stat card (no chart)
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  decimals = 0,
  suffix,
  change,
  invertChange,
  icon,
  formatFn,
}: {
  label: string
  value: number
  decimals?: number
  suffix?: string
  change: number
  invertChange?: boolean
  icon: IconSvgElement
  formatFn?: (n: number) => string
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>{label}</CardDescription>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                <AnimatedNumber
                  value={value}
                  decimals={decimals}
                  formatFn={formatFn}
                />
              </h4>
              {suffix && (
                <span className="text-muted-foreground text-sm font-medium">
                  {suffix}
                </span>
              )}
            </div>
            <ChangeIndicator change={change} invertChange={invertChange} />
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <HugeiconsIcon icon={icon} className="size-5" strokeWidth={2} />
            </div>
          </CardAction>
        </CardHeader>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Occupancy Card (progress bar)
// ---------------------------------------------------------------------------
function OccupancyCard({
  value,
  change,
  showChart = true,
}: {
  value: number
  change: number
  showChart?: boolean
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Taux de remplissage</CardDescription>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                <AnimatedNumber value={value} />
                <span>%</span>
              </h4>
            </div>
            <ChangeIndicator change={change} />
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <HugeiconsIcon
                icon={ChairBarberIcon}
                className="size-5"
                strokeWidth={2}
              />
            </div>
          </CardAction>
        </CardHeader>
        {showChart && (
          <CardContent className="mt-auto">
            <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
              <motion.div
                className="bg-primary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Covers Card (with bar chart)
// ---------------------------------------------------------------------------
function CoversCard({
  value,
  change,
  formatFn,
  showChart = true,
}: {
  value: number
  change: number
  formatFn: (n: number) => string
  showChart?: boolean
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Couverts servis</CardDescription>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                <AnimatedNumber value={value} formatFn={formatFn} />
              </h4>
            </div>
            <ChangeIndicator change={change} />
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <HugeiconsIcon
                icon={Restaurant01Icon}
                className="size-5"
                strokeWidth={2}
              />
            </div>
          </CardAction>
        </CardHeader>
        {showChart && (
          <CardContent className="mt-auto">
            <ChartContainer
              config={coversChartConfig}
              className="h-12 w-full"
            >
              <BarChart
                accessibilityLayer
                data={barDataCovers}
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                barCategoryGap="22%"
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="v"
                  fill="var(--color-v)"
                  radius={[5, 5, 5, 5]}
                  maxBarSize={6}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Food Cost Card (with area chart)
// ---------------------------------------------------------------------------
function FoodCostCard({
  value,
  change,
  showChart = true,
}: {
  value: number
  change: number
  showChart?: boolean
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Food Cost</CardDescription>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                <AnimatedNumber value={value} decimals={1} />
              </h4>
              <span className="text-muted-foreground text-sm font-medium">
                %
              </span>
            </div>
            <ChangeIndicator change={change} invertChange />
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <HugeiconsIcon
                icon={MoneyBag02Icon}
                className="size-5"
                strokeWidth={2}
              />
            </div>
          </CardAction>
        </CardHeader>
        {showChart && (
          <CardContent className="mt-auto">
            <ChartContainer
              config={foodCostChartConfig}
              className="h-12 w-full"
            >
              <AreaChart
                accessibilityLayer
                data={areaDataFoodCost}
                margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillFoodCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-v)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-v)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Area
                  dataKey="v"
                  type="natural"
                  fill="url(#fillFoodCost)"
                  stroke="var(--color-v)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Satisfaction Card (with radial bar chart)
// ---------------------------------------------------------------------------
function SatisfactionCard({
  value,
  change,
  showChart = true,
}: {
  value: number
  change: number
  showChart?: boolean
}) {
  const pct = (value / 5) * 100
  const endAngle = (pct / 100) * 360

  const chartData = [
    { name: "satisfaction", score: pct, fill: "var(--color-satisfaction)" },
  ]

  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Satisfaction client</CardDescription>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                <AnimatedNumber value={value} decimals={1} />
              </h4>
              <span className="text-muted-foreground text-sm font-medium">
                / 5
              </span>
            </div>
            <ChangeIndicator change={change} />
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <HugeiconsIcon
                icon={SmileDizzyIcon}
                className="size-5"
                strokeWidth={2}
              />
            </div>
          </CardAction>
        </CardHeader>
        {showChart && (
          <CardContent className="mt-auto">
            <div className="flex items-center gap-3">
              <ChartContainer
                config={satisfactionChartConfig}
                className="aspect-square h-12 shrink-0"
              >
                <RadialBarChart
                  data={chartData}
                  startAngle={90}
                  endAngle={90 - endAngle}
                  innerRadius={18}
                  outerRadius={24}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    polarRadius={[20, 16]}
                  />
                  <RadialBar
                    dataKey="score"
                    background
                    cornerRadius={10}
                  />
                  <PolarRadiusAxis
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-[10px] font-bold"
                              >
                                {value}
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
              <p className="text-muted-foreground text-xs leading-relaxed">
                <span className="text-primary font-medium">{pct.toFixed(0)}%</span> de
                satisfaction globale
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Ventes par catégorie Card
// ---------------------------------------------------------------------------
const categorieIcons = [Dish01Icon, DrinkIcon, SaladIcon, CakeSliceIcon]

function VentesCategorieCard({ ventesData }: { ventesData: VentesData }) {
  const { categories, tendance, changePct } = ventesData
  const total = categories.reduce((s, c) => s + c.value, 0)
  const maxCat = Math.max(...categories.map((c) => c.value))
  const [chartType, setChartType] = useState<"area" | "bar">("area")

  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Ventes par catégorie</CardDescription>
          <CardAction>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setChartType((v) => (v === "area" ? "bar" : "area"))}
              >
                <HugeiconsIcon
                  icon={chartType === "area" ? ChartColumnIcon : ChartAreaIcon}
                  className="size-3.5"
                  strokeWidth={2}
                />
              </Button>
              <Badge variant="outline" className="text-green-600">
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  className="size-3"
                  strokeWidth={2.5}
                />
                {changePct}%
              </Badge>
            </div>
          </CardAction>
          <div className="flex items-center gap-4">
            <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              <AnimatedNumber
                value={total}
                formatFn={(n) =>
                  Math.round(n).toLocaleString("fr-FR")
                }
              />
              <span className="text-muted-foreground ml-1 text-sm font-medium">€</span>
            </h4>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="aspect-[21/9] w-full"
            config={tendanceChartConfig}
          >
            {chartType === "area" ? (
              <AreaChart
                accessibilityLayer
                data={tendance}
                margin={{ left: -8, right: -8, top: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-ca)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-ca)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value) => (
                        <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                          <span className="text-muted-foreground">CA</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {(value as number).toLocaleString("fr-FR")} €
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="ca"
                  type="natural"
                  fill="url(#fillVentes)"
                  stroke="var(--color-ca)"
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <BarChart
                accessibilityLayer
                data={tendance}
                margin={{ left: -8, right: -8 }}
              >
                <Bar
                  dataKey="ca"
                  fill="var(--color-ca)"
                  radius={[5, 5, 0, 0]}
                  barSize={50}
                />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value) => (
                        <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                          <span className="text-muted-foreground">CA</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {(value as number).toLocaleString("fr-FR")} €
                          </span>
                        </div>
                      )}
                    />
                  }
                />
              </BarChart>
            )}
          </ChartContainer>
          <div className="mt-5 space-y-4">
            {categories.map((cat, i) => (
              <div key={cat.label} className="flex items-center gap-3">
                <div className="bg-muted flex size-10 items-center justify-center rounded-md border">
                  <HugeiconsIcon
                    icon={categorieIcons[i]}
                    className="size-4"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-muted-foreground text-xs">
                    {cat.value.toLocaleString("fr-FR")} €
                  </div>
                </div>
                <div className="ms-auto flex items-center gap-3">
                  <div className="bg-muted h-2.5 w-28 overflow-hidden rounded-full">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "var(--color-primary)" }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(cat.value / maxCat) * 100}%`,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: [0.25, 0.1, 0.25, 1],
                        delay: 0.2 + i * 0.1,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                    {Math.round((cat.value / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month")
  const [showCharts, setShowCharts] = useState(true)
  const selectedId = useAdminStore((s) => s.currentEstablishmentId)
  const data = useMemo(
    () => (metricsByRestaurant[selectedId] ?? defaultMetrics)[period],
    [selectedId, period]
  )
  const ventesData = useMemo(
    () => (ventesByRestaurant[selectedId] ?? defaultVentes)[period],
    [selectedId, period]
  )

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between"
      >
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={showCharts ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setShowCharts((v) => !v)}
          >
            <HugeiconsIcon
              icon={showCharts ? ChartColumnIcon : GridViewIcon}
              className="size-4"
              strokeWidth={2}
            />
          </Button>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger>
            <SelectValue>{periodLabels[period]}</SelectValue>
          </SelectTrigger>
          <SelectContent
            align="end"
            sideOffset={6}
            alignItemWithTrigger={false}
            className="min-w-44 p-1"
          >
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OccupancyCard
          value={data.occupancy.value}
          change={data.occupancy.change}
          showChart={showCharts}
        />
        <CoversCard
          value={data.covers.value}
          change={data.covers.change}
          formatFn={(n) => Math.round(n).toLocaleString("fr-FR")}
          showChart={showCharts}
        />
        <FoodCostCard
          value={data.foodCost.value}
          change={data.foodCost.change}
          showChart={showCharts}
        />
        <SatisfactionCard
          value={data.satisfaction.value}
          change={data.satisfaction.change}
          showChart={showCharts}
        />
      </div>

      {/* Total Earning + Maps */}
      <div className="grid min-h-[420px] gap-4 lg:grid-cols-2">
        <VentesCategorieCard ventesData={ventesData} />
        <motion.div variants={fadeUp}>
          <Suspense
            fallback={
              <Card className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <HugeiconsIcon
                    icon={MapsIcon}
                    className="size-10"
                    strokeWidth={1.5}
                  />
                  <span className="text-lg font-medium">Maps</span>
                </div>
              </Card>
            }
          >
            <MapCard />
          </Suspense>
        </motion.div>
      </div>
    </motion.div>
  )
}
