import { useMemo, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  Add01Icon,
  Cancel01Icon,
  Tick02Icon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Commande, CommandeLine } from "./types"
import { KITCHEN_STATUS_CONFIG } from "./types"
import type { Recipe, RecipeCategory } from "@/components/carte/types"
import { CATEGORY_LABELS_PLURAL } from "@/components/carte/types"
import { formatCurrency } from "@/components/stock/utils"
import { cn } from "@/lib/utils"

interface OrderDetailProps {
  commande: Commande
  tableNumber: number | null
  recipes: Recipe[]
  onAddItem: () => void
  onReclaimLines: (lineIds: number[]) => void
  onValidate: () => void
  onCancel: () => void
  onEncaisser: () => void
}

const CATEGORY_ORDER: RecipeCategory[] = [
  "entree",
  "plat",
  "dessert",
  "boisson",
]

const LINE_KITCHEN_DOT: Record<string, string> = {
  ok: "bg-emerald-500",
  awaiting: "bg-slate-300",
}

function getElapsedMinutes(createdAt: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  )
}

export function OrderDetail({
  commande,
  tableNumber,
  recipes,
  onAddItem,
  onReclaimLines,
  onValidate,
  onCancel,
  onEncaisser,
}: OrderDetailProps) {
  const elapsed = getElapsedMinutes(commande.createdAt)
  const kitchen = KITCHEN_STATUS_CONFIG[commande.kitchenStatus]

  // Build recipe lookup for category
  const recipeMap = useMemo(
    () => new Map(recipes.map((r) => [Number(r.id), r])),
    [recipes]
  )

  // Group lines by category
  const grouped = useMemo(() => {
    const map = new Map<RecipeCategory, CommandeLine[]>()
    for (const cat of CATEGORY_ORDER) map.set(cat, [])

    for (const line of commande.lines) {
      const recipe = recipeMap.get(line.articleId)
      const cat = recipe?.category ?? "plat"
      map.get(cat)?.push(line)
    }
    return map
  }, [commande.lines, recipeMap])

  // Awaiting service lines (typically desserts)
  const awaitingLines = commande.lines.filter((l) => l.awaitingService)

  const handleReclaimAll = useCallback(() => {
    onReclaimLines(awaitingLines.map((l) => l.id))
  }, [awaitingLines, onReclaimLines])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {tableNumber ? `Table ${tableNumber}` : "Emporter"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                Commande #{commande.id}
              </span>
            </h2>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <HugeiconsIcon
                  icon={Clock01Icon}
                  className="size-3.5"
                  strokeWidth={2}
                />
                {elapsed}min
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 font-medium",
                  kitchen.color
                )}
              >
                <span className={cn("size-2 rounded-full", kitchen.dot)} />
                {kitchen.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(commande.amount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {commande.itemsCount} article{commande.itemsCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Lines grouped by category */}
      <div className="flex-1 space-y-5 overflow-auto px-6 py-4">
        {CATEGORY_ORDER.map((cat) => {
          const lines = grouped.get(cat) ?? []
          const catActiveLines = lines.filter((l) => !l.awaitingService)
          if (catActiveLines.length === 0) return null

          return (
            <div key={cat}>
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {CATEGORY_LABELS_PLURAL[cat]}
              </h3>
              <div className="space-y-1">
                {catActiveLines.map((line) => (
                  <LineRow key={line.id} line={line} />
                ))}
              </div>
            </div>
          )
        })}

        {/* Awaiting service section */}
        {awaitingLines.length > 0 && (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-500/[0.04] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider text-amber-600 uppercase">
                En attente de service
              </h3>
              <Button size="sm" variant="outline" onClick={handleReclaimAll}>
                Lancer ({awaitingLines.length})
              </Button>
            </div>
            <div className="mt-2 space-y-1">
              {awaitingLines.map((line) => (
                <LineRow key={line.id} line={line} isAwaiting />
              ))}
            </div>
          </div>
        )}

        {commande.lines.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">Aucun article</p>
            <Button className="mt-3" size="sm" onClick={onAddItem}>
              <HugeiconsIcon
                icon={Add01Icon}
                className="size-4"
                strokeWidth={2}
              />
              Ajouter un article
            </Button>
          </div>
        )}
      </div>

      {/* Add item button */}
      {commande.lines.length > 0 && (
        <div className="border-t border-border/50 px-6 py-3">
          <Button variant="outline" className="w-full" onClick={onAddItem}>
            <HugeiconsIcon
              icon={Add01Icon}
              className="size-4"
              strokeWidth={2}
            />
            Ajouter un article
          </Button>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-2 border-t border-border px-6 py-4">
        <Button
          variant="destructive"
          size="sm"
          onClick={onCancel}
          className="mr-auto"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            className="size-4"
            strokeWidth={2}
          />
          Annuler
        </Button>
        <Button variant="outline" size="sm" onClick={onEncaisser}>
          <HugeiconsIcon
            icon={CreditCardIcon}
            className="size-4"
            strokeWidth={2}
          />
          Encaisser
        </Button>
        <Button size="sm" onClick={onValidate}>
          <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
          Valider
        </Button>
      </div>
    </div>
  )
}

function LineRow({
  line,
  isAwaiting = false,
}: {
  line: CommandeLine
  isAwaiting?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2",
        isAwaiting ? "opacity-60" : "hover:bg-muted/30"
      )}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          isAwaiting ? LINE_KITCHEN_DOT.awaiting : LINE_KITCHEN_DOT.ok
        )}
      />
      <span className="min-w-0 flex-1 truncate text-sm">
        {line.articleName}
      </span>
      <Badge variant="outline" className="shrink-0 text-xs tabular-nums">
        ×{line.quantity}
      </Badge>
      <span className="w-[70px] shrink-0 text-right text-sm text-muted-foreground tabular-nums">
        {formatCurrency(line.unitPrice * line.quantity)}
      </span>
    </div>
  )
}
