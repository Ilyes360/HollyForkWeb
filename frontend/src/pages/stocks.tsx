import { useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import type { Product } from "@/components/stock/types"
import { useInventoryStore } from "@/stores/inventory-store"
import { useRecipeStore } from "@/stores/recipe-store"
import { usePortionCalculator } from "@/hooks/use-portion-calculator"
import { getSupplierProducts } from "@/components/commandes/utils"
import { StockHeader } from "@/components/stock/stock-header"
import { StorageZones } from "@/components/stock/storage-zones"
import { StockTable } from "@/components/stock/stock-table"
import { ProductDetailModal } from "@/components/stock/product-detail-modal"
import { SupplierModal } from "@/components/shared/supplier-modal"
import { OrderDialog } from "@/components/commandes/order-dialog"
import type { OrderItem } from "@/components/commandes/types"
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
  usePageTitle("Mon stock")
  const navigate = useNavigate()
  const recipes = useRecipeStore((s) => s.recipes)
  const { products, suppliers, orders, deleteProduct, addOrder } = useInventoryStore()

  // Portions
  const { recipePortions, productPortionSummaries } = usePortionCalculator(
    recipes,
    products,
    suppliers
  )

  // State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("tous")
  const [zoneFilter, setZoneFilter] = useState("toutes")
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderSupplierId, setOrderSupplierId] = useState<string | null>(null)
  const [preSelectedProductId, setPreSelectedProductId] = useState<string | undefined>(undefined)
  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false)
  const [supplierSheetId, setSupplierSheetId] = useState<string | null>(null)

  // Keep selectedProduct in sync with store
  const currentProduct = selectedProduct
    ? products.find((p) => p.id === selectedProduct.id) ?? null
    : null

  const currentSupplier = currentProduct
    ? suppliers.find((s) => s.id === currentProduct.supplierId) ?? null
    : null

  const currentPortionSummary = currentProduct
    ? productPortionSummaries.find((s) => s.productId === currentProduct.id) ?? null
    : null

  const supplierSheetSupplier = supplierSheetId
    ? suppliers.find((s) => s.id === supplierSheetId) ?? null
    : null

  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
    setDetailOpen(true)
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

  const handleOrderFromSupplier = useCallback((supplierId: string) => {
    setOrderSupplierId(supplierId)
    setPreSelectedProductId(undefined)
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

  const handleOpenSupplierSheet = useCallback((supplierId: string) => {
    setSupplierSheetId(supplierId)
    setSupplierSheetOpen(true)
  }, [])

  const orderSupplier = orderSupplierId
    ? suppliers.find((s) => s.id === orderSupplierId) ?? null
    : null

  const orderProducts = orderSupplier
    ? getSupplierProducts(orderSupplier.id, products)
    : []

  // Build simple suppliers list for table
  const simpleSuppliers = suppliers.map((s) => ({ id: s.id, name: s.name }))

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <StockHeader onAddProduct={() => navigate("/stocks/nouveau")} />
      </motion.div>

      <motion.div variants={fadeUp}>
        <StorageZones
          products={products}
          activeZone={zoneFilter}
          onZoneChange={setZoneFilter}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="min-h-0 flex-1">
        <StockTable
          products={products}
          suppliers={simpleSuppliers}
          portionSummaries={productPortionSummaries}
          recipePortions={recipePortions}
          statusFilter={statusFilter}
          zoneFilter={zoneFilter}
          onStatusFilterChange={setStatusFilter}
          onSelectProduct={handleSelectProduct}
          onOrder={handleOrderFromDetail}
          onDelete={handleDelete}
          onAddProduct={() => navigate("/stocks/nouveau")}
        />
      </motion.div>

      <ProductDetailModal
        product={currentProduct}
        supplier={currentSupplier}
        portionSummary={currentPortionSummary}
        recipes={recipes}
        allProducts={products}
        allOrders={orders}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onOrder={handleOrderFromDetail}
        onDelete={handleDelete}
        onOpenSupplierSheet={handleOpenSupplierSheet}
      />

      <SupplierModal
        supplier={supplierSheetSupplier}
        products={products}
        orders={orders}
        productPortionSummaries={productPortionSummaries}
        recipes={recipes}
        open={supplierSheetOpen}
        onOpenChange={setSupplierSheetOpen}
        onOrder={handleOrderFromSupplier}
        zIndex={62}
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
