import { useState } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getCommandeEmptyState } from "@/lib/copy/commandes"
import { EmptyState } from "@/components/shared/empty-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Product } from "@/components/stock/types"
import { UNIT_LABELS } from "@/components/stock/types"
import { formatCurrency } from "@/components/stock/utils"
import type { SupplierFull, Order } from "@/components/commandes/types"

interface PendingOrdersProps {
  orders: Order[]
  suppliers: SupplierFull[]
  products: Product[]
  onReceive: (orderId: string) => void
  onCancel: (orderId: string) => void
  onSupplierClick: (supplierId: string) => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })
}

export function PendingOrders({
  orders,
  suppliers,
  products,
  onReceive,
  onCancel,
  onSupplierClick,
}: PendingOrdersProps) {
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)

  const sorted = [...orders].sort(
    (a, b) => new Date(a.expectedDelivery).getTime() - new Date(b.expectedDelivery).getTime()
  )

  const getSupplierName = (supplierId: string) =>
    suppliers.find((s) => s.id === supplierId)?.name ?? "—"

  const getProduct = (productId: string) =>
    products.find((p) => p.id === productId)

  if (sorted.length === 0) {
    const empty = getCommandeEmptyState("pending")
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04, ease: [0.25, 0.1, 0.25, 1] as const }}
          >
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between">
              <div>
                <button
                  type="button"
                  className="text-sm font-semibold text-primary hover:underline"
                  onClick={() => onSupplierClick(order.supplierId)}
                >
                  {getSupplierName(order.supplierId)}
                </button>
                <p className="text-xs text-muted-foreground">
                  Commandé {formatDate(order.date)}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Livraison prévue : {formatDate(order.expectedDelivery)}
            </p>

            <div className="space-y-1.5">
              {order.items.map((item) => {
                const product = getProduct(item.productId)
                const unit = product ? UNIT_LABELS[product.unit] : ""
                return (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <span>{product?.name ?? "Produit inconnu"}</span>
                    <span className="text-muted-foreground">
                      {item.quantity} {unit} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-semibold">
                Total : {formatCurrency(order.totalAmount)}
              </span>
            </div>

            {order.notes && (
              <p className="text-xs text-muted-foreground">
                Note : {order.notes}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => onReceive(order.id)}>
                Réceptionner
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelOrderId(order.id)}
              >
                Annuler
              </Button>
            </div>
          </Card>
          </motion.div>
        ))}
      </div>

      <AlertDialog
        open={cancelOrderId !== null}
        onOpenChange={(open) => { if (!open) setCancelOrderId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La commande sera marquée comme annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancelOrderId) onCancel(cancelOrderId)
                setCancelOrderId(null)
              }}
            >
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
