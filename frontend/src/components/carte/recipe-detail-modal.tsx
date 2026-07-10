import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { TruckDeliveryIcon } from "@hugeicons/core-free-icons"
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
import { getProductStatus, formatCurrency } from "@/components/stock/utils"
import type { Recipe } from "@/components/carte/types"
import type { RecipePortionInfo } from "@/components/carte/types"
import { CATEGORY_LABELS } from "@/components/carte/types"
import {
  getFoodCostColor,
  getGrossMargin,
  getPortionGaugeColor,
} from "@/components/carte/utils"
import { PortionGauge } from "@/components/shared/portion-gauge"
import type { SupplierFull } from "@/components/commandes/types"
import { cn } from "@/lib/utils"
import { FullscreenModal } from "@/components/shared/fullscreen-modal"
import { DetailModalLayout } from "@/components/shared/detail-modal-layout"

interface RecipeDetailModalProps {
  recipe: Recipe | null
  portionInfo: RecipePortionInfo | null
  products: Product[]
  suppliers: SupplierFull[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (recipe: Recipe) => void
  onDuplicate: (recipe: Recipe) => void
  onToggleActive: (recipe: Recipe) => void
  onDelete: (id: string) => void
}

function InfoField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className={cn("text-sm font-medium", className)}>{value}</p>
    </div>
  )
}

