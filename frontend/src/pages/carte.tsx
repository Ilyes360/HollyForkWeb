import { useState, useCallback, useMemo, useEffect } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import type { Recipe, RecipeCategory } from "@/components/carte/types"
import { useRecipeStore } from "@/stores/recipe-store"
import { useInventoryStore } from "@/stores/inventory-store"
import { usePortionCalculator } from "@/hooks/use-portion-calculator"
import { usePageTitle } from "@/hooks/use-page-title"
import { getCarteEmptyState } from "@/lib/copy/carte"
import { EmptyState } from "@/components/shared/empty-state"
import { CarteHeader } from "@/components/carte/carte-header"
import { CarteFilters } from "@/components/carte/carte-filters"
import { CategorySection } from "@/components/carte/category-section"
import { RecipeDetailModal } from "@/components/carte/recipe-detail-modal"
import { ProductDetailModal } from "@/components/stock/product-detail-modal"
import { OperationalBreadcrumb } from "@/components/carte/operational-breadcrumb"
import { useCarteOperational } from "@/components/carte/operational-view-context"

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

const CATEGORY_ORDER: RecipeCategory[] = [
  "entree",
  "plat",
  "dessert",
  "boisson",
]

export default function CartePage() {
  usePageTitle("Ma carte")
  const navigate = useNavigate()
  const opView = useCarteOperational()

  // Escape key to unlock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && opView.isLocked) {
        opView.clearChain()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [opView.isLocked, opView.clearChain])

  const recipes = useRecipeStore((s) => s.recipes)
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe)
  const duplicateRecipe = useRecipeStore((s) => s.duplicateRecipe)
  const toggleActive = useRecipeStore((s) => s.toggleActive)

  const products = useInventoryStore((s) => s.products)
  const suppliers = useInventoryStore((s) => s.suppliers)
  const orders = useInventoryStore((s) => s.orders)

  const { recipePortions, productPortionSummaries } = usePortionCalculator(
    recipes,
    products,
    suppliers
  )

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [productDetailOpen, setProductDetailOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [feasibilityFilter, setFeasibilityFilter] = useState("tous")

  const rankMap = useMemo(() => {
    const active = recipePortions
      .filter((r) => r.isActive && r.maxPortions > 0)
      .sort((a, b) => b.maxPortions - a.maxPortions)
    const map = new Map<string, number>()
    active.slice(0, 3).forEach((r, i) => map.set(r.recipeId, i + 1))
    return map
  }, [recipePortions])

  const servableCount = recipePortions.filter((r) => r.maxPortions > 0).length
  const ruptureCount = recipePortions.filter((r) => r.maxPortions === 0).length
  const totalCount = recipePortions.length

  const filteredPortions = useMemo(() => {
    let result = recipePortions

    if (feasibilityFilter === "realisable") {
      result = result.filter((r) => r.maxPortions > 0)
    } else if (feasibilityFilter === "non_realisable") {
      result = result.filter((r) => r.maxPortions === 0)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.recipeName.toLowerCase().includes(q))
    }

    return result
  }, [recipePortions, feasibilityFilter, search])

  const groupedByCategory = useMemo(() => {
    const map = new Map<
      RecipeCategory,
      import("@/components/carte/types").RecipePortionInfo[]
    >()
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, [])
    }
    for (const info of filteredPortions) {
      map.get(info.category)?.push(info)
    }
    return map
  }, [filteredPortions])

  const selectedRecipe = useMemo(
    () =>
      selectedRecipeId
        ? (recipes.find((r) => r.id === selectedRecipeId) ?? null)
        : null,
    [selectedRecipeId, recipes]
  )
  const selectedPortionInfo = useMemo(
    () =>
      selectedRecipeId
        ? (recipePortions.find((p) => p.recipeId === selectedRecipeId) ?? null)
        : null,
    [selectedRecipeId, recipePortions]
  )

  const handleSelectRecipe = useCallback((recipeId: string) => {
    setSelectedRecipeId(recipeId)
    setDetailOpen(true)
  }, [])

  const handleEdit = useCallback(
    (recipe: Recipe) => {
      setDetailOpen(false)
      navigate(`/cuisine/${recipe.id}/modifier`)
    },
    [navigate]
  )

  const handleDuplicate = useCallback(
    (recipe: Recipe) => {
      duplicateRecipe(recipe.id)
    },
    [duplicateRecipe]
  )

  const handleToggleActive = useCallback(
    (recipe: Recipe) => {
      toggleActive(recipe.id)
    },
    [toggleActive]
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteRecipe(id)
      if (selectedRecipeId === id) {
        setDetailOpen(false)
        setSelectedRecipeId(null)
      }
    },
    [deleteRecipe, selectedRecipeId]
  )

  const handleAlertClick = useCallback(() => {
    setFeasibilityFilter("non_realisable")
  }, [])

  const handleSelectProduct = useCallback((productId: string) => {
    setSelectedProductId(productId)
    setProductDetailOpen(true)
  }, [])

  const selectedProduct = useMemo(
    () =>
      selectedProductId
        ? (products.find((p) => p.id === selectedProductId) ?? null)
        : null,
    [selectedProductId, products]
  )
  const selectedProductSupplier = useMemo(
    () =>
      selectedProduct
        ? (suppliers.find((s) => s.id === selectedProduct.supplierId) ?? null)
        : null,
    [selectedProduct, suppliers]
  )
  const selectedProductSummary = useMemo(
    () =>
      selectedProductId
        ? (productPortionSummaries.find(
            (s) => s.productId === selectedProductId
          ) ?? null)
        : null,
    [selectedProductId, productPortionSummaries]
  )

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <CarteHeader onAddRecipe={() => navigate("/cuisine/nouvelle")} />
      </motion.div>

      <motion.div variants={fadeUp}>
        {opView.isLocked ? (
          <OperationalBreadcrumb
            products={products}
            suppliers={suppliers}
            recipePortions={recipePortions}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-emerald-600">
              {servableCount}/{totalCount} recettes servables
            </span>
            {ruptureCount > 0 && (
              <>
                {" · "}
                <button
                  type="button"
                  className="font-medium text-destructive hover:underline"
                  onClick={handleAlertClick}
                >
                  {ruptureCount} en rupture
                </button>
              </>
            )}
          </p>
        )}
      </motion.div>

      <motion.div variants={fadeUp}>
        <CarteFilters
          search={search}
          feasibilityFilter={feasibilityFilter}
          onSearchChange={setSearch}
          onFeasibilityFilterChange={setFeasibilityFilter}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="min-h-0 flex-1 space-y-6">
        {filteredPortions.length > 0
          ? CATEGORY_ORDER.map((cat) => (
              <CategorySection
                key={cat}
                category={cat}
                portionInfos={groupedByCategory.get(cat) ?? []}
                recipes={recipes}
                products={products}
                suppliers={suppliers}
                rankMap={rankMap}
                onSelectRecipe={handleSelectRecipe}
                onSelectProduct={handleSelectProduct}
              />
            ))
          : (() => {
              const hasFilters = !!(search || feasibilityFilter !== "tous")
              const empty = getCarteEmptyState(hasFilters)
              return (
                <EmptyState
                  title={empty.title}
                  description={empty.description}
                  actionLabel={empty.actionLabel}
                  onAction={() => navigate("/cuisine/nouvelle")}
                />
              )
            })()}
      </motion.div>

      <RecipeDetailModal
        recipe={selectedRecipe}
        portionInfo={selectedPortionInfo}
        products={products}
        suppliers={suppliers}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />

      <ProductDetailModal
        product={selectedProduct}
        supplier={selectedProductSupplier}
        portionSummary={selectedProductSummary}
        recipes={recipes}
        allProducts={products}
        allOrders={orders}
        open={productDetailOpen}
        onOpenChange={setProductDetailOpen}
        onOrder={() => {}}
        onDelete={() => {}}
        onOpenSupplierSheet={() => {}}
      />
    </motion.div>
  )
}
