import { HugeiconsIcon } from "@hugeicons/react"
import { Call02Icon, Mail01Icon, Location01Icon, DeliveryTruck01Icon, PencilEdit01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Product } from "@/components/stock/types"
import { STATUS_CONFIG, UNIT_LABELS } from "@/components/stock/types"
import type { ProductPortionSummary } from "@/components/stock/types"
import type { SupplierFull, Order } from "@/components/commandes/types"
import { ORDER_STATUS_CONFIG } from "@/components/commandes/types"
import type { Recipe } from "@/components/carte/types"
import {
  getSupplierProducts,
  getSupplierOrders,
  getSupplierMonthlySpend,
  getSupplierTotalSpend,
} from "@/components/commandes/utils"
import { formatCurrency, getProductStatus, getStockPercentage, formatPortionEquivalents } from "@/components/stock/utils"
import { FullscreenModal } from "@/components/shared/fullscreen-modal"
import { DetailModalLayout } from "@/components/shared/detail-modal-layout"
import { SupplierFlowGraph } from "@/components/shared/supplier-flow-graph"
import { cn } from "@/lib/utils"

interface SupplierModalProps {
  supplier: SupplierFull | null
  products: Product[]
  orders: Order[]
  productPortionSummaries: ProductPortionSummary[]
  recipes: Recipe[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrder: (supplierId: string) => void
  onEdit?: (supplier: SupplierFull) => void
  onDelete?: (supplierId: string) => void
  zIndex?: number
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

function getStockBarColor(status: string): string {
  if (status === "rupture") return "bg-destructive"
  if (status === "stock_faible") return "bg-amber-500"
  return "bg-emerald-500"
}

export function SupplierModal({
  supplier,
  products,
  orders,
  productPortionSummaries,
  recipes,
  open,
  onOpenChange,
  onOrder,
  onEdit,
  onDelete,
  zIndex,
}: SupplierModalProps) {
  if (!supplier) return null

  const supplierProducts = getSupplierProducts(supplier.id, products)
  const supplierOrders = getSupplierOrders(supplier.id, orders).slice(0, 5)
  const monthlySpend = getSupplierMonthlySpend(supplier.id, orders)
  const totalSpend = getSupplierTotalSpend(supplier.id, orders)
  const summaryMap = new Map(productPortionSummaries.map((s) => [s.productId, s]))

  const ruptureProducts = supplierProducts.filter(p => getProductStatus(p) === "rupture")
  const ruptureIds = new Set(ruptureProducts.map(p => p.id))
  const impactedRecipes = recipes.filter(r =>
    r.ingredients.some(ing => ruptureIds.has(ing.productId))
  ).length

  const leftColumn = (
    <>
      {/* Dependency summary */}
      <div className="rounded-xl bg-muted/50 p-4 text-center">
        <p className="text-sm font-medium">
          {supplierProducts.length} produit{supplierProducts.length > 1 ? "s" : ""}
        </p>
        {ruptureProducts.length > 0 && (
          <>
            <p className="mt-1 text-xs text-destructive">
              · {ruptureProducts.length} en rupture
            </p>
            <p className="text-xs text-destructive">
              · {impactedRecipes} recette{impactedRecipes > 1 ? "s" : ""} impactée{impactedRecipes > 1 ? "s" : ""}
            </p>
          </>
        )}
      </div>

      {/* CONTACT section */}
      <div className="rounded-xl bg-muted/50 p-4 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Contact
        </h4>
        <div className="space-y-2 text-sm">
          {supplier.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon icon={Call02Icon} className="size-4" strokeWidth={2} />
              {supplier.phone}
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon icon={Mail01Icon} className="size-4" strokeWidth={2} />
              {supplier.email}
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <HugeiconsIcon icon={Location01Icon} className="size-4" strokeWidth={2} />
              {supplier.address}
            </div>
          )}
        </div>
      </div>

      {/* PERFORMANCE section */}
      <div className="rounded-xl bg-muted/50 p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Performance
        </h4>
        <div className="grid grid-cols-1 gap-4">
          <InfoField
            label="Délai moyen"
            value={`${supplier.averageDeliveryDays} jour${supplier.averageDeliveryDays > 1 ? "s" : ""}`}
          />
          <InfoField label="Ce mois" value={formatCurrency(monthlySpend)} />
          <InfoField label="Dépense totale" value={formatCurrency(totalSpend)} />
        </div>
      </div>
    </>
  )

  const rightColumn = (
    <>
      {/* Supplier Flow Graph */}
      <SupplierFlowGraph
        supplier={supplier}
        products={supplierProducts}
        productPortionSummaries={productPortionSummaries}
        recipes={recipes}
      />

      <Separator />

      {/* PRODUITS FOURNIS section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Produits fournis ({supplierProducts.length})
        </h4>
        <div className="space-y-2">
          {supplierProducts.map((p) => {
            const status = getProductStatus(p)
            const config = STATUS_CONFIG[status]
            const summary = summaryMap.get(p.id)
            const stockPercent = getStockPercentage(p)
            return (
              <div
                key={p.id}
                className="rounded-lg border p-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{p.name}</span>
                      <Badge variant={config.variant} className="text-xs shrink-0">
                        {config.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {p.quantity} {UNIT_LABELS[p.unit]}
                      {summary && summary.portionEquivalents.length > 0 && (
                        <> · {formatPortionEquivalents(summary.portionEquivalents, 2)}</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", getStockBarColor(status))}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
          {supplierProducts.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun produit.</p>
          )}
        </div>
      </div>

      {/* DERNIÈRES COMMANDES section */}
      {supplierOrders.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dernières commandes
            </h4>
            <div className="space-y-2">
              {supplierOrders.map((o) => {
                const statusCfg = ORDER_STATUS_CONFIG[o.status]
                return (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(o.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(o.totalAmount)}
                      </p>
                    </div>
                    <Badge variant={statusCfg.variant} className="text-xs">
                      {statusCfg.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      {supplier.notes && (
        <>
          <Separator />
          <div className="rounded-xl border border-amber-200 bg-amber-500/10 p-4">
            <span className="text-xs text-muted-foreground">Notes</span>
            <p className="mt-1 text-sm">{supplier.notes}</p>
          </div>
        </>
      )}
    </>
  )

  const footer = (
    <>
      {onDelete && (
        <Button variant="destructive" onClick={() => onDelete(supplier.id)} className="mr-auto">
          <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
          Supprimer
        </Button>
      )}
      {onEdit && (
        <Button variant="outline" onClick={() => onEdit(supplier)}>
          <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" strokeWidth={2} />
          Modifier
        </Button>
      )}
      <Button onClick={() => onOrder(supplier.id)}>
        <HugeiconsIcon icon={DeliveryTruck01Icon} className="size-4" strokeWidth={2} />
        Commander
      </Button>
    </>
  )

  return (
    <FullscreenModal open={open} onOpenChange={onOpenChange} zIndex={zIndex}>
      <DetailModalLayout
        title={supplier.name}
        subtitle={supplier.category}
        onClose={() => onOpenChange(false)}
        left={leftColumn}
        right={rightColumn}
        footer={footer}
      />
    </FullscreenModal>
  )
}
