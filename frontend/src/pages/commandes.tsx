import { useState, useCallback, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Call02Icon,
  Mail01Icon,
  Location01Icon,
  DeliveryTruck01Icon,
  PackageIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Search01Icon } from "@hugeicons/core-free-icons"
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
import { useStocks } from "@/hooks/use-stocks"
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/use-suppliers"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { usePageTitle } from "@/hooks/use-page-title"
import { CATEGORY_LABELS } from "@/components/stock/types"
import { getSupplierProducts } from "@/components/commandes/utils"
import type { SupplierFull } from "@/components/commandes/types"
import { SupplierDialog } from "@/components/commandes/supplier-dialog"
import { SupplierModal } from "@/components/shared/supplier-modal"
import { useArticles } from "@/hooks/use-articles"
import { useOrders } from "@/hooks/use-orders"
import { usePortionCalculator } from "@/hooks/use-portion-calculator"
import { cn } from "@/lib/utils"

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
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  viandes: "bg-rose-400",
  poissons: "bg-sky-400",
  legumes: "bg-lime-500",
  epicerie: "bg-amber-400",
  boissons: "bg-violet-400",
  autres: "bg-slate-400",
}

export default function FournisseursPage() {
  usePageTitle("Fournisseurs")
  const { restaurantId } = useActiveRestaurant()
  const { data: products } = useStocks(restaurantId)
  const { data: suppliers } = useSuppliers()
  const { data: recipes } = useArticles()
  const { data: orders } = useOrders(restaurantId)
  const { productPortionSummaries } = usePortionCalculator(
    recipes,
    products,
    suppliers
  )

  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const [search, setSearch] = useState("")
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierFull | null>(
    null
  )
  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false)
  const [supplierSheetId, setSupplierSheetId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(
    null
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    )
  }, [suppliers, search])

  const handleAddSupplier = useCallback(() => {
    setEditingSupplier(null)
    setSupplierDialogOpen(true)
  }, [])

  const handleEditSupplier = useCallback((supplier: SupplierFull) => {
    setSupplierSheetOpen(false)
    setEditingSupplier(supplier)
    setSupplierDialogOpen(true)
  }, [])

  const handleSupplierSubmit = useCallback(
    (data: Omit<SupplierFull, "id">) => {
      const apiPayload = {
        name: data.name,
        telephone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
        isActive: true,
      }
      if (editingSupplier) {
        updateSupplier.mutate(
          { id: Number(editingSupplier.id), data: apiPayload },
          { onSuccess: () => toast.success("Fournisseur modifié") }
        )
      } else {
        createSupplier.mutate(apiPayload, {
          onSuccess: () => toast.success("Fournisseur ajouté"),
        })
      }
    },
    [editingSupplier, updateSupplier, createSupplier]
  )

  const handleSupplierClick = useCallback((supplierId: string) => {
    setSupplierSheetId(supplierId)
    setSupplierSheetOpen(true)
  }, [])

  const handleDeleteSupplier = useCallback((supplierId: string) => {
    setDeletingSupplierId(supplierId)
    setDeleteConfirmOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (deletingSupplierId) {
      deleteSupplier.mutate(Number(deletingSupplierId), {
        onSuccess: () => {
          toast.success("Fournisseur supprimé")
          setSupplierSheetOpen(false)
          setDeleteConfirmOpen(false)
          setDeletingSupplierId(null)
        },
      })
    }
  }, [deletingSupplierId, deleteSupplier])

  const supplierSheetSupplier = supplierSheetId
    ? (suppliers.find((s) => s.id === supplierSheetId) ?? null)
    : null

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex shrink-0 items-center gap-3"
      >
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight">
            Mes fournisseurs
          </h1>
          <p className="text-sm text-muted-foreground">
            {suppliers.length} fournisseur{suppliers.length > 1 ? "s" : ""}
            {" · "}
            {products.length} produit{products.length > 1 ? "s" : ""} référencés
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={handleAddSupplier}>
            <HugeiconsIcon
              icon={Add01Icon}
              className="size-4"
              strokeWidth={2}
            />
            Nouveau fournisseur
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <InputGroup className="w-80 bg-background">
          <InputGroupAddon>
            <HugeiconsIcon
              icon={Search01Icon}
              className="size-4"
              strokeWidth={2}
            />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </motion.div>

      {/* Supplier cards */}
      <motion.div
        variants={fadeUp}
        className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {filtered.map((supplier, i) => {
          const linkedProducts = getSupplierProducts(supplier.id, products)
          const categoryLabel =
            CATEGORY_LABELS[supplier.category] ?? supplier.category

          return (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <Card
                className="cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => handleSupplierClick(supplier.id)}
              >
                {/* Top: Name + Category */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold">
                      {supplier.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          CATEGORY_DOT_COLORS[supplier.category] ??
                            "bg-slate-400"
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {categoryLabel}
                      </span>
                    </div>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="mt-1 size-4 shrink-0 text-muted-foreground/40"
                    strokeWidth={2}
                  />
                </div>

                {/* Contact info */}
                <div className="mt-4 space-y-1.5">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HugeiconsIcon
                        icon={Call02Icon}
                        className="size-3.5 shrink-0"
                        strokeWidth={2}
                      />
                      <span className="truncate">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        className="size-3.5 shrink-0"
                        strokeWidth={2}
                      />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HugeiconsIcon
                        icon={Location01Icon}
                        className="size-3.5 shrink-0"
                        strokeWidth={2}
                      />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                </div>

                {/* Footer: Products + Delivery */}
                <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HugeiconsIcon
                      icon={PackageIcon}
                      className="size-3.5"
                      strokeWidth={2}
                    />
                    <span>
                      <span className="font-medium text-foreground">
                        {linkedProducts.length}
                      </span>{" "}
                      produit{linkedProducts.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HugeiconsIcon
                      icon={DeliveryTruck01Icon}
                      className="size-3.5"
                      strokeWidth={2}
                    />
                    <span>~{supplier.averageDeliveryDays}j de livraison</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium">Aucun fournisseur trouvé</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Essayez un autre terme de recherche"
                : "Ajoutez votre premier fournisseur pour commencer"}
            </p>
            {!search && (
              <Button className="mt-4" onClick={handleAddSupplier}>
                <HugeiconsIcon
                  icon={Add01Icon}
                  className="size-4"
                  strokeWidth={2}
                />
                Ajouter un fournisseur
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <SupplierModal
        supplier={supplierSheetSupplier}
        products={products}
        orders={orders}
        productPortionSummaries={productPortionSummaries}
        recipes={recipes}
        open={supplierSheetOpen}
        onOpenChange={setSupplierSheetOpen}
        onOrder={() => toast.info("Commandes fournisseurs bientôt disponibles")}
        onEdit={handleEditSupplier}
        onDelete={handleDeleteSupplier}
      />

      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={editingSupplier}
        onSubmit={handleSupplierSubmit}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fournisseur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les produits associés ne seront pas
              supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
