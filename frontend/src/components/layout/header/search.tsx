import * as React from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, CommandIcon } from "@hugeicons/core-free-icons"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { navItems } from "@/components/layout/sidebar/nav-main"

export function Search() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <div className="lg:flex-1">
      <div className="relative hidden max-w-sm flex-1 lg:block">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          className="h-9 w-full cursor-pointer rounded-md border pr-4 pl-10 text-sm shadow-xs"
          placeholder="Rechercher..."
          type="search"
          onFocus={() => setOpen(true)}
        />
        <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
          <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-3" />
          <span>k</span>
        </div>
      </div>
      <div className="block lg:hidden">
        <Button size="icon-sm" variant="ghost" onClick={() => setOpen(true)}>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
        </Button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="sr-only">
          <DialogHeader>
            <DialogTitle>Rechercher</DialogTitle>
          </DialogHeader>
        </div>
        <CommandInput placeholder="Rechercher une page..." />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          {navItems.map((group, i) => (
            <React.Fragment key={group.label}>
              <CommandGroup heading={group.label}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.to}
                    onSelect={() => {
                      setOpen(false)
                      navigate(item.to)
                    }}
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {i < navItems.length - 1 && <CommandSeparator />}
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  )
}
