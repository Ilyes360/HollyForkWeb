import { useState, useMemo } from "react"
import { getCommandeEmptyState } from "@/lib/copy/commandes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
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
import type { Product } from "@/components/stock/types"
import { UNIT_LABELS } from "@/components/stock/types"
import { formatCurrency } from "@/components/stock/utils"
import type { SupplierFull, Order } from "@/components/commandes/types"
import { ORDER_STATUS_CONFIG } from "@/components/commandes/types"

const PERIOD_OPTIONS = [
  { value: "month", label: "Ce mois" },
  { value: "3months", label: "3 derniers mois" },
  { value: "all", label: "Tout" },
] as const

interface OrderHistoryTableProps {
  orders: Order[]
  suppliers: SupplierFull[]
  products: Product[]
  onSupplierClick: (supplierId: string) => void
}

export function OrderHistoryTable({
  orders,
  suppliers,
  products,
  onSupplierClick,
}: OrderHistoryTableProps) {
  const [search, setSearch] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("tous")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = [...orders].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Period filter
    if (periodFilter !== "all") {
      const now = new Date()
      let cutoff: Date
      if (periodFilter === "month") {
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        cutoff = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      }
      result = result.filter((o) => new Date(o.date) >= cutoff)
    }

    if (supplierFilter !== "tous") {
      result = result.filter((o) => o.supplierId === supplierFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((o) => {
        const supplier = suppliers.find((s) => s.id === o.supplierId)
        if (supplier?.name.toLowerCase().includes(q)) return true
        return o.items.some((item) => {
          const product = products.find((p) => p.id === item.productId)
          return product?.name.toLowerCase().includes(q)
        })
      })
    }

    return result
  }, [orders, supplierFilter, periodFilter, search, suppliers, products])

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
      <div className="flex flex-wrap items-center gap-3">
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue>
              {PERIOD_OPTIONS.find((o) => o.value === periodFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              <TableHead>Livraison</TableHead>
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
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium text-primary hover:underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSupplierClick(order.supplierId)
                        }}
                      >
                        {getSupplierName(order.supplierId)}
                      </button>
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
                        : "—"}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${order.id}-detail`}>
                      <TableCell />
                      <TableCell colSpan={6}>
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
            {filtered.length === 0 && (() => {
              const hasFilters = !!(search || supplierFilter !== "tous" || periodFilter !== "all")
              const empty = getCommandeEmptyState("history")
              return (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <p className="text-sm font-medium">
                      {hasFilters ? "Aucune commande trouvee avec ces filtres." : empty.title}
                    </p>
                    {!hasFilters && (
                      <p className="text-sm text-muted-foreground">{empty.description}</p>
                    )}
                  </TableCell>
                </TableRow>
              )
            })()}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
