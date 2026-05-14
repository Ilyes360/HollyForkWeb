import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ClipboardIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import type { Product } from "@/components/stock/types"
import { useInventoryStore } from "@/stores/inventory-store"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { useArticles } from "@/hooks/use-articles"
import { useStocks } from "@/hooks/use-stocks"
import { useSuppliers } from "@/hooks/use-suppliers"
import { useOrders } from "@/hooks/use-orders"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { usePortionCalculator } from "@/hooks/use-portion-calculator"
import { usePageTitle } from "@/hooks/use-page-title"
import { apiDelete, apiPost } from "@/api/client"
import {
  getProductStatus,
  getZoneHealth,
  getTotalStockValue,
} from "@/components/stock/utils"
import { getSupplierProducts } from "@/components/commandes/utils"
import { getStockEmptyState } from "@/lib/copy/stock"
import type { OrderItem } from "@/components/commandes/types"

import { StockHeader } from "@/components/stock/stock-header"
import { StockFilters } from "@/components/stock/stock-filters"
import { StockZoneSection } from "@/components/stock/stock-zone-section"
import { StockInventoryBanner } from "@/components/stock/stock-inventory-banner"
import { ZoneManagerPanel } from "@/components/stock/zone-manager-panel"
import { ProductDetailModal } from "@/components/stock/product-detail-modal"
import { RecipeDetailModal } from "@/components/carte/recipe-detail-modal"
import { SupplierModal } from "@/components/shared/supplier-modal"
import { OrderDialog } from "@/components/commandes/order-dialog"
import { EmptyState } from "@/components/shared/empty-state"

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

