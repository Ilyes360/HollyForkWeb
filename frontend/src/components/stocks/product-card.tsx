import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon, Add01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product, Supplier } from "./types"
import { STATUS_CONFIG, UNIT_LABELS } from "./types"
import { getProductStatus, getStockPercentage, formatCurrency, getSupplierName, getCategoryLabel, getZoneLabel } from "./utils"
import { useInventoryStore } from "@/stores/inventory-store"

const GAUGE_COLORS: Record<string, string> = {
  rupture: "bg-destructive",
  stock_faible: "bg-amber-500",
  stock_ok: "bg-emerald-500",
  surstock: "bg-blue-500",
}

const STATUS_BORDER: Record<string, string> = {
  rupture: "border-destructive/30",
  stock_faible: "border-amber-500/30",
  stock_ok: "",
  surstock: "border-blue-500/30",
}

interface ProductCardProps {
  product: Product
  suppliers: Supplier[]
  onSelect: (product: Product) => void
  onOrder: (product: Product) => void
}

export function ProductCard({ product, suppliers, onSelect, onOrder }: ProductCardProps) {
  const navigate = useNavigate()
  const { categories, storageZones } = useInventoryStore()
  const status = getProductStatus(product)
  const config = STATUS_CONFIG[status]
  const pct = getStockPercentage(product)

  const now = new Date()
  const expDate = new Date(product.expirationDate)
  const lastOrderDate = new Date(product.lastOrderDate)
  const daysUntilExp = Math.ceil((expDate.getTime() - now.getTime()) / 86400000)
  const daysSinceOrder = Math.ceil((now.getTime() - lastOrderDate.getTime()) / 86400000)

  return (
    <Card
      className={[
        "flex flex-col p-4",
        STATUS_BORDER[status],
      ].filter(Boolean).join(" ")}
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

      {/* Stats grid */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">Valeur</span>
          <p className="font-medium">{formatCurrency(product.quantity * product.unitPrice)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Rotation</span>
          <p className="font-medium">{product.rotation}j</p>
        </div>
        <div>
          <span className="text-muted-foreground">Dernière cmd</span>
          <p className="font-medium">{daysSinceOrder} jour{daysSinceOrder > 1 ? "s" : ""}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Expiration</span>
          <p className={`font-medium ${daysUntilExp < 3 ? "text-destructive" : daysUntilExp < 7 ? "text-amber-600" : ""}`}>
            {expDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
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
          onClick={(e) => { e.stopPropagation(); onOrder(product) }}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
          Commander
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/stocks/${product.id}/modifier`) }}
        >
          <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" strokeWidth={2} />
        </Button>
      </div>
    </Card>
  )
}
