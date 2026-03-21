import { HugeiconsIcon } from "@hugeicons/react"
import type { Product, ProductStatus } from "@/components/stock/types"
import { getProductStatus } from "@/components/stock/utils"
import { getProductIcon } from "@/components/stock/product-icons"

const STATUS_COLORS: Record<ProductStatus, { bg: string; fill: string; stroke: string }> = {
  stock_ok: { bg: "#EAF3DE", fill: "rgba(151,196,89,0.25)", stroke: "#639922" },
  surstock: { bg: "#EAF3DE", fill: "rgba(151,196,89,0.25)", stroke: "#639922" },
  stock_faible: { bg: "rgba(239,159,39,0.15)", fill: "rgba(239,159,39,0.25)", stroke: "#BA7517" },
  rupture: { bg: "rgba(226,75,74,0.12)", fill: "rgba(226,75,74,0.25)", stroke: "#A32D2D" },
}

interface IngredientIconProps {
  product: Product
  size?: "sm" | "md"
}

export function IngredientIcon({ product, size = "md" }: IngredientIconProps) {
  const status = getProductStatus(product)
  const colors = STATUS_COLORS[status]
  const iconEntry = getProductIcon(product.icon)
  const fillPercent = product.maxStock > 0
    ? Math.min(product.quantity / product.maxStock, 0.95) * 100
    : 0

  const dim = size === "md" ? 30 : 18
  const radius = size === "md" ? 7 : 5
  const iconSize = size === "md" ? "size-4" : "size-2.5"

  return (
    <div
      className="relative overflow-hidden shrink-0 flex items-center justify-center"
      style={{ width: dim, height: dim, borderRadius: radius, backgroundColor: colors.bg }}
    >
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: `${fillPercent}%`, backgroundColor: colors.fill }}
      />
      {iconEntry && (
        <HugeiconsIcon
          icon={iconEntry.icon}
          className={`relative z-10 ${iconSize}`}
          style={{ color: colors.stroke }}
          strokeWidth={2}
        />
      )}
    </div>
  )
}
