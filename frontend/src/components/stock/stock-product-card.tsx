import { motion } from "motion/react"
import { IngredientIcon } from "@/components/carte/ingredient-icon"
import type { Product } from "./types"
import { UNIT_LABELS } from "./types"
import { getProductStatus } from "./utils"
import { cn } from "@/lib/utils"

interface StockProductCardProps {
  product: Product
  onClick: (product: Product) => void
  inventoryMode?: boolean
  inventoryValue?: number
  onInventoryChange?: (productId: string, value: number) => void
  index?: number
}

export function StockProductCard({
  product, onClick,
  inventoryMode = false, inventoryValue, onInventoryChange,
  index = 0,
}: StockProductCardProps) {
  const status = getProductStatus(product)
  const isRupture = status === "rupture"
  const isFaible = status === "stock_faible"

  const stockTextColor = isRupture ? "#A32D2D" : isFaible ? "#BA7517" : "#639922"

  const handleClick = () => {
    if (!inventoryMode) onClick(product)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, delay: index * 0.015, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        className={cn(
          "rounded-md px-2 py-1.5 transition-colors duration-150",
          isRupture && "bg-[rgba(226,75,74,0.07)]",
          isFaible && "bg-[rgba(239,159,39,0.10)]",
          !isRupture && !isFaible && "bg-muted/60",
          !inventoryMode && "cursor-pointer hover:bg-muted/80"
        )}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === "Enter") handleClick() }}
        tabIndex={0}
        role="button"
      >
        <div className="flex items-center gap-2">
          <IngredientIcon product={product} size="md" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
            {product.name}
          </span>
          {inventoryMode ? (
            <input
              type="number"
              className="w-14 shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-right text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
              value={inventoryValue ?? product.quantity}
              onChange={(e) => onInventoryChange?.(product.id, Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              min={0}
              step={0.1}
            />
          ) : (
            <span className="shrink-0">
              <span
                className="text-[15px] font-semibold tabular-nums"
                style={{ color: stockTextColor }}
              >
                {product.quantity}
              </span>
              <span className="text-[10px] text-muted-foreground"> {UNIT_LABELS[product.unit]}</span>
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
