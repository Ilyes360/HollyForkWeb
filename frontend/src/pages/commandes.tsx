import { useState, useCallback, useMemo } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { useArticles } from "@/hooks/use-articles"
import { useStocks } from "@/hooks/use-stocks"
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/use-suppliers"
import { useOrders, useCreateOrder, useUpdateOrder } from "@/hooks/use-orders"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { usePortionCalculator } from "@/hooks/use-portion-calculator"
import { usePageTitle } from "@/hooks/use-page-title"
import { getTotalMonthlySpend } from "@/components/commandes/utils"
import { getSupplierProducts } from "@/components/commandes/utils"
import type { OrderItem, SupplierFull } from "@/components/commandes/types"
import { CommandesHeader } from "@/components/commandes/commandes-header"
import { OrderSummaryBar } from "@/components/commandes/order-summary-bar"
import { PendingOrders } from "@/components/commandes/pending-orders"
import { OrderHistoryTable } from "@/components/commandes/order-history-table"
import { ReceiveOrderDialog } from "@/components/commandes/receive-order-dialog"
import { SupplierModal } from "@/components/shared/supplier-modal"
import { OrderDialog } from "@/components/commandes/order-dialog"
import { SupplierDialog } from "@/components/commandes/supplier-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function CommandesPage() {
  usePageTitle("Commandes")
  const { restaurantId } = useActiveRestaurant()
  const { data: recipes } = useArticles()
  const { data: products } = useStocks(restaurantId)
  const { data: suppliers } = useSuppliers()
  const { data: orders } = useOrders(restaurantId)

  // Mutations
  const updateOrder = useUpdateOrder()
  const createOrder = useCreateOrder()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const { productPortionSummaries } = usePortionCalculator(
    recipes,
    products,
    suppliers
  )

  // State
  const [activeTab, setActiveTab] = useState<string>("en_cours")
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderSupplierId, setOrderSupplierId] = useState<string | null>(null)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [receiveOrder, setReceiveOrder] = useState<
    (typeof orders)[number] | null
  >(null)
  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false)
  const [supplierSheetId, setSupplierSheetId] = useState<string | null>(null)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierFull | null>(
    null
  )
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(
    null
  )

  // Derived data
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending"),
    [orders]
  )
  const historyOrders = useMemo(
    () => orders.filter((o) => o.status !== "pending"),
    [orders]
  )
  const pendingAmount = useMemo(
    () => pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    [pendingOrders]
  )
  const activeSupplierCount = useMemo(
    () =>
      new Set(
        orders.filter((o) => o.status !== "cancelled").map((o) => o.supplierId)
      ).size,
    [orders]
  )
  const monthlySpend = useMemo(() => getTotalMonthlySpend(orders), [orders])

  // Handlers
  const handleOpenOrder = useCallback(() => {
    setOrderSupplierId(suppliers[0]?.id ?? null)
    setOrderDialogOpen(true)
  }, [suppliers])

  const handleReceive = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId)
      if (order) {
        setReceiveOrder(order)
        setReceiveDialogOpen(true)
      }
    },
    [orders]
  )

  const handleConfirmReceive = useCallback(
    (orderId: string, _receivedQuantities: Record<string, number>) => {
      updateOrder.mutate(
        { id: Number(orderId), data: { status: "DELIVERED" } },
        { onSuccess: () => toast.success("Commande marquée comme livrée") }
      )
    },
    [updateOrder]
  )

  const handleCancel = useCallback(
    (orderId: string) => {
      updateOrder.mutate(
        { id: Number(orderId), data: { status: "CANCELLED" } },
        { onSuccess: () => toast.success("Commande annulée") }
      )
    },
    [updateOrder]
  )

  const handleSupplierClick = useCallback((supplierId: string) => {
    setSupplierSheetId(supplierId)
    setSupplierSheetOpen(true)
  }, [])

  const handleOrderFromSupplier = useCallback((supplierId: string) => {
    setOrderSupplierId(supplierId)
    setOrderDialogOpen(true)
  }, [])

  const handleAddSupplier = useCallback(() => {
    setEditingSupplier(null)
    setSupplierDialogOpen(true)
  }, [])

  const handleEditSupplier = useCallback((supplier: SupplierFull) => {
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

  const handleSubmitOrder = useCallback(
    (data: { supplierId: string; items: OrderItem[]; notes: string }) => {
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      )

      createOrder.mutate(
        {
          fournisseurId: Number(data.supplierId),
          restaurantId: restaurantId!,
          notes: data.notes || undefined,
        },
        { onSuccess: () => toast.success("Commande créée") }
      )
      void totalAmount // TODO: send items when backend supports order lines creation
    },
    [createOrder, restaurantId]
  )

  // Resolved entities
  const orderSupplier = orderSupplierId
    ? (suppliers.find((s) => s.id === orderSupplierId) ?? null)
    : null

  const orderProducts = orderSupplier
    ? getSupplierProducts(orderSupplier.id, products)
    : []

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
      <motion.div variants={fadeUp}>
        <CommandesHeader
          onOrder={handleOpenOrder}
          onAddSupplier={handleAddSupplier}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <OrderSummaryBar
          pendingCount={pendingOrders.length}
          pendingAmount={pendingAmount}
          supplierCount={activeSupplierCount}
          monthlySpend={monthlySpend}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="min-h-0 flex-1">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full flex-col"
        >
          <TabsList>
            <TabsTrigger value="en_cours">
              En cours
              {pendingOrders.length > 0 ? ` (${pendingOrders.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="en_cours" className="mt-4 flex-1">
            <PendingOrders
              orders={pendingOrders}
              suppliers={suppliers}
              products={products}
              onReceive={handleReceive}
              onCancel={handleCancel}
              onSupplierClick={handleSupplierClick}
            />
          </TabsContent>

          <TabsContent value="historique" className="mt-4 min-h-0 flex-1">
            <OrderHistoryTable
              orders={historyOrders}
              suppliers={suppliers}
              products={products}
              onSupplierClick={handleSupplierClick}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      <SupplierModal
        supplier={supplierSheetSupplier}
        products={products}
        orders={orders}
        productPortionSummaries={productPortionSummaries}
        recipes={recipes}
        open={supplierSheetOpen}
        onOpenChange={setSupplierSheetOpen}
        onOrder={handleOrderFromSupplier}
        onEdit={handleEditSupplier}
        onDelete={handleDeleteSupplier}
      />

      <OrderDialog
        supplier={orderSupplier}
        products={orderProducts}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSubmit={handleSubmitOrder}
        allSuppliers={suppliers}
        allProducts={products}
      />

      <ReceiveOrderDialog
        order={receiveOrder}
        products={products}
        suppliers={suppliers}
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        onConfirm={handleConfirmReceive}
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
              Cette action est irréversible. Les produits et commandes associés
              ne seront pas supprimés.
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
