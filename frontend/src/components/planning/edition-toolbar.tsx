import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { ServiceConfigPopover } from "./service-config-popover"

interface EditionToolbarProps {
  isDirty: boolean
  onCancel: () => void
  onSave: () => void
}

export function EditionToolbar({
  isDirty,
  onCancel,
  onSave,
}: EditionToolbarProps) {
  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b px-4 backdrop-blur-md md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-semibold">Modifier le planning</h2>
        <ServiceConfigPopover />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onCancel}>
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
          Annuler
        </Button>
        <Button onClick={onSave} disabled={!isDirty}>
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            className="size-4"
            strokeWidth={2}
          />
          Enregistrer
        </Button>
      </div>
    </header>
  )
}
