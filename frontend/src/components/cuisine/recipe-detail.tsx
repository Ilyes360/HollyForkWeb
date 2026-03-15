import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Product } from "@/components/stocks/types"
import { STATUS_CONFIG, UNIT_LABELS } from "@/components/stocks/types"
import { getProductStatus, formatCurrency } from "@/components/stocks/utils"
import type { Recipe } from "./types"
import { CATEGORY_LABELS } from "./types"
import { getMaterialCost, getFoodCostPercent, getGrossMargin, getFoodCostColor, getMaxPortions } from "./utils"
import { getProductIcon } from "@/components/stocks/product-icons"

const GAUGE_COLORS: Record<string, string> = {
  rupture: "bg-destructive",
  stock_faible: "bg-amber-500",
  stock_ok: "bg-emerald-500",
  surstock: "bg-blue-500",
}

interface RecipeDetailProps {
  recipe: Recipe | null
  products: Product[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (recipe: Recipe) => void
  onDuplicate: (recipe: Recipe) => void
  onToggleActive: (recipe: Recipe) => void
  onDelete: (id: string) => void
}

export function RecipeDetail({
  recipe,
  products,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
}: RecipeDetailProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  if (!recipe) return null

  const materialCost = getMaterialCost(recipe.ingredients, products)
  const foodCostPct = getFoodCostPercent(materialCost, recipe.sellingPrice)
  const margin = getGrossMargin(recipe.sellingPrice, materialCost)
  const maxPortions = getMaxPortions(recipe.ingredients, products)
  const iconEntry = getProductIcon(recipe.icon)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {iconEntry && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <HugeiconsIcon icon={iconEntry.icon} className="size-4 text-muted-foreground" strokeWidth={2} />
              </div>
            )}
            {recipe.name}
          </SheetTitle>
          <SheetDescription>
            {CATEGORY_LABELS[recipe.category]} — {recipe.portions} portion{recipe.portions > 1 ? "s" : ""}
            {!recipe.isActive && " — Inactif"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4">
          {/* Financial summary */}
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Prix de vente" value={formatCurrency(recipe.sellingPrice)} />
            <InfoField label="Coût matière" value={formatCurrency(materialCost)} />
            <InfoField
              label="Food Cost"
              value={`${foodCostPct.toFixed(1)}%`}
              className={getFoodCostColor(foodCostPct)}
            />
            <InfoField label="Marge brute" value={formatCurrency(margin)} />
            <InfoField
              label="Portions réalisables"
              value={maxPortions > 0 ? `×${maxPortions}` : "—"}
              className={maxPortions === 0 ? "text-destructive" : ""}
            />
          </div>

          <Separator />

          {/* Ingredients list */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              Ingrédients ({recipe.ingredients.length})
            </h4>
            <div className="space-y-1 rounded-lg border p-3">
              {recipe.ingredients.map((ing) => {
                const product = products.find((p) => p.id === ing.productId)
                if (!product) {
                  return (
                    <div key={ing.productId} className="text-xs text-muted-foreground">
                      Produit inconnu ({ing.productId})
                    </div>
                  )
                }
                const status = getProductStatus(product)
                const lineCost = ing.quantity * product.unitPrice

                return (
                  <div key={ing.productId} className="flex items-center gap-2 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {ing.quantity} {UNIT_LABELS[product.unit]}
                    </span>
                    <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                      {formatCurrency(lineCost)}
                    </span>
                    <Badge variant={STATUS_CONFIG[status].variant} className="shrink-0 text-[10px]">
                      {STATUS_CONFIG[status].label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>

          {recipe.allergens.length > 0 && (
            <>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground">Allergènes</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {recipe.allergens.map((a) => (
                    <Badge key={a} variant="outline">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {recipe.notes && (
            <>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground">Notes</span>
                <p className="mt-1 text-sm">{recipe.notes}</p>
              </div>
            </>
          )}

        </div>

        <SheetFooter>
          <Button onClick={() => onEdit(recipe)}>Modifier</Button>
          <Button variant="outline" onClick={() => onDuplicate(recipe)}>
            Dupliquer
          </Button>
          <Button variant="outline" onClick={() => onToggleActive(recipe)}>
            {recipe.isActive ? "Désactiver" : "Activer"}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
            Supprimer
          </Button>
        </SheetFooter>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer la recette</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer « {recipe.name} » ? Cette action est
                irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
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
      </SheetContent>
    </Sheet>
  )
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
      <p className={`text-sm font-medium ${className ?? ""}`}>{value}</p>
    </div>
  )
}
