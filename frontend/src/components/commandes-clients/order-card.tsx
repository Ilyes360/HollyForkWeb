import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import type { Commande } from "./types"
import { KITCHEN_STATUS_CONFIG } from "./types"
import { formatCurrency } from "@/components/stock/utils"
import { cn } from "@/lib/utils"

interface OrderCardProps {
  commande: Commande
  tableNumber: number | null
  isSelected: boolean
  onClick: () => void
}

function getElapsedMinutes(createdAt: string): number {
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.max(0, Math.floor(diff / 60000))
}

export function OrderCard({
  commande,
  tableNumber,
  isSelected,
  onClick,
}: OrderCardProps) {
  const elapsed = getElapsedMinutes(commande.createdAt)
  const kitchen = KITCHEN_STATUS_CONFIG[commande.kitchenStatus]
  const awaitingCount = commande.lines.filter((l) => l.awaitingService).length

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:bg-accent/50",
        commande.kitchenStatus === "READY" &&
          !isSelected &&
          "border-red-200 bg-red-500/[0.03]"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", kitchen.dot)} />
          <span className="text-base font-semibold">
            {tableNumber ? `Table ${tableNumber}` : "Emporter"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon
            icon={Clock01Icon}
            className="size-3.5"
            strokeWidth={2}
          />
          <span
            className={cn(
              elapsed > 30 && "font-medium text-amber-600",
              elapsed > 45 && "text-destructive"
            )}
          >
            {elapsed}min
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {commande.itemsCount} article{commande.itemsCount > 1 ? "s" : ""}
          {" · "}
          {formatCurrency(commande.amount)}
        </span>
        <span className={cn("text-xs font-medium", kitchen.color)}>
          {kitchen.label}
        </span>
      </div>

      {awaitingCount > 0 && (
        <div className="mt-1.5 text-xs text-muted-foreground">
          {awaitingCount} en attente de service
        </div>
      )}
    </button>
  )
}
