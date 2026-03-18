import { useState } from "react"
import { Link, useParams, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  Call02Icon,
  Mail01Icon,
  Location01Icon,
  Delete02Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { STATUS_CONFIG, UNIT_LABELS } from "@/components/stocks/types"
import { getProductStatus, formatCurrency, getCategoryLabel } from "@/components/stocks/utils"
import { ORDER_STATUS_CONFIG } from "@/components/fournisseurs/types"
import {
  getSupplierProducts,
  getSupplierOrders,
  getSupplierMonthlySpend,
  getSupplierProductCount,
  getSupplierTotalSpend,
} from "@/components/fournisseurs/utils"
import { OrderDialog } from "@/components/fournisseurs/order-dialog"
import type { OrderItem } from "@/components/fournisseurs/types"
import { useInventoryStore } from "@/stores/inventory-store"
import { usePageTitle } from "@/hooks/use-page-title"

const editSupplierSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  phone: z.string().min(10, "Numéro invalide"),
  email: z.string().email("Email invalide"),
  address: z.string().min(5, "Adresse trop courte"),
  averageDeliveryDays: z.coerce.number().min(1, "Min. 1 jour"),
  notes: z.string(),
})

type EditSupplierFormValues = z.infer<typeof editSupplierSchema>

const CATEGORY_COLORS: Record<string, string> = {
  viandes: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  poissons: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  legumes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  epicerie: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  boissons: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  autres: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400",
}

const DEFAULT_CATEGORY_COLOR = "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toLocalDateString(d)
}

export default function FournisseurDetailPage() {
  usePageTitle("Fournisseurs")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    suppliers,
    products,
    orders,
    categories,
    deleteSupplier,
    updateSupplier,
    markOrderDelivered,
    addOrder,
  } = useInventoryStore()

  const supplier = suppliers.find((s) => s.id === id)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Fournisseur introuvable.</p>
        <Button variant="outline" render={<Link to="/fournisseurs" />}>
          Retour
        </Button>
      </div>
    )
  }

  const supplierProducts = getSupplierProducts(supplier.id, products)
  const supplierOrders = getSupplierOrders(supplier.id, orders)
  const productCount = getSupplierProductCount(supplier.id, products)
  const monthlySpend = getSupplierMonthlySpend(supplier.id, orders)
  const totalSpend = getSupplierTotalSpend(supplier.id, orders)

  function handleDelete() {
    deleteSupplier(supplier!.id)
    navigate("/fournisseurs")
  }

  function handleSubmitOrder(data: { supplierId: string; items: OrderItem[]; notes: string }) {
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const newOrder = {
      id: `ord-${Date.now()}`,
      supplierId: data.supplierId,
      items: data.items,
      date: toLocalDateString(new Date()),
      status: "pending" as const,
      totalAmount,
      expectedDelivery: daysFromNow(supplier!.averageDeliveryDays),
      notes: data.notes,
    }
    addOrder(newOrder)
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Back link */}
      <motion.div variants={fadeUp}>
        <Link
          to="/fournisseurs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
          Fournisseurs
        </Link>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left column — Supplier profile */}
        <motion.div variants={fadeUp} className="flex flex-col gap-6">
          <Card>
            <CardContent className="pt-6">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="size-16">
                  <AvatarFallback
                    className={`text-lg ${CATEGORY_COLORS[supplier.category] ?? DEFAULT_CATEGORY_COLOR}`}
                  >
                    {getInitials(supplier.name)}
                  </AvatarFallback>
                </Avatar>
                <h1 className="font-display mt-3 text-lg font-semibold">{supplier.name}</h1>
                <Badge variant="outline" className="mt-1">
                  {getCategoryLabel(supplier.category, categories)}
                </Badge>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center rounded-lg border p-3">
                  <span className="text-lg font-bold">{productCount}</span>
                  <span className="text-xs text-muted-foreground">Produits</span>
                </div>
                <div className="flex flex-col items-center rounded-lg border p-3">
                  <span className="text-lg font-bold">{supplier.averageDeliveryDays}j</span>
                  <span className="text-xs text-muted-foreground">Délai</span>
                </div>
                <div className="flex flex-col items-center rounded-lg border p-3">
                  <span className="text-lg font-bold">{formatCurrency(totalSpend)}</span>
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>

              <Separator className="my-5" />

              {/* Contact info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon icon={Call02Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <HugeiconsIcon icon={Location01Icon} className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <span>{supplier.address}</span>
                </div>
              </div>

              {/* Spending */}
              <Separator className="my-5" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dépenses du mois</span>
                <span className="font-semibold">{formatCurrency(monthlySpend)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {supplier.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={() => setOrderDialogOpen(true)}>
              Passer commande
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" strokeWidth={2} />
              Modifier les informations
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
              Supprimer le fournisseur
            </Button>
          </div>
        </motion.div>

        {/* Right column — Products & Orders */}
        <div className="flex flex-col gap-6">
          {/* Produits fournis */}
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>Produits fournis</CardTitle>
              </CardHeader>
              <CardContent>
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
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>
                              {p.quantity} {UNIT_LABELS[p.unit]}
                            </TableCell>
                            <TableCell>
                              <Badge variant={STATUS_CONFIG[status].variant}>
                                {STATUS_CONFIG[status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(p.unitPrice)}</TableCell>
                          </TableRow>
                        )
                      })}
                      {supplierProducts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Aucun produit
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Historique des commandes */}
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <CardTitle>Historique des commandes</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <TableCell>
                            {new Date(o.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>{formatCurrency(o.totalAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={ORDER_STATUS_CONFIG[o.status].variant}>
                              {ORDER_STATUS_CONFIG[o.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>{o.items.length}</TableCell>
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
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Aucune commande
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
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
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order dialog */}
      <OrderDialog
        supplier={supplier}
        products={supplierProducts}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSubmit={handleSubmitOrder}
      />

      {/* Edit supplier dialog */}
      <EditSupplierDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        supplier={supplier}
        categories={categories}
        onSubmit={(data) => updateSupplier(supplier.id, data)}
      />
    </motion.div>
  )
}

// ── Edit Supplier Dialog ──

function EditSupplierDialog({
  open,
  onOpenChange,
  supplier,
  categories,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: { name: string; category: string; phone: string; email: string; address: string; averageDeliveryDays: number; notes: string }
  categories: { id: string; label: string }[]
  onSubmit: (data: EditSupplierFormValues) => void
}) {
  const form = useForm<EditSupplierFormValues>({
    resolver: zodResolver(editSupplierSchema),
    values: {
      name: supplier.name,
      category: supplier.category,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      averageDeliveryDays: supplier.averageDeliveryDays,
      notes: supplier.notes,
    },
  })

  function handleSubmit(data: EditSupplierFormValues) {
    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg!">
        <DialogHeader>
          <DialogTitle>Modifier le fournisseur</DialogTitle>
          <DialogDescription>
            Modifiez les informations de {supplier.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {categories.find((c) => c.id === field.value)?.label ?? "Sélectionner"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="averageDeliveryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Délai moyen (jours)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[60px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
