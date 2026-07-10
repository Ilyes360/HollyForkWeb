import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Product } from "@/components/stock/types"
import { STATUS_CONFIG, UNIT_LABELS } from "@/components/stock/types"
import type { ProductPortionSummary } from "@/components/stock/types"
import type { SupplierFull, Order } from "@/components/commandes/types"
import type { Recipe } from "@/components/carte/types"
import {
  getProductStatus,
  getStockPercentage,
  formatCurrency,
  getCategoryLabel,
  getZoneLabel,
} from "@/components/stock/utils"
import { IngredientIcon } from "@/components/carte/ingredient-icon"
import { DEFAULT_CATEGORIES, DEFAULT_STORAGE_ZONES } from "./types"
import { SupplierPopover } from "@/components/shared/supplier-popover"
import { ProductFlowGraph } from "./product-flow-graph"
import { FullscreenModal } from "@/components/shared/fullscreen-modal"
import { DetailModalLayout } from "@/components/shared/detail-modal-layout"
import { cn } from "@/lib/utils"

interface ProductDetailModalProps {
  product: Product | null
  supplier: SupplierFull | null
  portionSummary: ProductPortionSummary | null
  recipes: Recipe[]
  allProducts: Product[]
  allOrders: Order[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrder: (product: Product) => void
  onDelete: (id: string) => void
  onOpenSupplierSheet: (supplierId: string) => void
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

export function ProductDetailModal({
  product,
  supplier,
  portionSummary,
  recipes,
  allProducts,
  allOrders,
  open,
  onOpenChange,
  onOrder,
  onDelete,
  onOpenSupplierSheet,
}: ProductDetailModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const categories = DEFAULT_CATEGORIES
  const storageZones = DEFAULT_STORAGE_ZONES

  if (!product) return null

  const status = getProductStatus(product)
  const config = STATUS_CONFIG[status]
  const stockPercent = getStockPercentage(product)

  const title = (
    <span className="flex items-center gap-2">
      <IngredientIcon product={product} size="sm" />
      {product.name}
      <Badge variant={config.variant} className="ml-1">
        {config.label}
      </Badge>
    </span>
  )

  const leftColumn = (
    <>
      {/* Stock block */}
      <div className="space-y-3 rounded-xl bg-muted/50 p-4">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Stock
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <InfoField
            label="Quantité"
            value={`${product.quantity} ${UNIT_LABELS[product.unit]}`}
          />
          <InfoField
            label="Stock min / max"
            value={`${product.minStock} / ${product.maxStock} ${UNIT_LABELS[product.unit]}`}
          />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              getStockBarColor(status)
            )}
            style={{ width: `${stockPercent}%` }}
          />
        </div>
      </div>

      {/* Prix block */}
      <div className="space-y-3 rounded-xl bg-muted/50 p-4">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Prix
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <InfoField
            label="Prix unitaire"
            value={formatCurrency(product.unitPrice)}
          />
          <InfoField
            label="Valeur totale"
            value={formatCurrency(product.quantity * product.unitPrice)}
          />
        </div>
      </div>

      {/* Logistique block */}
      <div className="space-y-3 rounded-xl bg-muted/50 p-4">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Logistique
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <InfoField
            label="Zone de stockage"
            value={getZoneLabel(product.storageZone, storageZones)}
          />
          {product.rotation != null && product.rotation > 0 && (
            <InfoField label="Rotation" value={`${product.rotation} jours`} />
          )}
          {product.expirationDate && (
            <InfoField
              label="Expiration"
              value={new Date(product.expirationDate).toLocaleDateString(
                "fr-FR",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            />
          )}
          {product.lastOrderDate && (
            <InfoField
              label="Dernière commande"
              value={new Date(product.lastOrderDate).toLocaleDateString(
                "fr-FR",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            />
          )}
        </div>
      </div>

      {/* Supplier info */}
      {supplier && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Fournisseur
            </h4>
            <SupplierPopover
              supplier={supplier}
              products={allProducts}
              orders={allOrders}
              onOrder={() => onOrder(product)}
              onOpenSheet={onOpenSupplierSheet}
            >
              <button
                type="button"
                className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
              >
                <p className="text-sm font-medium">{supplier.name}</p>
                <p className="text-xs text-muted-foreground">
                  Délai : ~{supplier.averageDeliveryDays} jour
                  {supplier.averageDeliveryDays > 1 ? "s" : ""} ·{" "}
                  {supplier.phone}
                </p>
              </button>
            </SupplierPopover>
          </div>
        </>
      )}
    </>
  )

  const rightColumn = (
    <>
      {/* Flow graph */}
      <ProductFlowGraph
        product={product}
        supplier={supplier}
        portionSummary={portionSummary}
        recipes={recipes}
        onSupplierClick={() => {
          if (supplier) onOpenSupplierSheet(supplier.id)
        }}
        onRecipeClick={(recipeId) => {
          navigate(`/cuisine?recipe=${recipeId}`)
        }}
      />

      {/* Order history */}
      {product.orderHistory && product.orderHistory.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Dernières commandes
            </h4>
            <div className="space-y-2">
              {product.orderHistory.map((oh) => (
                <div
                  key={oh.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(oh.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {oh.supplier}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{oh.quantity} unités</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(oh.unitPrice)}/u
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      {product.notes && (
        <>
          <Separator />
          <div>
            <span className="text-xs text-muted-foreground">Notes</span>
            <p className="text-sm">{product.notes}</p>
          </div>
        </>
      )}
    </>
  )

  const footer = (
    <>
      <Button
        onClick={() => {
          onOpenChange(false)
          navigate(`/stocks/${product.id}/modifier`)
        }}
      >
        Modifier
      </Button>
      <Button variant="outline" onClick={() => onOrder(product)}>
        Commander
      </Button>
      <Button
        variant="outline"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => setDeleteConfirmOpen(true)}
      >
        Supprimer
      </Button>
    </>
  )

  return (
    <>
      <FullscreenModal open={open} onOpenChange={onOpenChange}>
        <DetailModalLayout
          title={title}
          subtitle={`${supplier?.name ?? "—"} — ${getCategoryLabel(product.category, categories)}`}
          onClose={() => onOpenChange(false)}
          left={leftColumn}
          right={rightColumn}
          footer={footer}
        />
      </FullscreenModal>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="z-[70]">
          <DialogHeader>
            <DialogTitle>Supprimer le produit</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer « {product.name} » ? Cette
              action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(product.id)
                setDeleteConfirmOpen(false)
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
