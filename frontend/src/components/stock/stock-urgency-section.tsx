import { AnimatePresence, motion } from "motion/react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Product, ProductPortionSummary, UrgencyCategory } from "./types"
import { URGENCY_LABELS, URGENCY_COLORS } from "./types"
import { sortProductsByUrgency } from "./utils"
import { StockProductCard } from "./stock-product-card"

interface StockUrgencySectionProps {
  urgency: UrgencyCategory
  products: Product[]
  portionSummaries: Map<string, ProductPortionSummary>
  defaultCollapsed?: boolean
  onSelectProduct: (product: Product) => void
}

export function StockUrgencySection({
  urgency, products, portionSummaries,
  defaultCollapsed = false,
  onSelectProduct,
}: StockUrgencySectionProps) {
  if (products.length === 0) return null

  const colors = URGENCY_COLORS[urgency]
  const sorted = sortProductsByUrgency(products, portionSummaries)

  return (
    <Collapsible defaultOpen={!defaultCollapsed}>
      <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-border pb-1.5 pt-1 text-left">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ backgroundColor: colors.dot }}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {URGENCY_LABELS[urgency]} · {products.length}
          </span>
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <motion.div
          layout
          className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
        >
          <AnimatePresence mode="popLayout">
            {sorted.map((product, i) => (
              <StockProductCard
                key={product.id}
                product={product}
                onClick={onSelectProduct}
                index={i}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  )
}
