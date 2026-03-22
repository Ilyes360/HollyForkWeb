import { useState, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import type {
  Recipe,
  RecipePortionInfo,
  IngredientPortionInfo,
} from "@/components/carte/types"
import { getFoodCostColor } from "@/components/carte/utils"
import type { Product } from "@/components/stock/types"
import { UNIT_LABELS } from "@/components/stock/types"
import type { SupplierFull } from "@/components/commandes/types"
import { getProductStatus } from "@/components/stock/utils"
import { formatCurrency } from "@/components/stock/utils"
import { IngredientIcon } from "./ingredient-icon"
import { useCarteOperational } from "./operational-view-context"
import { cn } from "@/lib/utils"

const PORTION_REFERENCE = 30

const BLOCK_COLORS = {
  rupture: { bg: "rgba(226,75,74,0.10)", bgStrong: "rgba(226,75,74,0.16)", border: "rgba(226,75,74,0.2)", text: "#A32D2D" },
  stock_faible: { bg: "rgba(239,159,39,0.08)", bgStrong: "rgba(239,159,39,0.16)", border: "rgba(239,159,39,0.2)", text: "#BA7517" },
  stock_ok: { bg: "rgba(0,0,0,0.03)", bgStrong: "rgba(0,0,0,0.03)", border: "transparent", text: "inherit" },
  surstock: { bg: "rgba(0,0,0,0.03)", bgStrong: "rgba(0,0,0,0.03)", border: "transparent", text: "inherit" },
} as const

interface CarteRecipeCardProps {
  recipe: Recipe
  portionInfo: RecipePortionInfo
  products: Product[]
  suppliers: SupplierFull[]
  allRecipes: Recipe[]
  rank: number | null
  onClick: (recipeId: string) => void
  onSelectProduct: (productId: string) => void
  index?: number
}

export function CarteRecipeCard({
  recipe,
  portionInfo,
  products,
  suppliers,
  allRecipes,
  rank,
  onClick,
  onSelectProduct,
  index = 0,
}: CarteRecipeCardProps) {
  const [manualExpanded, setManualExpanded] = useState(false)
  const opView = useCarteOperational()

  // In operational mode, cards are always expanded
  const expanded = opView.isEditing ? true : manualExpanded

  const isRupture = portionInfo.maxPortions === 0
  const isStockFaible = portionInfo.maxPortions > 0 && portionInfo.maxPortions < 10

  const hasIngredientProblems = portionInfo.ingredientDetails.some((d) => {
    const product = products.find((p) => p.id === d.productId)
    if (!product) return true
    const s = getProductStatus(product)
    return s === "rupture" || s === "stock_faible"
  })
  const hasProblems = isRupture || isStockFaible || hasIngredientProblems

  const sorted = [...portionInfo.ingredientDetails].sort((a, b) => {
    if (a.isLimiting) return -1
    if (b.isLimiting) return 1
    return a.portionsAllowed - b.portionsAllowed
  })

  const alertIngredients: IngredientPortionInfo[] = []
  const okIngredients: IngredientPortionInfo[] = []
  for (const d of sorted) {
    const product = products.find((p) => p.id === d.productId)
    const status = product ? getProductStatus(product) : "rupture"
    if (status === "rupture" || status === "stock_faible") {
      alertIngredients.push(d)
    } else {
      okIngredients.push(d)
    }
  }

  const limitingProduct = portionInfo.limitingIngredient
    ? products.find((p) => p.id === portionInfo.limitingIngredient!.productId)
    : null
  const limitingSupplier = limitingProduct
    ? suppliers.find((s) => s.id === limitingProduct.supplierId)
    : null
  const limitingStatus = limitingProduct ? getProductStatus(limitingProduct) : null

  const barPercent = Math.min(100, (portionInfo.maxPortions / PORTION_REFERENCE) * 100)
  const barFillColor = isRupture ? "#E24B4A" : isStockFaible ? "#EF9F27" : "#97C459"
  const barTrackColor = isRupture
    ? "rgba(226,75,74,0.12)"
    : isStockFaible ? "rgba(239,159,39,0.12)" : "rgba(0,0,0,0.08)"

  const portionTextColor = isRupture ? "#A32D2D" : isStockFaible ? "#BA7517" : "#639922"

  const cardStyle: React.CSSProperties = {
    padding: "12px 14px",
    maxWidth: 420,
    ...(isRupture && { backgroundColor: "rgba(226,75,74,0.04)", borderColor: "rgba(226,75,74,0.15)" }),
    ...(isStockFaible && { backgroundColor: "rgba(239,159,39,0.04)", borderColor: "rgba(239,159,39,0.15)" }),
  }

  const totalIngredients = sorted.length

  // ── Badge "À risque dans N jours" ──
  const daysAtRiskInfo = useMemo(() => {
    let minDays = Infinity
    for (const d of portionInfo.ingredientDetails) {
      const product = products.find((p) => p.id === d.productId)
      if (!product || !product.rotation || product.rotation === 0) continue
      const days = product.quantity / product.rotation
      if (days < minDays) minDays = days
    }
    if (minDays === Infinity || minDays >= 5) return null
    return { days: Math.round(minDays), isUrgent: minDays < 3 }
  }, [portionInfo.ingredientDetails, products])

  // ── Operational view: visibility logic ──
  const {
    isEditing, isLocked,
    lockedProductId, lockedRecipeId,
    hoveredProductId, hoveredRecipeId,
    chainState,
  } = opView

  // Lock mode: hide non-matching cards
  if (isEditing && isLocked) {
    if (chainState.visibleRecipeIds && !chainState.visibleRecipeIds.has(recipe.id)) {
      return null
    }
    if (lockedRecipeId && !chainState.visibleRecipeIds && recipe.id !== lockedRecipeId) {
      return null
    }
  }

  // Hover preview: dim non-matching cards (opacity 30%)
  const isDimmed = isEditing && !isLocked && hoveredProductId
    ? !recipe.ingredients.some((i) => i.productId === hoveredProductId)
    : false
  const isHighlighted = isEditing && isLocked && (
    lockedProductId ? recipe.ingredients.some((i) => i.productId === lockedProductId) : recipe.id === lockedRecipeId
  )

  // ── Click handler ──
  const handleCardClick = () => {
    if (!isEditing) {
      onClick(recipe.id)
      return
    }
    if (!isLocked) {
      opView.lockRecipe(recipe.id, recipe.name)
      return
    }
    if (lockedProductId) {
      // Product locked, clicking a recipe → drill down (chain)
      opView.pushChainEntry({ type: "recipe", id: recipe.id, name: recipe.name })
      return
    }
    if (lockedRecipeId === recipe.id) {
      opView.unlock()
      return
    }
    opView.lockRecipe(recipe.id, recipe.name)
  }

  const handleIngredientClick = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation()
    onSelectProduct(productId)
  }

  return (
    <motion.div
      layout
      data-recipe-id={recipe.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{
        duration: 0.25,
        delay: index * 0.03,
        ease: [0.25, 0.1, 0.25, 1],
        layout: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
      }}
      style={isDimmed ? { opacity: 0.3, transition: "opacity 200ms ease" } : undefined}
      onMouseEnter={() => isEditing && opView.setHoveredRecipe(recipe.id, recipe.name)}
      onMouseLeave={() => isEditing && opView.setHoveredRecipe(null)}
    >
      <Card
        role="article"
        aria-label={`${recipe.name} — ${portionInfo.maxPortions} portions`}
        className={cn(
          "cursor-pointer overflow-visible rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          isHighlighted && "ring-2 ring-primary/30 shadow-md"
        )}
        style={cardStyle}
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => { if (e.key === "Enter") handleCardClick() }}
      >
        {/* Header: Name + Price/FC + Portions */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] leading-[1.3] font-medium">{recipe.name}</h3>
            <div className="mt-px flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                {formatCurrency(recipe.sellingPrice)}
                {" · "}
                <span className={cn("font-medium", getFoodCostColor(portionInfo.foodCostPercent))}>
                  {portionInfo.foodCostPercent.toFixed(1)}%
                </span>
              </span>
              {rank !== null && portionInfo.maxPortions > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-px text-[10px] text-muted-foreground">
                  ☆ #{rank}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span
                className="text-[26px] leading-none font-medium tabular-nums"
                style={{ color: portionTextColor }}
              >
                {portionInfo.maxPortions}
              </span>
              {daysAtRiskInfo && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: daysAtRiskInfo.isUrgent ? "rgba(226,75,74,0.12)" : "rgba(239,159,39,0.12)",
                    color: daysAtRiskInfo.isUrgent ? "#A32D2D" : "#BA7517",
                  }}
                >
                  ~{daysAtRiskInfo.days}j
                </span>
              )}
            </div>
            <p className="mt-px text-[9px] text-muted-foreground">portions</p>
          </div>
        </div>

        {/* Progress bar + expand toggle */}
        <div className="mt-0 flex items-center gap-2">
          <div
            className="h-[6px] flex-1 overflow-hidden rounded-full"
            style={{ backgroundColor: barTrackColor }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${barPercent}%`, backgroundColor: barFillColor }}
            />
          </div>

          {/* Chevron toggle — hidden in operational mode */}
          {totalIngredients > 0 && !isEditing && (
            <button
              type="button"
              className="shrink-0 cursor-pointer transition-colors hover:text-foreground"
              aria-label={manualExpanded ? "Masquer les ingrédients" : "Voir les ingrédients"}
              onClick={(e) => { e.stopPropagation(); setManualExpanded(!manualExpanded) }}
            >
              <span className={cn(
                "flex size-6 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground transition-transform",
                manualExpanded && "rotate-180"
              )}>
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" strokeWidth={2} />
              </span>
            </button>
          )}
        </div>

        {/* Expanded ingredients */}
        {expanded && (
          <div className="mt-1.5">
            {hasProblems ? (
              <>
                {alertIngredients.length === 1 ? (
                  <IngredientBlock d={alertIngredients[0]} products={products} onClick={handleIngredientClick} />
                ) : alertIngredients.length > 1 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {alertIngredients.map((d) => (
                      <IngredientBlock key={d.productId} d={d} products={products} onClick={handleIngredientClick} />
                    ))}
                  </div>
                ) : null}
                {okIngredients.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {okIngredients.map((d) => (
                      <IngredientChip key={d.productId} d={d} products={products} onClick={handleIngredientClick} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {sorted.map((d) => (
                  <IngredientChip key={d.productId} d={d} products={products} onClick={handleIngredientClick} />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

// ── Sub-components ──

function IngredientBlock({
  d, products, onClick,
}: {
  d: IngredientPortionInfo
  products: Product[]
  onClick: (e: React.MouseEvent, productId: string) => void
}) {
  const product = products.find((p) => p.id === d.productId)
  if (!product) return null
  const prodStatus = getProductStatus(product)
  const colors = BLOCK_COLORS[prodStatus]

  return (
    <div
      className="flex cursor-pointer items-center gap-2 rounded-lg transition-shadow hover:ring-1 hover:ring-border"
      style={{
        padding: "5px 7px",
        backgroundColor: d.isLimiting ? colors.bgStrong : colors.bg,
        border: d.isLimiting ? `0.5px solid ${colors.border}` : undefined,
      }}
      onClick={(e) => onClick(e, d.productId)}
    >
      <IngredientIcon product={product} size="md" />
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium" style={{ color: colors.text }}>{d.productName}</p>
        <p className="text-[10px] leading-none text-muted-foreground">
          {d.portionsAllowed} port. · {product.quantity} {UNIT_LABELS[product.unit]} dispo
        </p>
      </div>
    </div>
  )
}

function IngredientChip({
  d, products, onClick,
}: {
  d: IngredientPortionInfo
  products: Product[]
  onClick: (e: React.MouseEvent, productId: string) => void
}) {
  const product = products.find((p) => p.id === d.productId)
  if (!product) return null
  const name = d.productName

  return (
    <span
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-secondary px-2 py-0.5 transition-shadow hover:ring-1 hover:ring-border"
      onClick={(e) => onClick(e, d.productId)}
    >
      <IngredientIcon product={product} size="sm" />
      <span className="text-[10px] text-muted-foreground">
        {name.length > 8 ? name.slice(0, 8) + "." : name} · {d.portionsAllowed}p
      </span>
    </span>
  )
}
