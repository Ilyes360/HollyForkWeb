import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ThermometerColdIcon,
  ContainerIcon,
  Cabinet01Icon,
  DrinkIcon,
} from "@hugeicons/core-free-icons"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Product, ProductPortionSummary } from "./types"
import type { StorageZoneConfig } from "@/stores/inventory-store"
import {
  getProductStatus,
  getZoneHealth,
  getZoneFillPercent,
  sortProductsByUrgency,
} from "./utils"
import { StockProductCard } from "./stock-product-card"
import { cn } from "@/lib/utils"

const ZONE_ICON_MAP: Record<string, typeof ThermometerColdIcon> = {
  chambre_froide_a: ThermometerColdIcon,
  chambre_froide_b: ThermometerColdIcon,
  reserve_legumes: ContainerIcon,
  reserve_seche: Cabinet01Icon,
  cave: DrinkIcon,
}
const DEFAULT_ZONE_ICON = ContainerIcon

const HEALTH_COLORS = {
  danger: { bar: "#E24B4A" },
  warning: { bar: "#EF9F27" },
  ok: { bar: "#97C459" },
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
  zone, products, portionSummaries,
  defaultCollapsed = false,
  onSelectProduct,
  inventoryMode = false, inventoryValues, onInventoryChange,
}: StockZoneSectionProps) {
  if (products.length === 0) return null

  const health = getZoneHealth(products)
  const fillPercent = getZoneFillPercent(products)
  const colors = HEALTH_COLORS[health]

  const ruptureCount = products.filter((p) => getProductStatus(p) === "rupture").length
  const faibleCount = products.filter((p) => getProductStatus(p) === "stock_faible").length
  const alertCount = ruptureCount + faibleCount

  const sorted = sortProductsByUrgency(products, portionSummaries)

  return (
    <Collapsible defaultOpen={!defaultCollapsed}>
      <div className="rounded-xl bg-card ring-1 ring-border/60">
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between px-3 py-2.5 text-left",
            defaultCollapsed && "opacity-50 transition-opacity hover:opacity-100"
          )}
        >
          <div className="flex items-center gap-1.5">
            <div className="flex size-5 items-center justify-center rounded bg-muted">
              <HugeiconsIcon
                icon={ZONE_ICON_MAP[zone.id] ?? DEFAULT_ZONE_ICON}
                className="size-3 text-muted-foreground"
                strokeWidth={2}
              />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {zone.label} · {products.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {ruptureCount > 0 && (
              <span className="text-[10px] font-medium" style={{ color: "#A32D2D" }}>
                {ruptureCount} rupture{ruptureCount > 1 ? "s" : ""}
              </span>
            )}
            {faibleCount > 0 && (
              <span className="text-[10px] font-medium" style={{ color: "#BA7517" }}>
                {faibleCount} faible
              </span>
            )}
            {alertCount === 0 && (
              <span className="text-[10px] font-medium" style={{ color: "#639922" }}>
                OK
              </span>
            )}

            <div
              className="h-[3px] w-10 overflow-hidden rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${fillPercent}%`, backgroundColor: colors.bar }}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <motion.div
            layout
            className="px-3 pb-3 pt-0.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            <AnimatePresence mode="popLayout">
              {sorted.map((product, i) => (
                <StockProductCard
                  key={product.id}
                  product={product}
                  onClick={onSelectProduct}
                  inventoryMode={inventoryMode}
                  inventoryValue={inventoryValues?.get(product.id)}
                  onInventoryChange={onInventoryChange}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
