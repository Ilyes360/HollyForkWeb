import { useState } from "react"
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
import type { Product } from "@/components/stocks/types"
import { STATUS_CONFIG, UNIT_LABELS } from "@/components/stocks/types"
import { getProductStatus, formatCurrency, getCategoryLabel } from "@/components/stocks/utils"
import type { SupplierFull, Order } from "./types"
import { ORDER_STATUS_CONFIG } from "./types"
import {
  getSupplierProducts,
  getSupplierOrders,
  getSupplierMonthlySpend,
  getSupplierProductCount,
} from "./utils"
import { useInventoryStore } from "@/stores/inventory-store"

interface SupplierDetailProps {
  supplier: SupplierFull | null
  products: Product[]
  orders: Order[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrder: (supplier: SupplierFull) => void
  onDelete: (id: string) => void
}

function InfoField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

export function SupplierDetail({
  supplier,
  products,
  orders,
  open,
  onOpenChange,
  onOrder,
  onDelete,
}: SupplierDetailProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { markOrderDelivered, categories } = useInventoryStore()

  if (!supplier) return null

  const supplierProducts = getSupplierProducts(supplier.id, products)
  const supplierOrders = getSupplierOrders(supplier.id, orders)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{supplier.name}</SheetTitle>
          <SheetDescription>
            <Badge variant="outline" className="mr-2">
              {getCategoryLabel(supplier.category, categories)}
            </Badge>
            {supplier.phone}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Téléphone" value={supplier.phone} />
            <InfoField label="Email" value={supplier.email} />
            <InfoField label="Adresse" value={supplier.address} className="col-span-2" />
            <InfoField
              label="Nb produits"
              value={String(getSupplierProductCount(supplier.id, products))}
            />
            <InfoField
              label="Dépenses du mois"
              value={formatCurrency(getSupplierMonthlySpend(supplier.id, orders))}
            />
            <InfoField
              label="Délai moyen"
              value={`${supplier.averageDeliveryDays} jour${supplier.averageDeliveryDays > 1 ? "s" : ""}`}
            />
          </div>

          {supplier.notes && (
            <>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground">Notes</span>
                <p className="text-sm">{supplier.notes}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Produits fournis</h4>
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierProducts.map((p) => {
                    const status = getProductStatus(p)
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium">{p.name}</TableCell>
                        <TableCell className="text-xs">
                          {p.quantity} {UNIT_LABELS[p.unit]}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_CONFIG[status].variant} className="text-xs">
                            {STATUS_CONFIG[status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(p.unitPrice)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {supplierProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                        Aucun produit
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Historique des commandes</h4>
            <div className="overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="text-xs">
                        {new Date(o.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatCurrency(o.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={ORDER_STATUS_CONFIG[o.status].variant}
                          className="text-xs"
                        >
                          {ORDER_STATUS_CONFIG[o.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{o.items.length}</TableCell>
                      <TableCell>
                        {o.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markOrderDelivered(o.id)}
                          >
                            Livrée
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {supplierOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                        Aucune commande
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button onClick={() => onOrder(supplier)}>Passer commande</Button>
          <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
            Supprimer
          </Button>
        </SheetFooter>

        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer le fournisseur</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer « {supplier.name} » ? Cette action est
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
                  onDelete(supplier.id)
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
