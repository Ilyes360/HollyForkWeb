import { useState, useCallback } from "react"
import { useArticles } from "@/hooks/use-articles"
import { useStocks } from "@/hooks/use-stocks"
import { useSuppliers } from "@/hooks/use-suppliers"
import { useOrders } from "@/hooks/use-orders"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { usePortionCalculator } from "@/hooks/use-portion-calculator"
import { OperationalProductPanel } from "./operational-product-panel"
import { ProductDetailModal } from "@/components/stock/product-detail-modal"

export function CarteProductSidebar() {
  const { restaurantId } = useActiveRestaurant()
  const { data: products } = useStocks(restaurantId)
  const { data: suppliers } = useSuppliers()
  const { data: orders } = useOrders(restaurantId)
  const { data: recipes } = useArticles()

  const { productPortionSummaries } = usePortionCalculator(recipes, products, suppliers)

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [productDetailOpen, setProductDetailOpen] = useState(false)

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId)
    setProductDetailOpen(true)
  }, [])

  const selectedProduct = selectedProductId
    ? (products.find((p) => p.id === selectedProductId) ?? null)
    : null
  const selectedSupplier = selectedProduct
    ? (suppliers.find((s) => s.id === selectedProduct.supplierId) ?? null)
    : null
  const selectedSummary = selectedProductId
    ? (productPortionSummaries.find((s) => s.productId === selectedProductId) ?? null)
    : null

  return (
    <>
      <OperationalProductPanel
        products={products}
        suppliers={suppliers}
        productPortionSummaries={productPortionSummaries}
        onSelectProduct={handleSelectProduct}
      />
      <ProductDetailModal
        product={selectedProduct}
        supplier={selectedSupplier}
        portionSummary={selectedSummary}
        recipes={recipes}
        allProducts={products}
        allOrders={orders}
        open={productDetailOpen}
        onOpenChange={setProductDetailOpen}
        onOrder={() => {}}
        onDelete={() => {}}
        onOpenSupplierSheet={() => {}}
      />
    </>
  )
}
