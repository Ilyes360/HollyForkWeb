import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import type { Product } from "@/components/stock/types"
import { STATUS_CONFIG, UNIT_LABELS } from "@/components/stock/types"
import { getProductStatus, formatCurrency } from "@/components/stock/utils"
import type { SupplierFull, OrderItem } from "./types"
import { useInventoryStore } from "@/stores/inventory-store"

interface OrderDialogProps {
  supplier: SupplierFull | null
  products: Product[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { supplierId: string; items: OrderItem[]; notes: string }) => void
  preSelectedProductId?: string
}

interface SelectedItem {
  productId: string
  quantity: number
  unitPrice: number
  selected: boolean
}

export function OrderDialog({
  supplier: initialSupplier,
  products: initialProducts,
  open,
  onOpenChange,
  onSubmit,
  preSelectedProductId,
}: OrderDialogProps) {
  const { suppliers: allSuppliers, products: allProducts } = useInventoryStore()

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const [items, setItems] = useState<SelectedItem[]>([])
  const [notes, setNotes] = useState("")
  const [initialized, setInitialized] = useState<string | null>(null)

  // Determine active supplier: user-selected or initial
  const activeSupplierId = selectedSupplierId ?? initialSupplier?.id ?? null
  const activeSupplier = allSuppliers.find((s) => s.id === activeSupplierId) ?? null

  // Get products for the active supplier
  const activeProducts = activeSupplierId
    ? allProducts.filter((p) => p.supplierId === activeSupplierId)
    : initialProducts

  // Reset items when supplier changes
  if (activeSupplier && initialized !== activeSupplier.id) {
    setItems(
      activeProducts.map((p) => ({
        productId: p.id,
        quantity: 1,
        unitPrice: p.unitPrice,
        selected: preSelectedProductId === p.id,
      }))
    )
    setNotes("")
    setInitialized(activeSupplier.id)
  }

  if (!activeSupplier) return null

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplierId(supplierId)
    setInitialized(null) // force re-init of items
  }

  const toggleItem = (productId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, selected: !item.selected }
          : item
      )
    )
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const selectedItems = items.filter((i) => i.selected && i.quantity > 0)
  const total = selectedItems.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  )

  const handleSubmit = () => {
    if (selectedItems.length === 0) return
    onSubmit({
      supplierId: activeSupplier.id,
      items: selectedItems.map(({ productId, quantity, unitPrice }) => ({
        productId,
        quantity,
        unitPrice,
      })),
      notes,
    })
    setInitialized(null)
    setSelectedSupplierId(null)
    onOpenChange(false)
  }

  const handleClose = () => {
    setInitialized(null)
    setSelectedSupplierId(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setInitialized(null); setSelectedSupplierId(null) }; onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>Passer commande</DialogTitle>
          <DialogDescription>Sélectionnez les produits à commander.</DialogDescription>
        </DialogHeader>

        {/* Supplier selector */}
        <div className="space-y-2">
          <Label>Fournisseur</Label>
          <Select value={activeSupplier.id} onValueChange={(v) => handleSupplierChange(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>{activeSupplier.name}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {allSuppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-[350px] space-y-3 overflow-y-auto">
          {activeProducts.map((p) => {
            const item = items.find((i) => i.productId === p.id)
            if (!item) return null
            const status = getProductStatus(p)
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Switch
                  checked={item.selected}
                  onCheckedChange={() => toggleItem(p.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{p.name}</span>
                    <Badge variant={STATUS_CONFIG[status].variant} className="text-xs shrink-0">
                      {STATUS_CONFIG[status].label}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(p.unitPrice)} / {UNIT_LABELS[p.unit]}
                  </span>
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(p.id, Number(e.target.value))}
                    disabled={!item.selected}
                    className="h-8"
                  />
                </div>
              </div>
            )
          })}
          {activeProducts.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Aucun produit associé à ce fournisseur.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-notes">Notes</Label>
          <Textarea
            id="order-notes"
            placeholder="Remarques sur la commande..."
            className="min-h-[60px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {selectedItems.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm font-medium">
              Total ({selectedItems.length} article{selectedItems.length > 1 ? "s" : ""})
            </span>
            <span className="text-sm font-semibold">{formatCurrency(total)}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={selectedItems.length === 0}>
            Confirmer la commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
