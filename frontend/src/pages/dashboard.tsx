import { useState, useEffect, lazy, Suspense } from "react"
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
} from "@hugeicons/core-free-icons"
import { Area, AreaChart, Bar, BarChart, XAxis } from "recharts"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { usePageTitle } from "@/hooks/use-page-title"
import { useDashboard } from "@/hooks/use-dashboard"
import { useRevenueByCategory } from "@/hooks/use-revenue-by-category"
import { useAuthStore } from "@/stores/auth-store"
import { useGreeting } from "@/hooks/use-greeting"
import {
  PeriodPicker,
  type PeriodRange,
} from "@/components/dashboard/period-picker"
import { startOfWeek, endOfWeek } from "date-fns"

const MapCard = lazy(() => import("@/components/dashboard/map-card"))

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type VentesData = {
  categories: { label: string; value: number }[]
  tendance: { day: string; ca: number }[]
  changePct: number
} | null

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
      ease: [0.25, 0.1, 0.25, 1] as const,
    })
    return () => controls.stop()
  }, [mv, value])

  return <motion.span>{display}</motion.span>
}

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------
const tendanceChartConfig = {
  ca: { label: "CA", color: "var(--color-primary)" },
} satisfies ChartConfig

// ---------------------------------------------------------------------------
// Initial period (this week)
// ---------------------------------------------------------------------------
function getThisWeek(): PeriodRange {
  const now = new Date()
  return {
    from: startOfWeek(now, { weekStartsOn: 1 }),
    to: endOfWeek(now, { weekStartsOn: 1 }),
    label: "",
  }
}

