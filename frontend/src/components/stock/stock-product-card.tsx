import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon, Add01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product, Supplier, ProductPortionSummary } from "@/components/stock/types"
import { STATUS_CONFIG, UNIT_LABELS } from "@/components/stock/types"
import {
  getProductStatus,
  getStockPercentage,
  formatCurrency,
  getSupplierName,
  getCategoryLabel,
  getZoneLabel,
} from "@/components/stock/utils"
import { useInventoryStore } from "@/stores/inventory-store"

const GAUGE_COLORS: Record<string, string> = {
  rupture: "bg-destructive",
  stock_faible: "bg-amber-500",
  stock_ok: "bg-emerald-500",
  surstock: "bg-blue-500",
}

interface StockProductCardProps {
  product: Product
  suppliers: Supplier[]
  portionSummary: ProductPortionSummary | null
  isLimiting: boolean
  onSelect: (product: Product) => void
  onOrder: (product: Product) => void
}

export function StockProductCard({
  product,
  suppliers,
  portionSummary,
  isLimiting,
  onSelect,
  onOrder,
}: StockProductCardProps) {
  const navigate = useNavigate()
  const { categories, storageZones } = useInventoryStore()
  const status = getProductStatus(product)
  const config = STATUS_CONFIG[status]
  const pct = getStockPercentage(product)

  const expDate = new Date(product.expirationDate)
  const now = new Date()
  const daysUntilExp = Math.ceil((expDate.getTime() - now.getTime()) / 86400000)

  return (
    <Card
      className={[
        "flex cursor-pointer flex-col p-4",
        isLimiting ? "border-l-2 border-l-amber-400" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect(product)}
    >
      {/* Header: status + category */}
      <div className="flex items-center justify-between gap-2">
        <Badge variant={config.variant}>{config.label}</Badge>
        <span className="text-xs text-muted-foreground">
          {getCategoryLabel(product.category, categories)}
        </span>
      </div>

      {/* Name + supplier */}
      <h3 className="mt-3 text-sm font-semibold leading-snug">{product.name}</h3>
      <p className="text-xs text-muted-foreground">
        {getSupplierName(product.supplierId, suppliers)}
      </p>

      {/* Big quantity */}
      <div className="mt-4 text-center">
        <span className="text-3xl font-bold tracking-tight">{product.quantity}</span>
        <span className="ml-1 text-sm text-muted-foreground">{UNIT_LABELS[product.unit]}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${GAUGE_COLORS[status]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Min: {product.minStock}</span>
          <span>Max: {product.maxStock}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">Valeur</span>
          <p className="font-medium">{formatCurrency(product.quantity * product.unitPrice)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Expiration</span>
          <p
            className={`font-medium ${daysUntilExp < 3 ? "text-destructive" : daysUntilExp < 7 ? "text-amber-600" : ""}`}
          >
            {expDate.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>

      {/* Zone */}
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <HugeiconsIcon icon={Location01Icon} className="size-3.5" strokeWidth={2} />
        {getZoneLabel(product.storageZone, storageZones)}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-primary"
          onClick={(e) => {
            e.stopPropagation()
            onOrder(product)
          }}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
          Commander
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/stocks/${product.id}/modifier`)
          }}
        >
          <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" strokeWidth={2} />
        </Button>
      </div>
    </Card>
  )
}