export function RecipeDetailModal({
  recipe,
  portionInfo,
  products,
  suppliers,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
}: RecipeDetailModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [simulatedPrice, setSimulatedPrice] = useState<number | null>(null)

  if (!recipe || !portionInfo) return null

  const portionColor = getPortionGaugeColor(portionInfo.maxPortions)
  const isZero = portionInfo.maxPortions === 0

  const supplierMap = new Map(suppliers.map((s) => [s.id, s]))

  const alertCount = portionInfo.ingredientDetails.filter(
    (d) => d.portionsAllowed === 0 || d.portionsAllowed < 5
  ).length

  // Price simulator
  const activePrice = simulatedPrice ?? recipe.sellingPrice
  const activeFoodCost =
    activePrice > 0
      ? (portionInfo.materialCostPerPortion / activePrice) * 100
      : 0
  const activeMargin = getGrossMargin(
    activePrice,
    portionInfo.materialCostPerPortion
  )

  // Cost breakdown
  const ingredientCosts = recipe.ingredients
    .map((ing) => {
      const product = products.find((p) => p.id === ing.productId)
      return {
        productId: ing.productId,
        name: product?.name ?? "Inconnu",
        cost: product ? ing.quantity * product.unitPrice : 0,
      }
    })
    .sort((a, b) => b.cost - a.cost)
  const totalIngredientCost = ingredientCosts.reduce(
    (sum, ic) => sum + ic.cost,
    0
  )

  const title = <span className="flex items-center gap-2">{recipe.name}</span>

  const leftColumn = (
    <>
      {/* PORTIONS section */}
      <div className="space-y-3 rounded-xl bg-muted/50 p-4">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Portions
        </h4>
        <div className="text-center">
          <span
            className={cn(
              "text-3xl font-bold",
              isZero ? "text-destructive" : portionColor.replace("bg-", "text-")
            )}
          >
            {portionInfo.maxPortions} portions
          </span>
          <div className="mt-2">
            <PortionGauge
              maxPortions={portionInfo.maxPortions}
              limitingIngredient={portionInfo.limitingIngredient}
              showValue={false}
            />
          </div>
          {portionInfo.limitingIngredient ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {isZero
                ? `En rupture : ${portionInfo.limitingIngredient.productName}`
                : `Limité par ${portionInfo.limitingIngredient.productName}`}
            </p>
          ) : isZero ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Aucun ingrédient disponible
            </p>
          ) : null}
        </div>

        {/* Alert count badge */}
        {alertCount > 0 && (
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-500" />
              {alertCount} ingrédient{alertCount > 1 ? "s" : ""} en alerte
            </span>
          </div>
        )}
      </div>

      {/* ÉCONOMIE section */}
      <div className="space-y-3 rounded-xl bg-muted/50 p-4">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Économie
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <InfoField
            label="Prix de vente"
            value={formatCurrency(recipe.sellingPrice)}
          />
          <InfoField
            label="Coût matière"
            value={formatCurrency(portionInfo.materialCostPerPortion)}
          />
          <InfoField
            label="Food Cost"
            value={`${portionInfo.foodCostPercent.toFixed(1)}%`}
            className={getFoodCostColor(portionInfo.foodCostPercent)}
          />
          <InfoField
            label="Marge brute"
            value={formatCurrency(
              getGrossMargin(
                recipe.sellingPrice,
                portionInfo.materialCostPerPortion
              )
            )}
          />
        </div>
      </div>

      {/* SIMULATEUR section */}
      <div className="space-y-3 rounded-xl bg-muted/50 p-4">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Simulateur de prix
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Prix de vente simulé
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatCurrency(activePrice)}
            </span>
          </div>
          <input
            type="range"
            min={Math.max(1, Math.floor(portionInfo.materialCostPerPortion))}
            max={Math.max(Math.ceil(recipe.sellingPrice * 2), 20)}
            step={0.5}
            value={activePrice}
            onChange={(e) => setSimulatedPrice(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Food Cost</span>
              <p
                className={cn(
                  "text-sm font-semibold",
                  getFoodCostColor(activeFoodCost)
                )}
              >
                {activeFoodCost.toFixed(1)}%
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Marge</span>
              <p
                className={cn(
                  "text-sm font-semibold",
                  activeMargin < 0 ? "text-destructive" : ""
                )}
              >
                {formatCurrency(activeMargin)}
              </p>
            </div>
          </div>
          {simulatedPrice !== null && (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setSimulatedPrice(null)}
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Allergens */}
      {recipe.allergens.length > 0 && (
        <div className="space-y-2 rounded-xl bg-muted/50 p-4">
          <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Allergènes
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {recipe.allergens.map((a) => (
              <Badge key={a} variant="outline">
                {a}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  )

  const rightColumn = (
    <>
      {/* INGRÉDIENTS section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Ingrédients ({recipe.ingredients.length})
        </h4>
        <div className="space-y-1 rounded-lg border">
          {recipe.ingredients.map((ing) => {
            const product = products.find((p) => p.id === ing.productId)
            if (!product) {
              return (
                <div
                  key={ing.productId}
                  className="px-3 py-2 text-xs text-muted-foreground"
                >
                  Produit inconnu ({ing.productId})
                </div>
              )
            }

            const status = getProductStatus(product)
            const lineCost = ing.quantity * product.unitPrice
            const ingredientInfo = portionInfo.ingredientDetails.find(
              (d) => d.productId === ing.productId
            )
            const portionsAllowed = ingredientInfo?.portionsAllowed ?? 0
            const isLimiting = ingredientInfo?.isLimiting ?? false
            const supplier = supplierMap.get(product.supplierId)

            const bgClass =
              portionsAllowed === 0
                ? "bg-destructive/5"
                : portionsAllowed < 5
                  ? "bg-amber-50"
                  : ""

            return (
              <div key={ing.productId} className={cn("px-3 py-2", bgClass)}>
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ing.quantity} {UNIT_LABELS[product.unit]}
                  </span>
                  <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                    {formatCurrency(lineCost)}
                  </span>
                  <Badge
                    variant={STATUS_CONFIG[status].variant}
                    className="shrink-0 text-[10px]"
                  >
                    {STATUS_CONFIG[status].label}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HugeiconsIcon
                    icon={TruckDeliveryIcon}
                    className="size-3 shrink-0"
                    strokeWidth={2}
                  />
                  <span className="truncate">
                    {supplier?.name ?? "Fournisseur inconnu"}
                  </span>
                  {supplier && (
                    <span className="shrink-0">
                      · {supplier.averageDeliveryDays}j
                    </span>
                  )}
                  <span className="shrink-0">· {portionsAllowed} portions</span>
                  {isLimiting && (
                    <Badge
                      variant="warning"
                      className="ml-auto shrink-0 text-[10px]"
                    >
                      Limitant
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RÉPARTITION DES COÛTS section */}
      {totalIngredientCost > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Répartition des coûts
            </h4>
            <div className="space-y-2">
              {ingredientCosts.map((ic) => {
                const pct =
                  totalIngredientCost > 0
                    ? (ic.cost / totalIngredientCost) * 100
                    : 0
                return (
                  <div key={ic.productId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-medium">{ic.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatCurrency(ic.cost)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      {recipe.notes && (
        <>
          <Separator />
          <div className="rounded-xl border border-amber-200 bg-amber-500/10 p-4">
            <span className="text-xs text-muted-foreground">Notes</span>
            <p className="mt-1 text-sm">{recipe.notes}</p>
          </div>
        </>
      )}
    </>
  )

  const footer = (
    <>
      <Button onClick={() => onEdit(recipe)}>Modifier</Button>
      <Button variant="outline" onClick={() => onDuplicate(recipe)}>
        Dupliquer
      </Button>
      <Button variant="outline" onClick={() => onToggleActive(recipe)}>
        {recipe.isActive ? "Désactiver" : "Activer"}
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
          subtitle={`${CATEGORY_LABELS[recipe.category]}${!recipe.isActive ? " — Inactif" : ""}`}
          onClose={() => onOpenChange(false)}
          left={leftColumn}
          right={rightColumn}
          footer={footer}
        />
      </FullscreenModal>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="z-[70]">
          <DialogHeader>
            <DialogTitle>Supprimer la recette</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer « {recipe.name} » ? Cette
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
                onDelete(recipe.id)
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