// ---------------------------------------------------------------------------
// N/A placeholder
// ---------------------------------------------------------------------------
function NaValue({ className }: { className?: string }) {
  return (
    <span className={`text-muted-foreground/50 ${className ?? ""}`}>N/A</span>
  )
}

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
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
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
  change: number | null
  invertChange?: boolean
  variant?: "inline" | "badge"
}) {
  if (change === null) return null

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
        {sign}
        {change}%
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
        {sign}
        {change}%
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Occupancy Card
// ---------------------------------------------------------------------------
function OccupancyCard({
  value,
  change,
  showChart = true,
}: {
  value: number | null
  change: number | null
  showChart?: boolean
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Taux de remplissage</CardDescription>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h4 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
                {value !== null ? (
                  <>
                    <AnimatedNumber value={value} />
                    <span>%</span>
                  </>
                ) : (
                  <NaValue />
                )}
              </h4>
            </div>
            <ChangeIndicator change={change} />
          </div>
          <CardAction>
            <div className="flex size-12 items-center justify-center rounded-full border bg-muted">
              <HugeiconsIcon
                icon={ChairBarberIcon}
                className="size-5"
                strokeWidth={2}
              />
            </div>
          </CardAction>
        </CardHeader>
        {showChart && value !== null && (
          <CardContent className="mt-auto">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{
                  duration: 0.8,
                  ease: [0.25, 0.1, 0.25, 1] as const,
                  delay: 0.2,
                }}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Covers Card
// ---------------------------------------------------------------------------
function CoversCard({
  value,
  change,
  formatFn,
}: {
  value: number | null
  change: number | null
  formatFn: (n: number) => string
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Couverts servis</CardDescription>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h4 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
                {value !== null ? (
                  <AnimatedNumber value={value} formatFn={formatFn} />
                ) : (
                  <NaValue />
                )}
              </h4>
            </div>
            <ChangeIndicator change={change} />
          </div>
          <CardAction>
            <div className="flex size-12 items-center justify-center rounded-full border bg-muted">
              <HugeiconsIcon
                icon={Restaurant01Icon}
                className="size-5"
                strokeWidth={2}
              />
            </div>
          </CardAction>
        </CardHeader>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Food Cost Card
// ---------------------------------------------------------------------------
function FoodCostCard({
  value,
  change,
}: {
  value: number | null
  change: number | null
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Food Cost</CardDescription>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h4 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
                {value !== null ? (
                  <>
                    <AnimatedNumber value={value} decimals={1} />
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      %
                    </span>
                  </>
                ) : (
                  <NaValue />
                )}
              </h4>
            </div>
            <ChangeIndicator change={change} invertChange />
          </div>
          <CardAction>
            <div className="flex size-12 items-center justify-center rounded-full border bg-muted">
              <HugeiconsIcon
                icon={MoneyBag02Icon}
                className="size-5"
                strokeWidth={2}
              />
            </div>
          </CardAction>
        </CardHeader>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Average Ticket Card
// ---------------------------------------------------------------------------
function AverageTicketCard({
  value,
  change,
}: {
  value: number | null
  change: number | null
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Panier moyen</CardDescription>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <h4 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
                {value !== null ? (
                  <>
                    <AnimatedNumber value={value} decimals={1} />
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      €
                    </span>
                  </>
                ) : (
                  <NaValue />
                )}
              </h4>
            </div>
            <ChangeIndicator change={change} />
          </div>
          <CardAction>
            <div className="flex size-12 items-center justify-center rounded-full border bg-muted">
              <HugeiconsIcon
                icon={SmileDizzyIcon}
                className="size-5"
                strokeWidth={2}
              />
            </div>
          </CardAction>
        </CardHeader>
      </Card>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Ventes par catégorie Card
// ---------------------------------------------------------------------------

const categorieIcons = [Dish01Icon, DrinkIcon, SaladIcon, CakeSliceIcon]
const categorieLabels = ["Plats", "Boissons", "Entrées", "Desserts"]

function VentesCategorieCard({ ventesData }: { ventesData: VentesData }) {
  const [chartType, setChartType] = useState<"area" | "bar">("area")

  if (!ventesData || ventesData.categories.length === 0) {
    return (
      <motion.div variants={fadeUp}>
        <Card className="h-full">
          <CardHeader>
            <CardDescription>CA par catégorie</CardDescription>
            <CardAction>
              <Badge variant="outline" className="text-muted-foreground">
                N/A
              </Badge>
            </CardAction>
            <div className="flex items-center gap-4">
              <h4 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
                <NaValue />
              </h4>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex aspect-[21/9] w-full items-center justify-center rounded-lg border border-dashed">
              <span className="text-sm text-muted-foreground/50">
                Aucune donnée disponible
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {categorieLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md border bg-muted">
                    <HugeiconsIcon
                      icon={categorieIcons[i]}
                      className="size-4"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">N/A</div>
                  </div>
                  <div className="ms-auto flex items-center gap-3">
                    <div className="h-2.5 w-28 overflow-hidden rounded-full bg-muted" />
                    <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                      —
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

  const { categories, tendance, changePct } = ventesData
  const total = categories.reduce((s, c) => s + c.value, 0)
  const maxCat = Math.max(...categories.map((c) => c.value))
  const hasTendance = tendance.some((t) => t.ca > 0)

  return (
    <motion.div variants={fadeUp}>
      <Card className="h-full">
        <CardHeader>
          <CardDescription>CA par catégorie</CardDescription>
          <CardAction>
            <div className="flex items-center gap-1.5">
              {hasTendance && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    setChartType((v) => (v === "area" ? "bar" : "area"))
                  }
                >
                  <HugeiconsIcon
                    icon={
                      chartType === "area" ? ChartColumnIcon : ChartAreaIcon
                    }
                    className="size-3.5"
                    strokeWidth={2}
                  />
                </Button>
              )}
              {changePct !== 0 && (
                <ChangeIndicator change={changePct} variant="badge" />
              )}
            </div>
          </CardAction>
          <div className="flex items-center gap-4">
            <h4 className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
              <AnimatedNumber
                value={total}
                formatFn={(n) => Math.round(n).toLocaleString("fr-FR")}
              />
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                €
              </span>
            </h4>
          </div>
        </CardHeader>
        <CardContent>
          {hasTendance ? (
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
                      <stop
                        offset="5%"
                        stopColor="var(--color-ca)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-ca)"
                        stopOpacity={0}
                      />
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
                            <span className="font-mono font-medium text-foreground tabular-nums">
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
                            <span className="font-mono font-medium text-foreground tabular-nums">
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
          ) : (
            <div className="flex aspect-[21/9] w-full items-center justify-center rounded-lg border border-dashed">
              <span className="text-sm text-muted-foreground/50">
                Pas de données de tendance
              </span>
            </div>
          )}
          <div className="mt-5 space-y-4">
            {categories.map((cat, i) => (
              <div key={cat.label} className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md border bg-muted">
                  <HugeiconsIcon
                    icon={categorieIcons[i % categorieIcons.length]}
                    className="size-4"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <div className="font-medium">{cat.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {cat.value.toLocaleString("fr-FR")} €
                  </div>
                </div>
                <div className="ms-auto flex items-center gap-3">
                  <div className="h-2.5 w-28 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: "var(--color-primary)" }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(cat.value / maxCat) * 100}%`,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: [0.25, 0.1, 0.25, 1] as const,
                        delay: 0.2 + i * 0.1,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                    {total > 0
                      ? `${Math.round((cat.value / total) * 100)}%`
                      : "—"}
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
  usePageTitle("Dashboard")
  void useAuthStore((s) => s.user)
  const { title: greetingTitle, subtitle: greetingSubtitle } = useGreeting()

  const [period, setPeriod] = useState<PeriodRange>(getThisWeek)
  const { restaurantId } = useActiveRestaurant()

  // Format period start date for API
  const periodDate = period.from.toISOString().slice(0, 10)

  // Fetch KPIs from API — no mock fallback
  const { data: dashboardData } = useDashboard(
    restaurantId ? { restaurantId, date: periodDate } : null
  )

  const kpis = dashboardData?.kpis ?? null
  const periodDateTo = period.to.toISOString().slice(0, 10)
  const { data: revenueData } = useRevenueByCategory(
    restaurantId,
    periodDate,
    periodDateTo
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
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">
            {greetingTitle}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {greetingSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </motion.div>

      {/* KPIs — real API data, null when not yet loaded */}
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OccupancyCard value={kpis?.occupancyRate ?? null} change={null} />
        <CoversCard
          value={kpis?.covers ?? null}
          change={null}
          formatFn={(n) => Math.round(n).toLocaleString("fr-FR")}
        />
        <FoodCostCard value={kpis?.foodCostRate ?? null} change={null} />
        <AverageTicketCard value={kpis?.averageTicket ?? null} change={null} />
      </div>

      {/* CA par catégorie + Maps */}
      <div className="grid min-h-[420px] gap-4 lg:grid-cols-2">
        <VentesCategorieCard ventesData={revenueData} />
        <motion.div variants={fadeUp} className="h-full">
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
