import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface CuisineHeaderProps {
  onExport: () => void
  onAddRecipe: () => void
}

export function CuisineHeader({ onExport, onAddRecipe }: CuisineHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <h1 className="font-display text-lg font-semibold tracking-tight">Cuisine</h1>
      <span className="text-sm text-muted-foreground">
        Gérez vos recettes et votre carte
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" onClick={onExport}>
          Exporter
        </Button>
        <Button onClick={onAddRecipe}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Nouvelle recette
        </Button>
      </div>
    </div>
  )
}