export default function StocksPage() {
  usePageTitle("Mon stock")
  const navigate = useNavigate()
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const queryClient = useQueryClient()

  // ── Data (API is source of truth) ──
  const { restaurantId } = useActiveRestaurant()
  const { data: products } = useStocks(restaurantId)
  const { data: suppliers } = useSuppliers()
  const { data: orders } = useOrders(restaurantId)
  const storageZones = useInventoryStore((s) => s.storageZones)
  const categories = useInventoryStore((s) => s.categories)
  const updateProduct = useInventoryStore((s) => s.updateProduct)
  const deleteProductStore = useInventoryStore((s) => s.deleteProduct)
  const addOrderStore = useInventoryStore((s) => s.addOrder)
  const { data: recipes } = useArticles()

  // ── Portions ──
  const { recipePortions, productPortionSummaries } = usePortionCalculator(
    recipes, products, suppliers
  )
  const portionMap = useMemo(
    () => new Map(productPortionSummaries.map((s) => [s.productId, s])),
    [productPortionSummaries]
  )

  // ── State ──
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("toutes")
  const [supplierFilter, setSupplierFilter] = useState("tous")

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [zoneManagerOpen, setZoneManagerOpen] = useState(false)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderSupplierId, setOrderSupplierId] = useState<string | null>(null)
  const [preSelectedProductId, setPreSelectedProductId] = useState<string | undefined>(undefined)
  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false)
  const [supplierSheetId, setSupplierSheetId] = useState<string | null>(null)

  // Recipe detail (for chip clicks)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false)

  // Inventory mode
  const [inventoryMode, setInventoryMode] = useState(false)
  const [inventoryValues, setInventoryValues] = useState<Map<string, number>>(new Map())

  // ── Computed ──
  const currentProduct = selectedProduct
    ? products.find((p) => p.id === selectedProduct.id) ?? null
    : null
  const currentSupplier = currentProduct
    ? suppliers.find((s) => s.id === currentProduct.supplierId) ?? null
    : null
  const currentPortionSummary = currentProduct
    ? portionMap.get(currentProduct.id) ?? null
    : null
  const supplierSheetSupplier = supplierSheetId
    ? suppliers.find((s) => s.id === supplierSheetId) ?? null
    : null

  const selectedRecipe = selectedRecipeId
    ? recipes.find((r) => r.id === selectedRecipeId) ?? null
    : null
  const selectedRecipePortionInfo = selectedRecipeId
    ? recipePortions.find((p) => p.recipeId === selectedRecipeId) ?? null
    : null

  // ── Filtering ──
  const filtered = useMemo(() => {
    let result = products
    if (categoryFilter !== "toutes") {
      result = result.filter((p) => p.category === categoryFilter)
    }
    if (supplierFilter !== "tous") {
      result = result.filter((p) => p.supplierId === supplierFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }
    return result
  }, [products, categoryFilter, supplierFilter, search])

  // ── Compteurs ──
  const ruptureCount = products.filter((p) => getProductStatus(p) === "rupture").length
  const faibleCount = products.filter((p) => getProductStatus(p) === "stock_faible").length
  const okCount = products.length - ruptureCount - faibleCount
  const totalValue = getTotalStockValue(products)

  // ── Filter options ──
  const categoryOptions = useMemo(() => [
    { value: "toutes", label: "Toutes catégories" },
    ...categories.map((c) => ({ value: c.id, label: c.label })),
  ], [categories])

  const supplierOptions = useMemo(() => [
    { value: "tous", label: "Tous fournisseurs" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ], [suppliers])

  // ── Groupement par zone ──
  const productsByZone = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const zone of storageZones) {
      map.set(zone.id, [])
    }
    for (const product of filtered) {
      const arr = map.get(product.storageZone)
      if (arr) arr.push(product)
      else {
        if (!map.has("non_assigne")) map.set("non_assigne", [])
        map.get("non_assigne")!.push(product)
      }
    }
    return map
  }, [filtered, storageZones])

  // ── Handlers ──
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
    setDetailOpen(true)
  }, [])

  const handleSelectRecipe = useCallback((recipeId: string) => {
    setSelectedRecipeId(recipeId)
    setRecipeDetailOpen(true)
  }, [])

  const handleOrderFromDetail = useCallback((product: Product) => {
    const supplier = suppliers.find((s) => s.id === product.supplierId)
    if (supplier) {
      setOrderSupplierId(supplier.id)
      setPreSelectedProductId(product.id)
      setOrderDialogOpen(true)
    }
  }, [suppliers])

  const handleOrderFromSupplier = useCallback((supplierId: string) => {
    setOrderSupplierId(supplierId)
    setPreSelectedProductId(undefined)
    setOrderDialogOpen(true)
  }, [])

  const handleSubmitOrder = useCallback(
    async (data: { supplierId: string; items: OrderItem[]; notes: string }) => {
      const totalAmount = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice, 0
      )
      const supplier = suppliers.find((s) => s.id === data.supplierId)

      if (!isDevMode) {
        try {
          await apiPost("suppliers/orders/", {
            supplierId: data.supplierId,
            items: data.items,
            notes: data.notes,
            totalAmount,
          })
          toast.success("Commande créée")
          queryClient.invalidateQueries({ queryKey: ["orders"] })
        } catch {
          toast.error("Erreur lors de la création de la commande")
        }
      } else {
        const newOrder = {
          id: `ord-${Date.now()}`,
          supplierId: data.supplierId,
          items: data.items,
          date: toLocalDateString(new Date()),
          status: "pending" as const,
          totalAmount,
          expectedDelivery: daysFromNow(supplier?.averageDeliveryDays ?? 3),
          notes: data.notes,
        }
        addOrderStore(newOrder)
      }
    },
    [suppliers, isDevMode, addOrderStore, queryClient]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!isDevMode) {
        try {
          await apiDelete(`stocks/${id}/`)
          toast.success("Produit supprimé")
          queryClient.invalidateQueries({ queryKey: ["stocks"] })
        } catch {
          toast.error("Erreur lors de la suppression")
        }
      } else {
        deleteProductStore(id)
      }
      if (selectedProduct?.id === id) {
        setDetailOpen(false)
        setSelectedProduct(null)
      }
    },
    [isDevMode, deleteProductStore, selectedProduct, queryClient]
  )

  const handleOpenSupplierSheet = useCallback((supplierId: string) => {
    setSupplierSheetId(supplierId)
    setSupplierSheetOpen(true)
  }, [])

  // ── Inventory mode ──
  const handleStartInventory = useCallback(() => {
    setInventoryMode(true)
    setInventoryValues(new Map())
  }, [])

  const handleInventoryChange = useCallback((productId: string, value: number) => {
    setInventoryValues((prev) => {
      const next = new Map(prev)
      next.set(productId, value)
      return next
    })
  }, [])

  const handleSaveInventory = useCallback(() => {
    // Inventory mode uses local store — stocks/{id}/adjust/ requires ingredient context
    inventoryValues.forEach((value, productId) => {
      const product = products.find((p) => p.id === productId)
      if (product && product.quantity !== value) {
        updateProduct(productId, { quantity: value })
      }
    })
    setInventoryMode(false)
    setInventoryValues(new Map())
  }, [inventoryValues, products, updateProduct])

  const handleCancelInventory = useCallback(() => {
    setInventoryMode(false)
    setInventoryValues(new Map())
  }, [])

  // Order helpers
  const orderSupplier = orderSupplierId
    ? suppliers.find((s) => s.id === orderSupplierId) ?? null
    : null
  const orderProducts = orderSupplier
    ? getSupplierProducts(orderSupplier.id, products)
    : []

  return (
    <motion.div
      className="flex h-full flex-col gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <StockHeader
          totalProducts={products.length}
          totalValue={totalValue}
          ruptureCount={ruptureCount}
          faibleCount={faibleCount}
          okCount={okCount}
          onAddProduct={() => navigate("/stocks/nouveau")}
          onOpenZoneManager={() => setZoneManagerOpen(true)}
        />
      </motion.div>

      {/* Filtres */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between gap-3">
          <StockFilters
            search={search}
            categoryFilter={categoryFilter}
            supplierFilter={supplierFilter}
            onSearchChange={setSearch}
            onCategoryFilterChange={setCategoryFilter}
            onSupplierFilterChange={setSupplierFilter}
            categories={categoryOptions}
            suppliers={supplierOptions}
          />

          {!inventoryMode && (
            <Button variant="outline" size="sm" onClick={handleStartInventory}>
              <HugeiconsIcon icon={ClipboardIcon} className="size-4" strokeWidth={2} />
              Inventaire
            </Button>
          )}
        </div>
      </motion.div>

      {/* Bannière mode inventaire */}
      {inventoryMode && (
        <motion.div variants={fadeUp}>
          <StockInventoryBanner
            changedCount={inventoryValues.size}
            onSave={handleSaveInventory}
            onCancel={handleCancelInventory}
          />
        </motion.div>
      )}

      {/* Contenu principal */}
      <motion.div variants={fadeUp} className="min-h-0 flex-1 space-y-4">
        {filtered.length > 0 ? (
          storageZones.map((zone) => {
            const zoneProducts = productsByZone.get(zone.id) ?? []
            const health = zoneProducts.length > 0 ? getZoneHealth(zoneProducts) : "ok"
            return (
              <StockZoneSection
                key={zone.id}
                zone={zone}
                products={zoneProducts}
                portionSummaries={portionMap}
                defaultCollapsed={health === "ok"}
                onSelectProduct={handleSelectProduct}
                inventoryMode={inventoryMode}
                inventoryValues={inventoryValues}
                onInventoryChange={handleInventoryChange}
              />
            )
          })
        ) : (() => {
          const hasFilters = search.trim() !== "" || categoryFilter !== "toutes" || supplierFilter !== "tous"
          const empty = getStockEmptyState(hasFilters)
          return (
            <EmptyState
              title={empty.title}
              description={empty.description}
              actionLabel={empty.actionLabel}
              onAction={() => navigate("/stocks/nouveau")}
            />
          )
        })()}
      </motion.div>

      {/* ── Modals ── */}

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

      <RecipeDetailModal
        recipe={selectedRecipe}
        portionInfo={selectedRecipePortionInfo}
        products={products}
        suppliers={suppliers}
        open={recipeDetailOpen}
        onOpenChange={setRecipeDetailOpen}
        onEdit={(r) => { setRecipeDetailOpen(false); navigate(`/cuisine/${r.id}/modifier`) }}
        onDuplicate={() => {}}
        onToggleActive={() => {}}
        onDelete={() => {}}
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

      <ZoneManagerPanel
        open={zoneManagerOpen}
        onOpenChange={setZoneManagerOpen}
      />
    </motion.div>
  )
}
