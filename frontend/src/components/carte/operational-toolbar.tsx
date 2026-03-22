import { HugeiconsIcon } from "@hugeicons/react"
import { Pulse02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useCarteOperational } from "./operational-view-context"

export function OperationalToolbar() {
  const { stopEditing } = useCarteOperational()

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b px-4 backdrop-blur-md md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex items-center gap-3">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <h2 className="text-base font-semibold">Vue opérationnelle</h2>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Cliquez sur un produit ou une recette pour explorer
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={stopEditing}>
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
          Quitter
        </Button>
      </div>
    </header>
  )
}
