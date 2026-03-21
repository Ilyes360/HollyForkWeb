import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Layout03Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { PAGE_META } from "@/lib/copy/pages"
import { useCarteOperational } from "./operational-view-context"
import { useRecipeStore } from "@/stores/recipe-store"
import { useIsMobile } from "@/hooks/use-mobile"

interface CarteHeaderProps {
  onAddRecipe: () => void
}

export function CarteHeader({ onAddRecipe }: CarteHeaderProps) {
  const { isEditing, startEditing, stopEditing } = useCarteOperational()
  const recipes = useRecipeStore((s) => s.recipes)
  const isMobile = useIsMobile()

  const handleToggle = () => {
    if (isEditing) {
      stopEditing()
    } else {
      startEditing(recipes)
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      <h1 className="font-display text-lg font-semibold tracking-tight">{PAGE_META.carte.title}</h1>
      <span className="text-sm text-muted-foreground">
        {PAGE_META.carte.subtitle}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {!isMobile && (
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={handleToggle}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={Layout03Icon} className="size-3.5" strokeWidth={2} />
            Vue op.
          </Button>
        )}
        <Button onClick={onAddRecipe}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Nouvelle recette
        </Button>
      </div>
    </div>
  )
}
