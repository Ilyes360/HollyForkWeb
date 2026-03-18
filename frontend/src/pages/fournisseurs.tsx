import { useState, useCallback } from "react"
import { motion } from "motion/react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SupplierFull, OrderItem } from "@/components/fournisseurs/types"
import { useInventoryStore } from "@/stores/inventory-store"
import { getSupplierProducts } from "@/components/fournisseurs/utils"
import { FournisseursHeader } from "@/components/fournisseurs/fournisseurs-header"
import { FournisseursKpis } from "@/components/fournisseurs/fournisseurs-kpis"
import { SuppliersTab } from "@/components/fournisseurs/suppliers-tab"
import { OrdersTab } from "@/components/fournisseurs/orders-tab"
import { AddSupplierDialog } from "@/components/fournisseurs/add-supplier-dialog"
import type { AddSupplierFormValues } from "@/components/fournisseurs/add-supplier-dialog"
import { OrderDialog } from "@/components/fournisseurs/order-dialog"
import { usePageTitle } from "@/hooks/use-page-title"

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

const TODAY = toLocalDateString(new Date())

export default function FournisseursPage() {
  usePageTitle("Fournisseurs")
  const {
    suppliers,
    orders,
    products,
    addSupplier,
    deleteSupplier,
    addOrder,
  } = useInventoryStore()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderSupplier, setOrderSupplier] = useState<SupplierFull | null>(null)
  const [activeTab, setActiveTab] = useState("fournisseurs")

  const handleAddSupplier = useCallback(
    (data: AddSupplierFormValues) => {
      const newSupplier: SupplierFull = {
        id: `s-${Date.now()}`,
        name: data.name,
        category: data.category,
        phone: data.phone,
        email: data.email,
        address: data.address,
        averageDeliveryDays: data.averageDeliveryDays,
        notes: data.notes,
      }
      addSupplier(newSupplier)
    },
    [addSupplier]
  )

  const handleDeleteSupplier = useCallback(
    (id: string) => {
      deleteSupplier(id)
    },
    [deleteSupplier]
  )

  const handleOpenOrder = useCallback((supplier: SupplierFull) => {
    setOrderSupplier(supplier)
    setOrderDialogOpen(true)
  }, [])

  const handleSubmitOrder = useCallback(
    (data: { supplierId: string; items: OrderItem[]; notes: string }) => {
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      )
      const supplier = suppliers.find((s) => s.id === data.supplierId)
      const newOrder = {
        id: `ord-${Date.now()}`,
        supplierId: data.supplierId,
        items: data.items,
        date: TODAY,
        status: "pending" as const,
        totalAmount,
        expectedDelivery: daysFromNow(supplier?.averageDeliveryDays ?? 3),
        notes: data.notes,
      }
      addOrder(newOrder)
    },
    [suppliers, addOrder]
  )

  const handleHeaderOrder = useCallback(() => {
    if (suppliers.length > 0) {
      setOrderSupplier(suppliers[0])
      setOrderDialogOpen(true)
    }
  }, [suppliers])

  const orderProducts = orderSupplier
    ? getSupplierProducts(orderSupplier.id, products)
    : []

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <FournisseursHeader
          onOrder={handleHeaderOrder}
          onAddSupplier={() => setAddDialogOpen(true)}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <FournisseursKpis suppliers={suppliers} orders={orders} />
      </motion.div>

      <motion.div variants={fadeUp} className="min-h-0 flex-1 flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
            <TabsTrigger value="commandes">Commandes</TabsTrigger>
          </TabsList>
        </Tabs>
        {activeTab === "fournisseurs" ? (
          <SuppliersTab
            suppliers={suppliers}
            products={products}
            orders={orders}
            onOrder={handleOpenOrder}
            onDelete={handleDeleteSupplier}
          />
        ) : (
          <OrdersTab
            orders={orders}
            suppliers={suppliers}
            products={products}
          />
        )}
      </motion.div>

      <AddSupplierDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddSupplier}
      />

      <OrderDialog
        supplier={orderSupplier}
        products={orderProducts}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSubmit={handleSubmitOrder}
      />
    </motion.div>
  )
}
