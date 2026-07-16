import { useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ThermometerColdIcon,
  ContainerIcon,
  Cabinet01Icon,
  DrinkIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Product, ProductPortionSummary } from "./types"
import type { StorageZoneConfig } from "./types"
import { UNIT_LABELS, CATEGORY_LABELS } from "./types"
import {
  getProductStatus,
  getZoneHealth,
  getZoneFillPercent,
  sortProductsByUrgency,
  formatCurrency,
  getStockPercentage,
} from "./utils"
import { cn } from "@/lib/utils"

const ZONE_ICON_MAP: Record<string, typeof ThermometerColdIcon> = {
  chambre_froide_a: ThermometerColdIcon,
  chambre_froide_b: ThermometerColdIcon,
  reserve_legumes: ContainerIcon,
  reserve_seche: Cabinet01Icon,
  cave: DrinkIcon,
}
const DEFAULT_ZONE_ICON = ContainerIcon

const STATUS_DOT: Record<string, string> = {
  rupture: "bg-red-500",
  stock_faible: "bg-amber-500",
  stock_ok: "bg-emerald-500",
  surstock: "bg-blue-500",
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  viandes: "bg-rose-400",
  poissons: "bg-sky-400",
  legumes: "bg-lime-500",
  epicerie: "bg-amber-400",
  boissons: "bg-violet-400",
  autres: "bg-slate-400",
}

interface StockZoneSectionProps {
  zone: StorageZoneConfig
  products: Product[]
  portionSummaries: Map<string, ProductPortionSummary>
  defaultCollapsed?: boolean
  onSelectProduct: (product: Product) => void
  inventoryMode?: boolean
  inventoryValues?: Map<string, number>
  onInventoryChange?: (productId: string, value: number) => void
}

