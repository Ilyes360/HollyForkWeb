import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react"
import type { Recipe } from "@/components/carte/types"

// ── Types ──

interface ImpactChainEntry {
  type: "product" | "recipe"
  id: string
  name: string
}

interface ChainState {
  sidebarProductIds: Set<string> | null
  visibleRecipeIds: Set<string> | null
}

interface OperationalViewContextValue {
  // Mode
  isEditing: boolean
  startEditing: (recipes: Recipe[]) => void
  stopEditing: () => void

  // Hover (preview)
  hoveredProductId: string | null
  hoveredProductName: string | null
  setHoveredProduct: (id: string | null, name?: string) => void
  hoveredRecipeId: string | null
  hoveredRecipeName: string | null
  setHoveredRecipe: (id: string | null, name?: string) => void

  // Lock
  lockedProductId: string | null
  lockedProductName: string | null
  lockedRecipeId: string | null
  lockedRecipeName: string | null
  lockProduct: (id: string, name: string) => void
  lockRecipe: (id: string, name: string) => void
  unlock: () => void
  isLocked: boolean

  // Impact chain
  impactChain: ImpactChainEntry[]
  pushChainEntry: (entry: ImpactChainEntry) => void
  popChainEntry: () => void
  clearChain: () => void
  chainState: ChainState

  // Expand in place
  expandedRecipeId: string | null
  setExpandedRecipe: (id: string | null) => void

  // Index maps
  productToRecipeIds: Map<string, string[]>
  recipeToProductIds: Map<string, string[]>
}

const EMPTY_CHAIN_STATE: ChainState = { sidebarProductIds: null, visibleRecipeIds: null }

const CarteOperationalContext = createContext<OperationalViewContextValue>({
  isEditing: false,
  startEditing: () => {},
  stopEditing: () => {},
  hoveredProductId: null,
  hoveredProductName: null,
  setHoveredProduct: () => {},
  hoveredRecipeId: null,
  hoveredRecipeName: null,
  setHoveredRecipe: () => {},
  lockedProductId: null,
  lockedProductName: null,
  lockedRecipeId: null,
  lockedRecipeName: null,
  lockProduct: () => {},
  lockRecipe: () => {},
  unlock: () => {},
  isLocked: false,
  impactChain: [],
  pushChainEntry: () => {},
  popChainEntry: () => {},
  clearChain: () => {},
  chainState: EMPTY_CHAIN_STATE,
  expandedRecipeId: null,
  setExpandedRecipe: () => {},
  productToRecipeIds: new Map(),
  recipeToProductIds: new Map(),
})

