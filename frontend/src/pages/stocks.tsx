import { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import type { Product } from "@/components/stocks/types"
import { useInventoryStore } from "@/stores/inventory-store"
import { getSupplierProducts } from "@/components/fournisseurs/utils"
import { StocksHeader } from "@/components/stocks/stocks-header"
import { StocksKpis } from "@/components/stocks/stocks-kpis"
import { StorageZones } from "@/components/stocks/storage-zones"
import { StocksTable } from "@/components/stocks/stocks-table"
import { ProductDetail } from "@/components/stocks/product-detail"
import { OrderDialog } from "@/components/fournisseurs/order-dialog"
import type { OrderItem } from "@/components/fournisseurs/types"
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

export default function StocksPage() {
  usePageTitle("Stocks")
  const navigate = useNavigate()
  const { products, suppliers, deleteProduct, addOrder } =
    useInventoryStore()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("tous")
  const [zoneFilter, setZoneFilter] = useState("toutes")
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderSupplierId, setOrderSupplierId] = useState<string | null>(null)
  const [preSelectedProductId, setPreSelectedProductId] = useState<string | undefined>(undefined)

  // Keep selectedProduct in sync with store
  const currentProduct = selectedProduct
    ? products.find((p) => p.id === selectedProduct.id) ?? null
    : null

  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
    setDetailOpen(true)
  }, [])

  const handleAlertClick = useCallback(() => {
    setStatusFilter("rupture")
  }, [])

  const handleOrderFromDetail = useCallback(
    (product: Product) => {
      const supplier = suppliers.find((s) => s.id === product.supplierId)
      if (supplier) {
        setOrderSupplierId(supplier.id)
        setPreSelectedProductId(product.id)
        setOrderDialogOpen(true)
      }
    },
    [suppliers]
  )

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

  const handleDelete = useCallback(
    (id: string) => {
      deleteProduct(id)
      if (selectedProduct?.id === id) {
        setDetailOpen(false)
        setSelectedProduct(null)
      }
    },
    [deleteProduct, selectedProduct]
  )

  const handleExport = useCallback(() => {
    // no-op V1
  }, [])

  const orderSupplier = orderSupplierId
    ? suppliers.find((s) => s.id === orderSupplierId) ?? null
    : null

  const orderProducts = orderSupplier
    ? getSupplierProducts(orderSupplier.id, products)
    : []

  // Build simple suppliers list for table/detail
  const simpleSuppliers = suppliers.map((s) => ({ id: s.id, name: s.name }))

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <StocksHeader onExport={handleExport} onAddProduct={() => navigate("/stocks/nouveau")} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <StocksKpis products={products} onAlertClick={handleAlertClick} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <StorageZones
          products={products}
          activeZone={zoneFilter}
          onZoneChange={setZoneFilter}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="min-h-0 flex-1">
        <StocksTable
          products={products}
          suppliers={simpleSuppliers}
          statusFilter={statusFilter}
          zoneFilter={zoneFilter}
          onStatusFilterChange={setStatusFilter}
          onSelectProduct={handleSelectProduct}
          onOrder={handleOrderFromDetail}
          onDelete={handleDelete}
        />
      </motion.div>

      <ProductDetail
        product={currentProduct}
        suppliers={simpleSuppliers}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onOrder={handleOrderFromDetail}
        onDelete={handleDelete}
      />

      <OrderDialog
        supplier={orderSupplier}
        products={orderProducts}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSubmit={handleSubmitOrder}
        preSelectedProductId={preSelectedProductId}
      />
    </motion.div>
  )
}
