import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { PAGE_META } from "@/lib/copy/pages"
import { useCarteOperational } from "./operational-view-context"
import { useRecipeStore } from "@/stores/recipe-store"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface CarteHeaderProps {
  onAddRecipe: () => void
}

export function CarteHeader({ onAddRecipe }: CarteHeaderProps) {
  const { isEditing, startEditing } = useCarteOperational()
  const recipes = useRecipeStore((s) => s.recipes)
  const isMobile = useIsMobile()

  return (
    <div className="flex shrink-0 items-center gap-3">
      {/* Toggle pill — only shown when NOT in operational mode (toolbar takes over) */}
      {!isMobile && !isEditing && (
        <button
          type="button"
          onClick={() => startEditing(recipes)}
          className="group flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/80 hover:text-foreground"
        >
          <span className="relative flex size-2">
            <span className="relative inline-flex size-2 rounded-full bg-muted-foreground/40 group-hover:bg-emerald-500 transition-colors" />
          </span>
          Vue op.
        </button>
      )}

      <h1 className="font-display text-lg font-semibold tracking-tight">{PAGE_META.carte.title}</h1>
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {PAGE_META.carte.subtitle}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Button onClick={onAddRecipe}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Nouvelle recette
        </Button>
      </div>
    </div>
  )
}
