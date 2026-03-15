import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { usePlanningEdition } from "./planning-context"

export function ServiceConfigPopover() {
  const { serviceConfig, setServiceConfig } = usePlanningEdition()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(serviceConfig)

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(serviceConfig)
    setOpen(isOpen)
  }

  const handleApply = () => {
    setServiceConfig({
      ...draft,
      journee: { start: draft.midi.start, end: draft.soir.end },
    })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <HugeiconsIcon icon={Clock01Icon} className="size-3.5" strokeWidth={2} />
            Horaires
          </Button>
        }
      />
      <PopoverContent align="start" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Horaires des services</PopoverTitle>
        </PopoverHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <span className="text-xs font-medium">Midi</span>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={draft.midi.start}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, midi: { ...d.midi, start: e.target.value } }))
                }
                className="h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input
                type="time"
                value={draft.midi.end}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, midi: { ...d.midi, end: e.target.value } }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium">Soir</span>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={draft.soir.start}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, soir: { ...d.soir, start: e.target.value } }))
                }
                className="h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <Input
                type="time"
                value={draft.soir.end}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, soir: { ...d.soir, end: e.target.value } }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          <Button size="sm" className="w-full" onClick={handleApply}>
            Appliquer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
