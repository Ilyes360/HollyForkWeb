import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { Product } from "@/components/stocks/types"
import { UNIT_LABELS } from "@/components/stocks/types"
import { formatCurrency } from "@/components/stocks/utils"
import type { SupplierFull, Order } from "./types"
import { ORDER_STATUS_CONFIG } from "./types"
import { useInventoryStore } from "@/stores/inventory-store"

const STATUS_FILTER_OPTIONS = [
  { value: "tous", label: "Tous les statuts" },
  { value: "pending", label: "En cours" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
] as const

interface OrdersTabProps {
  orders: Order[]
  suppliers: SupplierFull[]
  products: Product[]
}

export function OrdersTab({ orders, suppliers, products }: OrdersTabProps) {
  const { markOrderDelivered, cancelOrder } = useInventoryStore()
  const [search, setSearch] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("tous")
  const [statusFilter, setStatusFilter] = useState("tous")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = [...orders].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    if (supplierFilter !== "tous") {
      result = result.filter((o) => o.supplierId === supplierFilter)
    }

    if (statusFilter !== "tous") {
      result = result.filter((o) => o.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((o) => {
        const supplier = suppliers.find((s) => s.id === o.supplierId)
        if (supplier?.name.toLowerCase().includes(q)) return true
        // Search in product names within the order
        return o.items.some((item) => {
          const product = products.find((p) => p.id === item.productId)
          return product?.name.toLowerCase().includes(q)
        })
      })
    }

    return result
  }, [orders, supplierFilter, statusFilter, search, suppliers, products])

  const getSupplierName = (supplierId: string) =>
    suppliers.find((s) => s.id === supplierId)?.name ?? "—"

  const getProductName = (productId: string) =>
    products.find((p) => p.id === productId)?.name ?? "Produit inconnu"

  const getProductUnit = (productId: string) => {
    const p = products.find((pr) => pr.id === productId)
    return p ? UNIT_LABELS[p.unit] : ""
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {supplierFilter === "tous"
                ? "Tous les fournisseurs"
                : getSupplierName(supplierFilter)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les fournisseurs</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue>
              {STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <InputGroup className="w-64 bg-background">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Date</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Livraison prévue</TableHead>
              <TableHead className="w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => {
              const isExpanded = expandedOrderId === order.id
              return (
                <>
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedOrderId(isExpanded ? null : order.id)
                    }
                  >
                    <TableCell>
                      <HugeiconsIcon
                        icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
                        className="size-4 text-muted-foreground"
                        strokeWidth={2}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(order.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {getSupplierName(order.supplierId)}
                    </TableCell>
                    <TableCell>
                      {order.items.length} produit{order.items.length > 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ORDER_STATUS_CONFIG[order.status].variant}>
                        {ORDER_STATUS_CONFIG[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.deliveredDate
                        ? new Date(order.deliveredDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })
                        : new Date(order.expectedDelivery).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {order.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markOrderDelivered(order.id)}
                            >
                              Livrée
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => cancelOrder(order.id)}
                            >
                              Annuler
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${order.id}-detail`}>
                      <TableCell />
                      <TableCell colSpan={7}>
                        <div className="rounded-md border bg-muted/30 p-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-muted-foreground">
                                <th className="pb-2 font-medium">Produit</th>
                                <th className="pb-2 font-medium">Quantité</th>
                                <th className="pb-2 font-medium">Prix unitaire</th>
                                <th className="pb-2 font-medium text-right">Sous-total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => (
                                <tr key={item.productId} className="border-t border-border/50">
                                  <td className="py-1.5">{getProductName(item.productId)}</td>
                                  <td className="py-1.5">
                                    {item.quantity} {getProductUnit(item.productId)}
                                  </td>
                                  <td className="py-1.5">{formatCurrency(item.unitPrice)}</td>
                                  <td className="py-1.5 text-right font-medium">
                                    {formatCurrency(item.quantity * item.unitPrice)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t font-medium">
                                <td colSpan={3} className="pt-2">Total</td>
                                <td className="pt-2 text-right">{formatCurrency(order.totalAmount)}</td>
                              </tr>
                            </tfoot>
                          </table>
                          {order.notes && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Note : {order.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Aucune commande trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
