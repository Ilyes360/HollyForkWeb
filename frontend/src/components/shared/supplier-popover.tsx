import { HugeiconsIcon } from "@hugeicons/react"
import { Call02Icon, Mail01Icon, DeliveryTruck01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Product } from "@/components/stock/types"
import type { SupplierFull, Order } from "@/components/commandes/types"
import {
  getSupplierProductCount,
  getSupplierMonthlySpend,
  getSupplierLastOrderDate,
} from "@/components/commandes/utils"
import { formatCurrency } from "@/components/stock/utils"

interface SupplierPopoverProps {
  supplier: SupplierFull
  products: Product[]
  orders: Order[]
  children: React.ReactNode
  onOrder: (supplierId: string) => void
  onOpenSheet: (supplierId: string) => void
}

export function SupplierPopover({
  supplier,
  products,
  orders,
  children,
  onOrder,
  onOpenSheet,
}: SupplierPopoverProps) {
  const productCount = getSupplierProductCount(supplier.id, products)
  const monthlySpend = getSupplierMonthlySpend(supplier.id, orders)
  const lastOrderDate = getSupplierLastOrderDate(supplier.id, orders)

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">{supplier.name}</h4>

          <div className="space-y-1.5 text-xs text-muted-foreground">
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Call02Icon} className="size-3.5" strokeWidth={2} />
                {supplier.phone}
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Mail01Icon} className="size-3.5" strokeWidth={2} />
                {supplier.email}
              </div>
            )}
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={DeliveryTruck01Icon} className="size-3.5" strokeWidth={2} />
              Livraison : ~{supplier.averageDeliveryDays} jour{supplier.averageDeliveryDays > 1 ? "s" : ""}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <span>
              {productCount} produit{productCount > 1 ? "s" : ""} · {formatCurrency(monthlySpend)} ce mois
            </span>
            {lastOrderDate && (
              <span className="block">
                Dern. cmd :{" "}
                {new Date(lastOrderDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })}
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onOrder(supplier.id)}
            >
              Commander
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => onOpenSheet(supplier.id)}
            >
              Voir fiche →
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