export function CarteOperationalProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])

  // Hover
  const [hoveredProductId, setHoveredProductIdRaw] = useState<string | null>(null)
  const [hoveredProductName, setHoveredProductName] = useState<string | null>(null)
  const [hoveredRecipeId, setHoveredRecipeIdRaw] = useState<string | null>(null)
  const [hoveredRecipeName, setHoveredRecipeName] = useState<string | null>(null)

  // Lock
  const [lockedProductId, setLockedProductId] = useState<string | null>(null)
  const [lockedProductName, setLockedProductName] = useState<string | null>(null)
  const [lockedRecipeId, setLockedRecipeId] = useState<string | null>(null)
  const [lockedRecipeName, setLockedRecipeName] = useState<string | null>(null)

  // Chain
  const [impactChain, setImpactChain] = useState<ImpactChainEntry[]>([])

  // Expand
  const [expandedRecipeId, setExpandedRecipe] = useState<string | null>(null)

  const isLocked = lockedProductId !== null || lockedRecipeId !== null

  // ── Callbacks ──

  const clearHovers = useCallback(() => {
    setHoveredProductIdRaw(null)
    setHoveredProductName(null)
    setHoveredRecipeIdRaw(null)
    setHoveredRecipeName(null)
  }, [])

  const startEditing = useCallback((r: Recipe[]) => {
    setRecipes(r)
    setIsEditing(true)
  }, [])

  const stopEditing = useCallback(() => {
    setIsEditing(false)
    clearHovers()
    setLockedProductId(null)
    setLockedProductName(null)
    setLockedRecipeId(null)
    setLockedRecipeName(null)
    setImpactChain([])
    setExpandedRecipe(null)
  }, [clearHovers])

  const setHoveredProduct = useCallback((id: string | null, name?: string) => {
    // No hover while locked
    if (lockedProductId !== null || lockedRecipeId !== null) return
    setHoveredProductIdRaw(id)
    setHoveredProductName(id ? (name ?? null) : null)
  }, [lockedProductId, lockedRecipeId])

  const setHoveredRecipe = useCallback((id: string | null, name?: string) => {
    if (lockedProductId !== null || lockedRecipeId !== null) return
    setHoveredRecipeIdRaw(id)
    setHoveredRecipeName(id ? (name ?? null) : null)
  }, [lockedProductId, lockedRecipeId])

  const lockProduct = useCallback((id: string, name: string) => {
    setLockedProductId(id)
    setLockedProductName(name)
    setLockedRecipeId(null)
    setLockedRecipeName(null)
    clearHovers()
    setImpactChain([{ type: "product", id, name }])
    setExpandedRecipe(null)
  }, [clearHovers])

  const lockRecipe = useCallback((id: string, name: string) => {
    setLockedRecipeId(id)
    setLockedRecipeName(name)
    setLockedProductId(null)
    setLockedProductName(null)
    clearHovers()
    setImpactChain([{ type: "recipe", id, name }])
  }, [clearHovers])

  const unlock = useCallback(() => {
    setLockedProductId(null)
    setLockedProductName(null)
    setLockedRecipeId(null)
    setLockedRecipeName(null)
    clearHovers()
    setImpactChain([])
    setExpandedRecipe(null)
  }, [clearHovers])

  const pushChainEntry = useCallback((entry: ImpactChainEntry) => {
    setImpactChain((prev) => [...prev, entry])
    if (entry.type === "recipe") {
      setLockedRecipeId(entry.id)
      setLockedRecipeName(entry.name)
      // Keep lockedProductId from original chain root
    }
  }, [])

  const popChainEntry = useCallback(() => {
    setImpactChain((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.slice(0, -1)
      const last = next[next.length - 1]
      if (last.type === "product") {
        setLockedRecipeId(null)
        setLockedRecipeName(null)
      } else {
        setLockedRecipeId(last.id)
        setLockedRecipeName(last.name)
      }
      return next
    })
    setExpandedRecipe(null)
  }, [])

  const clearChain = useCallback(() => {
    setImpactChain([])
    unlock()
  }, [unlock])

  // ── Index maps ──

  const productToRecipeIds = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const r of recipes) {
      for (const ing of r.ingredients) {
        const list = map.get(ing.productId)
        if (list) list.push(r.id)
        else map.set(ing.productId, [r.id])
      }
    }
    return map
  }, [recipes])

  const recipeToProductIds = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const r of recipes) {
      map.set(r.id, r.ingredients.map((i) => i.productId))
    }
    return map
  }, [recipes])

  // ── Chain state derivation ──

  const chainState = useMemo<ChainState>(() => {
    if (impactChain.length === 0) return EMPTY_CHAIN_STATE

    const lastEntry = impactChain[impactChain.length - 1]

    if (lastEntry.type === "product") {
      const recipeIds = new Set(productToRecipeIds.get(lastEntry.id) ?? [])
      return { sidebarProductIds: null, visibleRecipeIds: recipeIds }
    }

    // type === "recipe"
    const productIds = new Set(recipeToProductIds.get(lastEntry.id) ?? [])
    const recipeIds = new Set<string>()
    for (const pid of productIds) {
      for (const rid of (productToRecipeIds.get(pid) ?? [])) {
        recipeIds.add(rid)
      }
    }
    return { sidebarProductIds: productIds, visibleRecipeIds: recipeIds }
  }, [impactChain, productToRecipeIds, recipeToProductIds])

  // ── Value ──

  const value = useMemo(
    () => ({
      isEditing,
      startEditing,
      stopEditing,
      hoveredProductId,
      hoveredProductName,
      setHoveredProduct,
      hoveredRecipeId,
      hoveredRecipeName,
      setHoveredRecipe,
      lockedProductId,
      lockedProductName,
      lockedRecipeId,
      lockedRecipeName,
      lockProduct,
      lockRecipe,
      unlock,
      isLocked,
      impactChain,
      pushChainEntry,
      popChainEntry,
      clearChain,
      chainState,
      expandedRecipeId,
      setExpandedRecipe,
      productToRecipeIds,
      recipeToProductIds,
    }),
    [
      isEditing, startEditing, stopEditing,
      hoveredProductId, hoveredProductName, setHoveredProduct,
      hoveredRecipeId, hoveredRecipeName, setHoveredRecipe,
      lockedProductId, lockedProductName, lockedRecipeId, lockedRecipeName,
      lockProduct, lockRecipe, unlock, isLocked,
      impactChain, pushChainEntry, popChainEntry, clearChain, chainState,
      expandedRecipeId, setExpandedRecipe,
      productToRecipeIds, recipeToProductIds,
    ]
  )

  return (
    <CarteOperationalContext value={value}>
      {children}
    </CarteOperationalContext>
  )
}

export function useCarteOperational() {
  return useContext(CarteOperationalContext)
}