export function StockZoneSection({
  zone,
  products,
  portionSummaries,
  defaultCollapsed = false,
  onSelectProduct,
  inventoryMode = false,
  inventoryValues,
  onInventoryChange,
}: StockZoneSectionProps) {
  // Group products by category, sorted by urgency within each
  // (hook must be called unconditionally before any early return)
  const groupedByCategory = useMemo(() => {
    if (products.length === 0) return []
    const groups = new Map<string, Product[]>()
    const sorted = sortProductsByUrgency(products, portionSummaries)
    for (const p of sorted) {
      const cat = p.category || "autres"
      if (!groups.has(cat)) groups.set(cat, [])
      groups.get(cat)!.push(p)
    }
    // Sort categories: those with alerts first, then by size
    return [...groups.entries()].sort((a, b) => {
      const aAlerts = a[1].filter(
        (p) =>
          getProductStatus(p) === "rupture" ||
          getProductStatus(p) === "stock_faible"
      ).length
      const bAlerts = b[1].filter(
        (p) =>
          getProductStatus(p) === "rupture" ||
          getProductStatus(p) === "stock_faible"
      ).length
      if (bAlerts !== aAlerts) return bAlerts - aAlerts
      return b[1].length - a[1].length
    })
  }, [products, portionSummaries])

  if (products.length === 0) return null

  const health = getZoneHealth(products)
  const fillPercent = getZoneFillPercent(products)

  const ruptureCount = products.filter(
    (p) => getProductStatus(p) === "rupture"
  ).length
  const faibleCount = products.filter(
    (p) => getProductStatus(p) === "stock_faible"
  ).length
  const zoneValue = products.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice,
    0
  )

  return (
    <Collapsible defaultOpen={!defaultCollapsed}>
      <CollapsibleTrigger className="group w-full text-left">
        {/* Summary banner */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                <HugeiconsIcon
                  icon={ZONE_ICON_MAP[zone.id] ?? DEFAULT_ZONE_ICON}
                  className="size-4 text-muted-foreground"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  {zone.label}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {products.length} produit{products.length > 1 ? "s" : ""}
                  <span className="mx-1.5 text-border">|</span>
                  <span className="text-foreground">
                    {formatCurrency(zoneValue)}
                  </span>
                  {ruptureCount > 0 && (
                    <>
                      <span className="mx-1.5 text-border">|</span>
                      <span className="font-medium text-destructive">
                        {ruptureCount} rupture
                        {ruptureCount > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                  {faibleCount > 0 && (
                    <>
                      <span className="mx-1.5 text-border">|</span>
                      <span className="font-medium text-amber-600">
                        {faibleCount} stock bas
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  health === "ok" && "text-emerald-600",
                  health === "warning" && "text-amber-600",
                  health === "danger" && "text-destructive"
                )}
              >
                {fillPercent}%
              </span>
            </div>
          </div>

          {/* Fill bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  health === "ok" && "bg-emerald-500",
                  health === "warning" && "bg-amber-500",
                  health === "danger" && "bg-red-500"
                )}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              rempli
            </span>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 overflow-hidden rounded-xl border border-border bg-card">
          {groupedByCategory.map(([category, catProducts]) => (
            <div key={category}>
              {/* Category sub-header */}
              <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-5 py-2">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    CATEGORY_DOT_COLORS[category] ?? "bg-slate-400"
                  )}
                />
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
                <span className="text-xs text-muted-foreground/60">
                  {catProducts.length}
                </span>
              </div>

              {/* Product rows */}
              {catProducts.map((product, i) => {
                const status = getProductStatus(product)
                const pct = getStockPercentage(product)
                const value = product.quantity * product.unitPrice

                return (
                  <motion.div
                    key={product.id}
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-2.5 transition-colors",
                      i > 0 && "border-t border-border/30",
                      status === "rupture" && "bg-red-500/[0.04]",
                      status === "stock_faible" && "bg-amber-500/[0.04]",
                      i % 2 === 1 &&
                        status !== "rupture" &&
                        status !== "stock_faible" &&
                        "bg-muted/20",
                      !inventoryMode && "cursor-pointer hover:bg-accent/50"
                    )}
                    onClick={() => !inventoryMode && onSelectProduct(product)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015, duration: 0.2 }}
                  >
                    {/* Status dot */}
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        STATUS_DOT[status]
                      )}
                    />

                    {/* Product name */}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {product.name}
                    </span>

                    {/* Stock gauge (mini bar) */}
                    <div className="hidden w-[50px] shrink-0 items-center sm:flex">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            status === "rupture" && "bg-red-500",
                            status === "stock_faible" && "bg-amber-500",
                            status === "stock_ok" && "bg-emerald-500",
                            status === "surstock" && "bg-blue-500"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    {inventoryMode ? (
                      <input
                        type="number"
                        className="w-20 shrink-0 rounded border border-border bg-background px-2 py-1 text-right text-sm font-semibold tabular-nums focus:ring-1 focus:ring-primary focus:outline-none"
                        value={
                          inventoryValues?.get(product.id) ?? product.quantity
                        }
                        onChange={(e) =>
                          onInventoryChange?.(
                            product.id,
                            Number(e.target.value)
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        min={0}
                        step={0.1}
                      />
                    ) : (
                      <span
                        className={cn(
                          "w-[85px] shrink-0 text-right text-sm font-semibold tabular-nums",
                          status === "rupture" && "text-destructive",
                          status === "stock_faible" && "text-amber-600",
                          status === "stock_ok" && "text-emerald-600",
                          status === "surstock" && "text-blue-600"
                        )}
                      >
                        {Math.round(product.quantity * 100) / 100}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {UNIT_LABELS[product.unit]}
                        </span>
                      </span>
                    )}

                    {/* Fill % */}
                    <span
                      className={cn(
                        "hidden w-[40px] shrink-0 text-right text-xs tabular-nums lg:inline",
                        pct >= 75
                          ? "text-muted-foreground"
                          : pct >= 40
                            ? "text-amber-600"
                            : "text-destructive"
                      )}
                    >
                      {pct}%
                    </span>

                    {/* Value */}
                    <span className="hidden w-[75px] shrink-0 text-right text-sm text-muted-foreground tabular-nums md:inline">
                      {formatCurrency(value)}
                    </span>

                    {/* Chevron */}
                    {!inventoryMode && (
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        className="size-4 shrink-0 text-muted-foreground/50"
                        strokeWidth={2}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
