import { HugeiconsIcon } from "@hugeicons/react"
import {
  Call02Icon,
  Mail01Icon,
  Location01Icon,
  PencilEdit01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Product } from "@/components/stock/types"
import {
  STATUS_CONFIG,
  UNIT_LABELS,
  CATEGORY_LABELS,
} from "@/components/stock/types"
import type { ProductPortionSummary } from "@/components/stock/types"
import type { SupplierFull, Order } from "@/components/commandes/types"
import type { Recipe } from "@/components/carte/types"
import { getSupplierProducts } from "@/components/commandes/utils"
import {
  getProductStatus,
  getStockPercentage,
  formatPortionEquivalents,
} from "@/components/stock/utils"
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
  void orders
  void onOrder

  if (!supplier) return null

  const supplierProducts = getSupplierProducts(supplier.id, products)
  const summaryMap = new Map(
    productPortionSummaries.map((s) => [s.productId, s])
  )

  const ruptureProducts = supplierProducts.filter(
    (p) => getProductStatus(p) === "rupture"
  )
  const faibleProducts = supplierProducts.filter(
    (p) => getProductStatus(p) === "stock_faible"
  )
  const ruptureIds = new Set(ruptureProducts.map((p) => p.id))
  const impactedRecipes = recipes.filter((r) =>
    r.ingredients.some((ing) => ruptureIds.has(ing.productId))
  ).length

  const categoryLabel = CATEGORY_LABELS[supplier.category] ?? supplier.category

  const leftColumn = (
    <>
      {/* Product summary */}
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {supplierProducts.length} produit
            {supplierProducts.length > 1 ? "s" : ""}
          </span>
          {supplierProducts.length > 0 &&
            ruptureProducts.length === 0 &&
            faibleProducts.length === 0 && (
              <Badge variant="success" className="text-xs">
                Tout OK
              </Badge>
            )}
        </div>
        {ruptureProducts.length > 0 && (
          <p className="mt-1.5 text-xs font-medium text-destructive">
            {ruptureProducts.length} en rupture · {impactedRecipes} recette
            {impactedRecipes > 1 ? "s" : ""} impactée
            {impactedRecipes > 1 ? "s" : ""}
          </p>
        )}
        {faibleProducts.length > 0 && (
          <p className="mt-1 text-xs font-medium text-amber-600">
            {faibleProducts.length} stock bas
          </p>
        )}
      </div>

      {/* Contact — clickable links */}
      <div className="space-y-2 rounded-xl bg-muted/50 p-4">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Contact
        </h4>
        <div className="space-y-2.5 text-sm">
          {supplier.phone && (
            <a
              href={`tel:${supplier.phone}`}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <HugeiconsIcon
                icon={Call02Icon}
                className="size-4 shrink-0"
                strokeWidth={2}
              />
              <span className="truncate">{supplier.phone}</span>
            </a>
          )}
          {supplier.email && (
            <a
              href={`mailto:${supplier.email}`}
              className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <HugeiconsIcon
                icon={Mail01Icon}
                className="size-4 shrink-0"
                strokeWidth={2}
              />
              <span className="truncate">{supplier.email}</span>
            </a>
          )}
          {supplier.address && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <HugeiconsIcon
                icon={Location01Icon}
                className="mt-0.5 size-4 shrink-0"
                strokeWidth={2}
              />
              <span>{supplier.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery info */}
      <div className="space-y-3 rounded-xl bg-muted/50 p-4">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Livraison
        </h4>
        <div>
          <span className="text-xs text-muted-foreground">Délai moyen</span>
          <p className="text-sm font-medium">
            {supplier.averageDeliveryDays} jour
            {supplier.averageDeliveryDays > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Notes */}
      {supplier.notes && (
        <div className="rounded-xl border border-amber-200 bg-amber-500/10 p-4">
          <span className="text-xs text-muted-foreground">Notes</span>
          <p className="mt-1 text-sm">{supplier.notes}</p>
        </div>
      )}
    </>
  )

  const rightColumn = (
    <>
      {/* Flow graph (only if products exist) */}
      {supplierProducts.length > 0 && (
        <>
          <SupplierFlowGraph
            supplier={supplier}
            products={supplierProducts}
            productPortionSummaries={productPortionSummaries}
            recipes={recipes}
          />
          <Separator />
        </>
      )}

      {/* Products list */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Produits fournis ({supplierProducts.length})
        </h4>

        {supplierProducts.length > 0 ? (
          <div className="space-y-2">
            {supplierProducts.map((p) => {
              const status = getProductStatus(p)
              const config = STATUS_CONFIG[status]
              const summary = summaryMap.get(p.id)
              const stockPercent = getStockPercentage(p)
              return (
                <div key={p.id} className="rounded-lg border p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {p.name}
                        </span>
                        <Badge
                          variant={config.variant}
                          className="shrink-0 text-xs"
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(p.quantity * 100) / 100}{" "}
                        {UNIT_LABELS[p.unit]}
                        {summary && summary.portionEquivalents.length > 0 && (
                          <>
                            {" · "}
                            {formatPortionEquivalents(
                              summary.portionEquivalents,
                              2
                            )}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        getStockBarColor(status)
                      )}
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun produit associé à ce fournisseur.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les produits seront liés automatiquement lors de leur création
              dans le stock.
            </p>
          </div>
        )}
      </div>
    </>
  )

  const footer = (
    <>
      {onDelete && (
        <Button
          variant="destructive"
          onClick={() => onDelete(supplier.id)}
          className="mr-auto"
        >
          <HugeiconsIcon
            icon={Delete02Icon}
            className="size-4"
            strokeWidth={2}
          />
          Supprimer
        </Button>
      )}
      {onEdit && (
        <Button variant="outline" onClick={() => onEdit(supplier)}>
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            className="size-4"
            strokeWidth={2}
          />
          Modifier
        </Button>
      )}
    </>
  )

  return (
    <FullscreenModal open={open} onOpenChange={onOpenChange} zIndex={zIndex}>
      <DetailModalLayout
        title={supplier.name}
        subtitle={categoryLabel}
        onClose={() => onOpenChange(false)}
        left={leftColumn}
        right={rightColumn}
        footer={footer}
      />
    </FullscreenModal>
  )
}
