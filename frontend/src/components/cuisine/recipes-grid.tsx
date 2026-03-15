import type { Product } from "@/components/stocks/types"
import type { Recipe } from "./types"
import { RecipeCard } from "./recipe-card"

interface RecipesGridProps {
  recipes: Recipe[]
  products: Product[]
  onSelectRecipe: (recipe: Recipe) => void
}

export function RecipesGrid({ recipes, products, onSelectRecipe }: RecipesGridProps) {
  if (recipes.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
        Aucune recette trouvée.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          products={products}
          onClick={onSelectRecipe}
        />
      ))}
    </div>
  )
}
