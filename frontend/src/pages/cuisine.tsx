import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import type { Recipe } from "@/components/cuisine/types"
import { MOCK_PRODUCTS } from "@/components/stocks/data"
import { isFeasible } from "@/components/cuisine/utils"
import { CuisineHeader } from "@/components/cuisine/cuisine-header"
import { CuisineKpis } from "@/components/cuisine/cuisine-kpis"
import { CuisineFilters, type ViewMode } from "@/components/cuisine/cuisine-filters"
import { RecipesGrid } from "@/components/cuisine/recipes-grid"
import { RecipesTable } from "@/components/cuisine/recipes-table"
import { RecipeDetail } from "@/components/cuisine/recipe-detail"
import { useRecipeStore } from "@/stores/recipe-store"
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

export default function CuisinePage() {
  usePageTitle("Cuisine")
  const navigate = useNavigate()
  const products = MOCK_PRODUCTS

  const recipes = useRecipeStore((s) => s.recipes)
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe)
  const duplicateRecipe = useRecipeStore((s) => s.duplicateRecipe)
  const toggleActive = useRecipeStore((s) => s.toggleActive)

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [categoryFilter, setCategoryFilter] = useState("toutes")
  const [feasibilityFilter, setFeasibilityFilter] = useState("tous")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  const filtered = useMemo(() => {
    let result = recipes

    if (categoryFilter !== "toutes") {
      result = result.filter((r) => r.category === categoryFilter)
    }

    if (feasibilityFilter === "realisable") {
      result = result.filter((r) => isFeasible(r.ingredients, products))
    } else if (feasibilityFilter === "non_realisable") {
      result = result.filter((r) => !isFeasible(r.ingredients, products))
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.name.toLowerCase().includes(q))
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, "fr"))
  }, [recipes, categoryFilter, feasibilityFilter, search, products])

  const handleSelectRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe)
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
      setSelectedRecipe((prev) =>
        prev?.id === recipe.id
          ? { ...prev, isActive: !prev.isActive }
          : prev
      )
    },
    [toggleActive]
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteRecipe(id)
      setSelectedRecipe((prev) => {
        if (prev?.id === id) {
          setDetailOpen(false)
          return null
        }
        return prev
      })
    },
    [deleteRecipe]
  )

  const handleExport = useCallback(() => {
    // no-op V1
  }, [])

  const handleAlertClick = useCallback(() => {
    setFeasibilityFilter("non_realisable")
  }, [])

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <CuisineHeader
          onExport={handleExport}
          onAddRecipe={() => navigate("/cuisine/nouvelle")}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <CuisineKpis
          recipes={recipes}
          products={products}
          onAlertClick={handleAlertClick}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <CuisineFilters
          categoryFilter={categoryFilter}
          feasibilityFilter={feasibilityFilter}
          search={search}
          viewMode={viewMode}
          onCategoryFilterChange={setCategoryFilter}
          onFeasibilityFilterChange={setFeasibilityFilter}
          onSearchChange={setSearch}
          onViewModeChange={setViewMode}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="min-h-0 flex-1">
        {viewMode === "grid" ? (
          <RecipesGrid
            recipes={filtered}
            products={products}
            onSelectRecipe={handleSelectRecipe}
          />
        ) : (
          <RecipesTable
            recipes={filtered}
            products={products}
            onSelectRecipe={handleSelectRecipe}
            onDuplicate={handleDuplicate}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        )}
      </motion.div>

      <RecipeDetail
        recipe={selectedRecipe}
        products={products}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />
    </motion.div>
  )
}
