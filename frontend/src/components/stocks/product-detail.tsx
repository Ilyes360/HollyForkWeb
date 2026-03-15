import { useState } from "react"
import { useNavigate } from "react-router"
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { Product, Supplier } from "./types"
import { STATUS_CONFIG, UNIT_LABELS } from "./types"
import { getProductStatus, formatCurrency, getSupplierName, getCategoryLabel, getZoneLabel } from "./utils"
import { getProductIcon } from "./product-icons"
import { useInventoryStore } from "@/stores/inventory-store"

interface ProductDetailProps {
  product: Product | null
  suppliers: Supplier[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrder: (product: Product) => void
  onDelete: (id: string) => void
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

export function ProductDetail({
  product,
  suppliers,
  open,
  onOpenChange,
  onOrder,
  onDelete,
}: ProductDetailProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const { categories, storageZones } = useInventoryStore()

  if (!product) return null

  const status = getProductStatus(product)
  const config = STATUS_CONFIG[status]
  const iconEntry = getProductIcon(product.icon)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {iconEntry && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <HugeiconsIcon icon={iconEntry.icon} className="size-4 text-muted-foreground" strokeWidth={2} />
              </div>
            )}
            {product.name}
          </SheetTitle>
          <SheetDescription>
            {getSupplierName(product.supplierId, suppliers)} — {getCategoryLabel(product.category, categories)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut</span>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <InfoField
              label="Quantité"
              value={`${product.quantity} ${UNIT_LABELS[product.unit]}`}
            />
            <InfoField
              label="Stock min / max"
              value={`${product.minStock} / ${product.maxStock} ${UNIT_LABELS[product.unit]}`}
            />
            <InfoField label="Prix unitaire" value={formatCurrency(product.unitPrice)} />
            <InfoField
              label="Valeur totale"
              value={formatCurrency(product.quantity * product.unitPrice)}
            />
            <InfoField label="Rotation" value={`${product.rotation} jours`} />
            <InfoField label="Zone de stockage" value={getZoneLabel(product.storageZone, storageZones)} />
            <InfoField
              label="Expiration"
              value={new Date(product.expirationDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <InfoField
              label="Dernière commande"
              value={new Date(product.lastOrderDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          </div>

          {product.notes && (
            <>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground">Notes</span>
                <p className="text-sm">{product.notes}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Dernières commandes</h4>
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Qté</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Prix unit.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.orderHistory.map((oh) => (
                    <TableRow key={oh.id}>
                      <TableCell className="text-xs">
                        {new Date(oh.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-xs">{oh.quantity}</TableCell>
                      <TableCell className="text-xs">{oh.supplier}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(oh.unitPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); navigate(`/stocks/${product.id}/modifier`) }}>
            Modifier
          </Button>
          <Button onClick={() => onOrder(product)}>Commander</Button>
          <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
            Supprimer
          </Button>
        </SheetFooter>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer le produit</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer « {product.name} » ? Cette action est
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
                  onDelete(product.id)
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
