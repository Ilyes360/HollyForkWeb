import type { UseFormReturn } from "react-hook-form"
import { useFieldArray, useWatch } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { ZONE_TYPE_LABELS } from "../types"
import type { StorageZoneType } from "../types"

interface EtablissementZonesSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

export function EtablissementZonesSection({ form }: EtablissementZonesSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "storageZones",
  })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <ZoneRow key={field.id} form={form} index={index} onRemove={() => remove(index)} />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            id: `zone-${Date.now()}`,
            name: "",
            slug: "",
            type: "dry",
          })
        }
      >
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
        Ajouter une zone
      </Button>
    </div>
  )
}

function ZoneRow({
  form,
  index,
  onRemove,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  index: number
  onRemove: () => void
}) {
  const zoneType = useWatch({ control: form.control, name: `storageZones.${index}.type` })
  const showTemp = zoneType === "cold" || zoneType === "cellar"

  return (
    <div className="grid grid-cols-[1fr_7rem_5rem_2.25rem] gap-2 items-center">
      <Input
        placeholder="Nom de la zone"
        {...form.register(`storageZones.${index}.name`)}
      />
      <Select
        value={zoneType}
        onValueChange={(v) => form.setValue(`storageZones.${index}.type`, v, { shouldDirty: true })}
      >
        <SelectTrigger>
          <SelectValue>
            {ZONE_TYPE_LABELS[zoneType as StorageZoneType] ?? "Type"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ZONE_TYPE_LABELS) as StorageZoneType[]).map((key) => (
            <SelectItem key={key} value={key}>
              {ZONE_TYPE_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showTemp ? (
        <Input
          type="number"
          placeholder="°C"
          {...form.register(`storageZones.${index}.targetTemperature`, { valueAsNumber: true })}
        />
      ) : (
        <div />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9"
        onClick={onRemove}
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
      </Button>
    </div>
  )
}
