import { useSalleStore } from "./store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TABLE_TYPE_LABELS } from "./constants"
import { DECORATION_TYPE_LABELS } from "./decoration-presets"
import type { TableType } from "./types"

const ZONE_COLOR_SWATCHES = ["#3b82f6", "#22c55e", "#8b5cf6", "#f97316", "#ef4444", "#6b7280"]

export function PropertiesPanel() {
  const selectedIds = useSalleStore((s) => s.selectedIds)
  const elements = useSalleStore((s) => s.plan.elements)
  const updateElement = useSalleStore((s) => s.updateElement)
  const removeElements = useSalleStore((s) => s.removeElements)

  const element = elements.find((el) => el.id === selectedIds[0])
  if (!element) return null

  return (
    <div className="absolute right-4 top-4 z-10 w-56 rounded-lg border bg-background p-3 shadow-md">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Propriétés
      </h4>

      {element.kind === "table" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h5 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Identité</h5>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  value={element.label}
                  onChange={(e) => updateElement(element.id, { label: e.target.value })}
                  className="mt-1 h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Numéro</Label>
                <Input
                  type="number"
                  min={1}
                  value={element.number}
                  onChange={(e) =>
                    updateElement(element.id, { number: parseInt(e.target.value) || 1 })
                  }
                  className="mt-1 h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={element.type}
                  onValueChange={(v) => updateElement(element.id, { type: v as TableType })}
                >
                  <SelectTrigger className="mt-1 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TABLE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="space-y-1">
            <h5 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Dimensions</h5>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Largeur</Label>
                  <Input
                    type="number"
                    min={40}
                    value={Math.round(element.width)}
                    onChange={(e) =>
                      updateElement(element.id, { width: Math.max(40, parseInt(e.target.value) || 40) })
                    }
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Hauteur</Label>
                  <Input
                    type="number"
                    min={40}
                    value={Math.round(element.height)}
                    onChange={(e) =>
                      updateElement(element.id, { height: Math.max(40, parseInt(e.target.value) || 40) })
                    }
                    className="mt-1 h-7 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Places</Label>
                <Input
                  type="number"
                  min={1}
                  value={element.seats}
                  onChange={(e) =>
                    updateElement(element.id, { seats: parseInt(e.target.value) || 1 })
                  }
                  className="mt-1 h-7 text-xs"
                />
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="space-y-1">
            <h5 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Apparence</h5>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Rotation</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={Math.round(element.rotation)}
                    onChange={(e) => updateElement(element.id, { rotation: parseInt(e.target.value) || 0 })}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                  <Input
                    type="number"
                    value={Math.round(element.rotation)}
                    onChange={(e) => updateElement(element.id, { rotation: parseInt(e.target.value) || 0 })}
                    className="h-7 w-14 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {element.kind === "wall" && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Epaisseur</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={element.thickness}
              onChange={(e) =>
                updateElement(element.id, { thickness: parseInt(e.target.value) || 4 })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      )}

      {element.kind === "zone" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nom</Label>
              <Input
                value={element.name}
                onChange={(e) => updateElement(element.id, { name: e.target.value })}
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Couleur</Label>
              <div className="mt-1 flex items-center gap-1.5">
                {ZONE_COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    className={`size-5 rounded-full border-2 transition-transform hover:scale-110 ${element.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => updateElement(element.id, { color: c })}
                  />
                ))}
                <input
                  type="color"
                  value={element.color}
                  onChange={(e) => updateElement(element.id, { color: e.target.value })}
                  className="ml-1 size-5 cursor-pointer rounded border-0 p-0"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Opacite</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={Math.round(element.opacity * 100)}
                  onChange={(e) => updateElement(element.id, { opacity: parseInt(e.target.value) / 100 })}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
                <span className="w-10 text-right text-xs text-muted-foreground">{Math.round(element.opacity * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {element.kind === "decoration" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h5 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Identité</h5>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  value={element.label}
                  onChange={(e) => updateElement(element.id, { label: e.target.value })}
                  className="mt-1 h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {DECORATION_TYPE_LABELS[element.decorationType] ?? element.decorationType}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="space-y-1">
            <h5 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Dimensions</h5>
            <div className="space-y-3">
              {element.shapeType === "rect" && element.width != null && element.height != null && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Largeur</Label>
                    <Input
                      type="number"
                      min={20}
                      value={Math.round(element.width)}
                      onChange={(e) => updateElement(element.id, { width: Math.max(20, parseInt(e.target.value) || 20) })}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Hauteur</Label>
                    <Input
                      type="number"
                      min={20}
                      value={Math.round(element.height)}
                      onChange={(e) => updateElement(element.id, { height: Math.max(20, parseInt(e.target.value) || 20) })}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                </div>
              )}
              {element.shapeType === "circle" && element.radius != null && (
                <div>
                  <Label className="text-xs">Rayon</Label>
                  <Input
                    type="number"
                    min={8}
                    value={Math.round(element.radius)}
                    onChange={(e) => updateElement(element.id, { radius: Math.max(8, parseInt(e.target.value) || 8) })}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
              )}
              {element.shapeType === "line" && (
                <div>
                  <Label className="text-xs">Épaisseur</Label>
                  <Input
                    type="number"
                    min={2}
                    max={40}
                    value={element.thickness ?? 4}
                    onChange={(e) => updateElement(element.id, { thickness: parseInt(e.target.value) || 4 })}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          <Separator className="my-3" />

          <div className="space-y-1">
            <h5 className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Apparence</h5>
            <div>
              <Label className="text-xs">Rotation</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={Math.round(element.rotation)}
                  onChange={(e) => updateElement(element.id, { rotation: parseInt(e.target.value) || 0 })}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
                <Input
                  type="number"
                  value={Math.round(element.rotation)}
                  onChange={(e) => updateElement(element.id, { rotation: parseInt(e.target.value) || 0 })}
                  className="h-7 w-14 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <Button
        variant="destructive"
        size="sm"
        className="mt-4 w-full text-xs"
        onClick={() => removeElements([element.id])}
      >
        Supprimer
      </Button>
    </div>
  )
}
