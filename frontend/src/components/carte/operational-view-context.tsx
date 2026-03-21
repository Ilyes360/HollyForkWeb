import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react"
import type { Recipe } from "@/components/carte/types"

interface OperationalViewContextValue {
  isEditing: boolean
  startEditing: (recipes: Recipe[]) => void
  stopEditing: () => void
  hoveredProductId: string | null
  hoveredProductName: string | null
  setHoveredProduct: (id: string | null, name?: string) => void
  hoveredRecipeId: string | null
  hoveredRecipeName: string | null
  setHoveredRecipe: (id: string | null, name?: string) => void
  productToRecipeIds: Map<string, string[]>
  recipeToProductIds: Map<string, string[]>
}

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
  productToRecipeIds: new Map(),
  recipeToProductIds: new Map(),
})

export function CarteOperationalProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null)
  const [hoveredProductName, setHoveredProductName] = useState<string | null>(null)
  const [hoveredRecipeId, setHoveredRecipeId] = useState<string | null>(null)
  const [hoveredRecipeName, setHoveredRecipeName] = useState<string | null>(null)

  const startEditing = useCallback((r: Recipe[]) => {
    setRecipes(r)
    setIsEditing(true)
  }, [])

  const stopEditing = useCallback(() => {
    setIsEditing(false)
    setHoveredProductId(null)
    setHoveredRecipeId(null)
  }, [])

  const setHoveredProduct = useCallback((id: string | null, name?: string) => {
    setHoveredProductId(id)
    setHoveredProductName(id ? (name ?? null) : null)
  }, [])

  const setHoveredRecipe = useCallback((id: string | null, name?: string) => {
    setHoveredRecipeId(id)
    setHoveredRecipeName(id ? (name ?? null) : null)
  }, [])

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
      productToRecipeIds,
      recipeToProductIds,
    }),
    [isEditing, startEditing, stopEditing, hoveredProductId, hoveredProductName, setHoveredProduct, hoveredRecipeId, hoveredRecipeName, setHoveredRecipe, productToRecipeIds, recipeToProductIds]
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
