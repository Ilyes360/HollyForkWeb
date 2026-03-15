import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TABLE_PRESETS, WALL_PRESET, ZONE_PRESET, TABLE_TYPE_LABELS, type PaletteCategory } from "./constants"
import { PaletteItem } from "./palette-item"

const CATEGORY_LABELS: Record<PaletteCategory, string> = {
  tables: "Tables",
  murs: "Murs",
  zones: "Zones",
}

export function ObjectPalette() {
  const [category, setCategory] = useState<PaletteCategory | "all">("all")

  const showTables = category === "all" || category === "tables"
  const showWalls = category === "all" || category === "murs"
  const showZones = category === "all" || category === "zones"

  return (
    <Sidebar collapsible="none" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <h3 className="flex-1 text-sm font-semibold">Objets</h3>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as PaletteCategory | "all")}
          >
            <SelectTrigger className="h-7 w-auto shrink-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="p-1">
              <SelectItem value="all">Tous</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-4 py-3">
            {showTables && (
              <>
                <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tables
                </p>
                {TABLE_PRESETS.map((preset, i) => {
                  if (preset.kind !== "table") return null
                  const label = `${TABLE_TYPE_LABELS[preset.type]} ${preset.seats}p`
                  return <PaletteItem key={`table-${i}`} preset={preset} label={label} />
                })}
              </>
            )}
            {showWalls && (
              <>
                <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Murs
                </p>
                <PaletteItem preset={WALL_PRESET} label="Mur" />
              </>
            )}
            {showZones && (
              <>
                <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Zones
                </p>
                <PaletteItem preset={ZONE_PRESET} label="Zone" />
              </>
            )}
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}
