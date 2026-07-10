import type { Product, ProductStatus } from "@/components/stock/types"
import { getProductStatus } from "@/components/stock/utils"

const STATUS_DOT_COLOR: Record<ProductStatus, string> = {
  stock_ok: "#97C459",
  surstock: "#97C459",
  stock_faible: "#EF9F27",
  rupture: "#E24B4A",
}

interface StockDotProps {
  product: Product
  size?: "sm" | "md"
}

/**
 * Status dot: a small colored circle indicating stock level.
 * Green = OK, orange = low, red = out of stock.
 */
export function IngredientIcon({ product, size = "md" }: StockDotProps) {
  const status = getProductStatus(product)
  const color = STATUS_DOT_COLOR[status]
  const dim = size === "md" ? 8 : 6

  return (
    <span
      className="shrink-0 rounded-full"
      style={{ width: dim, height: dim, backgroundColor: color }}
    />
  )
}
