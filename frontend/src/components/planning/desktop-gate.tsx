import { HugeiconsIcon } from "@hugeicons/react"
import { ComputerIcon } from "@hugeicons/core-free-icons"

export function DesktopGate() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background p-8 min-[1280px]:hidden">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <HugeiconsIcon
            icon={ComputerIcon}
            className="size-8 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <h2 className="text-lg font-semibold">Écran trop petit</h2>
        <p className="text-sm text-muted-foreground">
          L'éditeur de planning nécessite un écran d'au moins 1280px de large.
          Veuillez utiliser un ordinateur de bureau ou agrandir votre fenêtre.
        </p>
      </div>
    </div>
  )
}
