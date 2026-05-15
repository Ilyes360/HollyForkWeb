import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Product } from "@/components/stock/types"
import { UNIT_LABELS } from "@/components/stock/types"
import type { SupplierFull, Order } from "@/components/commandes/types"

interface ReceiveOrderDialogProps {
  order: Order | null
  products: Product[]
  suppliers: SupplierFull[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (
    orderId: string,
    receivedQuantities: Record<string, number>
  ) => void
}

export function ReceiveOrderDialog({
  order,
  products,
  suppliers,
  open,
  onOpenChange,
  onConfirm,
}: ReceiveOrderDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    if (order && open) {
      const initial: Record<string, number> = {}
      for (const item of order.items) {
        initial[item.productId] = item.quantity
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuantities(initial)
    }
  }, [order, open])

  if (!order) return null

  const supplier = suppliers.find((s) => s.id === order.supplierId)

  const handleConfirm = () => {
    onConfirm(order.id, quantities)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>Réceptionner la commande</DialogTitle>
          <DialogDescription>
            {supplier?.name ?? "—"} —{" "}
            {new Date(order.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[350px] space-y-3 overflow-y-auto">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_80px_60px] items-center gap-3 px-1 text-xs font-medium text-muted-foreground">
            <span>Produit</span>
            <span>Commandé</span>
            <span>Reçu</span>
            <span />
          </div>

          {order.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)
            const unit = product ? UNIT_LABELS[product.unit] : ""
            const received = quantities[item.productId] ?? 0
            const isMatch = received === item.quantity
            const isPartial = received > 0 && received < item.quantity

            return (
              <div
                key={item.productId}
                className="grid grid-cols-[1fr_80px_80px_60px] items-center gap-3 rounded-lg border p-3"
              >
                <span className="truncate text-sm font-medium">
                  {product?.name ?? "Produit inconnu"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.quantity} {unit}
                </span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={received}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [item.productId]: Number(e.target.value),
                      }))
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  {isMatch && (
                    <Badge variant="success" className="text-xs">
                      OK
                    </Badge>
                  )}
                  {isPartial && (
                    <Badge variant="warning" className="text-xs">
                      Partiel
                    </Badge>
                  )}
                  {received === 0 && (
                    <Badge variant="destructive" className="text-xs">
                      0
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Confirmer réception</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
