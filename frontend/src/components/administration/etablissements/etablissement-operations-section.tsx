import type { UseFormReturn } from "react-hook-form"
import { useFieldArray } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { DAY_LABELS } from "../types"
import type { DayOfWeek } from "@/components/planning/types"

const ALL_DAYS: DayOfWeek[] = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
]

interface EtablissementOperationsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
}

export function EtablissementOperationsSection({ form }: EtablissementOperationsSectionProps) {
  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "services",
  })

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="capacity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Capacité totale (couverts)</FormLabel>
            <FormControl>
              <Input type="number" min={1} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <FormLabel>Services</FormLabel>
        {serviceFields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            <FormField
              control={form.control}
              name={`services.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Nom du service" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`services.${index}.startTime`}
              render={({ field }) => (
                <FormItem className="w-28">
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`services.${index}.endTime`}
              render={({ field }) => (
                <FormItem className="w-28">
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => removeService(index)}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendService({ id: `svc-${Date.now()}`, name: "", startTime: "10:00", endTime: "15:00" })
          }
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          Ajouter un service
        </Button>
      </div>

      <FormField
        control={form.control}
        name="openingDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jours d'ouverture</FormLabel>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = (field.value as string[])?.includes(day)
                return (
                  <Button
                    key={day}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const current = (field.value as string[]) || []
                      field.onChange(
                        isSelected
                          ? current.filter((d: string) => d !== day)
                          : [...current, day]
                      )
                    }}
                  >
                    {DAY_LABELS[day]}
                  </Button>
                )
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
